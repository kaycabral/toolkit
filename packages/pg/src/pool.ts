import { requireEnv } from '@cbrl/env'
import { Pool, type PoolConfig } from 'pg'
import { stripSslParams } from './supabase'

/**
 * Hardened `pg` pool factory: one connection policy (timeouts, idle-error
 * handling, process-wide registry, TLS) shared by every database a consumer
 * opens, so it is not re-derived per app.
 *
 * Pools connect with a plain connection string (local docker, CI service,
 * Supabase pooler). Pass `ssl: supabaseSsl` to verify Supabase hosts against the
 * pinned root CA.
 *
 * Lazy + small: callers create the pool on first use, `max: 5` so a serverless
 * instance doesn't exhaust database connections.
 */

const POOL_MAX = 5
const POOL_IDLE_MS = 600_000

/**
 * Defensive timeouts — a pool with none is non-deterministic under I/O
 * contention: a single connection that stalls (a `57P01` administrative
 * termination leaving a half-open socket, a query blocked under load) is NEVER
 * reclaimed, and with `max: 5` a few zombies exhaust the pool and freeze EVERY
 * subsequent write. That is the classic "passes locally, flakes in CI": fast
 * local I/O never stalls a connection, so the gap stays latent; the CI Postgres
 * (ephemeral, contended) stalls one and the freeze cascades (a ~30s dead window
 * that timed out four unrelated write-path E2E specs at once). These bound every
 * failure mode so a stuck connection fails fast and self-heals instead of
 * wedging the pool:
 *
 *  - `connectionTimeoutMillis`: `pool.connect()` rejects instead of waiting
 *    forever for a slot — a request errors (recoverable) rather than hanging.
 *  - `statement_timeout` / `query_timeout`: a stalled query aborts (server- and
 *    client-side) and releases its client back to the pool.
 *  - `idle_in_transaction_session_timeout`: a `BEGIN`-ed transaction that stalls
 *    before COMMIT is killed by Postgres, freeing the held connection — the
 *    direct fix for the observed freeze.
 *  - `keepAlive`: TCP keepalives surface a half-open socket instead of blocking
 *    on a connection the server already dropped.
 *
 * Values are generous enough never to abort legitimate work yet finite, so a
 * wedged connection can't outlive a request.
 */
const POOL_TUNING = {
  connectionTimeoutMillis: 10_000,
  statement_timeout: 30_000,
  query_timeout: 30_000,
  idle_in_transaction_session_timeout: 15_000,
  keepAlive: true,
} as const satisfies Partial<PoolConfig>

/**
 * Attach the REQUIRED idle-client error handler to a `pg` Pool.
 *
 * `pg` emits `'error'` on the Pool when an IDLE client's connection drops on the
 * server side — the provider recycling a connection (maintenance/failover/idle
 * timeout), or the ephemeral test Postgres being torn down (`57P01`, "terminating
 * connection due to administrator command"). This is asynchronous: it is NOT
 * thrown from a query the app awaited, so a try/catch can't see it. With NO
 * listener, Node escalates the emitted error to an `uncaughtException` and KILLS
 * THE PROCESS — the whole server falls over on a single recycled idle connection.
 *
 * The handler logs and SWALLOWS: the pool already discards the failed client, and
 * the next `pool.query`/`connect` transparently opens a fresh one, so the dropped
 * idle connection is fully recoverable — there is nothing to do but not die. This
 * is the canonical `node-postgres` guidance (its docs show exactly this listener).
 */
function attachPoolErrorHandler(pool: Pool, database: string): Pool {
  pool.on('error', (err) => {
    // `pg` surfaces the SQLSTATE on `DatabaseError.code` (e.g. 57P01); the event
    // callback only types `err` as Error, so read `code` through a narrowing guard
    // (no unsafe assertion) and tolerate its absence.
    const code = 'code' in err && typeof err.code === 'string' ? err.code : undefined
    // Structured stderr line; never rethrow (rethrowing here re-escalates to
    // uncaughtException — the very crash this guards against).
    console.error(
      JSON.stringify({
        level: 'error',
        event: 'pg_pool_idle_client_error',
        database,
        message: err.message,
        code,
      }),
    )
  })
  return pool
}

/**
 * TLS policy resolved from the connection string, e.g. {@link supabaseSsl}.
 * Return `undefined` to leave TLS to the connection string.
 */
export type SslResolver = (connectionString: string) => PoolConfig['ssl'] | undefined

/** Inputs that vary per database; everything else is shared policy. */
export type PoolEnvConfig = {
  /** Env var holding the connection string, e.g. `DATABASE_URL`. */
  readonly connectionStringEnvVar: string
  /** Logical database name; also the registry key. */
  readonly database: string
  /**
   * Optional TLS policy, resolved from the connection string (e.g. pin a
   * provider's private root CA so `verify-full` works against a managed Postgres
   * such as Supabase). When it returns a value, the pool strips the URL's `ssl*`
   * params first (`pg` lets them override the `ssl` object).
   */
  readonly ssl?: SslResolver
}

/** An open pool plus its teardown. */
export type ManagedPool = {
  readonly pool: Pool
  /** End the pool. */
  readonly close: () => Promise<void>
}

/**
 * Open a pool with the shared policy against an explicit connection string.
 * Internal: also backs one-off pools (e.g. migrations against a direct URL).
 */
export function openPool(
  connectionString: string,
  database: string,
  ssl: SslResolver | undefined,
): ManagedPool {
  const resolvedSsl = ssl?.(connectionString)
  const pool = attachPoolErrorHandler(
    new Pool({
      // The resolver owns TLS when it returns a value: URL ssl params would override it.
      connectionString:
        resolvedSsl === undefined ? connectionString : stripSslParams(connectionString),
      ...(resolvedSsl === undefined ? {} : { ssl: resolvedSsl }),
      max: POOL_MAX,
      idleTimeoutMillis: POOL_IDLE_MS,
      ...POOL_TUNING,
    }),
    database,
  )
  return { pool, close: () => pool.end() }
}

/**
 * Process-wide registry of open pools, keyed by logical database name.
 *
 * WHY `globalThis` and not a module-level `let`: under the Next standalone
 * build, Turbopack code-splits by entry, so the instrumentation hook (which
 * eager-opens the pool at boot) and the route handlers (which read it per
 * request) can each load a SEPARATE copy of the consumer's `pool.ts` module —
 * each with its own module-level state. The boot copy gets the open pool; the
 * request copy sees `undefined` and opens a second pool.
 *
 * A registry hung off `globalThis` is a true singleton for the Node process —
 * there is exactly one `globalThis` regardless of how many times the module is
 * duplicated across chunks — so the pool opened at boot is the same one every
 * request sees. This is the canonical fix for the "duplicate module singleton"
 * hazard (the same reason Prisma/pg examples pin their client to globalThis).
 */
const REGISTRY = Symbol.for('@cbrl/pg.managedPools')

type PoolRegistry = Map<string, ManagedPool>

function registry(): PoolRegistry {
  const g = globalThis as typeof globalThis & { [REGISTRY]?: PoolRegistry }
  return (g[REGISTRY] ??= new Map<string, ManagedPool>())
}

/**
 * Build an unregistered pool from `cfg.connectionStringEnvVar`. Throws when the
 * env var is missing. Prefer {@link getOrCreateManagedPool} so the process
 * shares one pool per database.
 */
export function createManagedPool(cfg: PoolEnvConfig): ManagedPool {
  return openPool(requireEnv(cfg.connectionStringEnvVar), cfg.database, cfg.ssl)
}

/**
 * Return the pool registered for `cfg.database`, building and registering it
 * on first use. Call it at boot (e.g. `instrumentation.ts`) to fail fast on a
 * missing connection string; every duplicated copy of the consumer module then
 * sees the same pool.
 */
export function getOrCreateManagedPool(cfg: PoolEnvConfig): ManagedPool {
  const reg = registry()
  const existing = reg.get(cfg.database)
  if (existing) return existing
  const built = createManagedPool(cfg)
  reg.set(cfg.database, built)
  return built
}

/** Close and drop the registered pool for a database. No-op if absent. */
export async function closeManagedPool(cfg: Pick<PoolEnvConfig, 'database'>): Promise<void> {
  const reg = registry()
  const existing = reg.get(cfg.database)
  if (!existing) return
  reg.delete(cfg.database)
  await existing.close()
}
