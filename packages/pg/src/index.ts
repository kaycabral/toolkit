import { requireEnv } from '@cbrl/env'
import { AuthTypes, Connector, IpAddressTypes } from '@google-cloud/cloud-sql-connector'
import { Pool, type PoolConfig } from 'pg'

/**
 * Shared Postgres pool factory for the monorepo's Cloud SQL databases (oilio
 * event store + the sovereign product base). Both connect to the SAME instance
 * (`oilio-db`, 1 instance / 2 logical DBs) and want the SAME connection policy —
 * so the IAM-vs-password decision lives here once, not duplicated per package.
 *
 * Two modes, picked by `<PREFIX>_USE_IAM_AUTH`:
 *
 *   - **Production (IAM, passwordless):** the Cloud SQL Node connector dials the
 *     instance's PRIVATE IP directly over the VPC (Direct VPC egress on the Cloud
 *     Run service) and authenticates with the runtime service account's IAM token
 *     — no password, nothing to leak or rotate. Requires the SA to hold
 *     `roles/cloudsql.client` + `roles/cloudsql.instanceUser` and to exist as a
 *     DB-level IAM user. Pool creation is async (the connector resolves socket
 *     options over the network).
 *
 *   - **Local / CI (password):** a plain connection string against the ephemeral
 *     docker / `services: postgres` instance, which has no IAM auth. Synchronous.
 *
 * Lazy + small (ADR 0011 D4): callers create the pool on first use, `max: 5` so a
 * serverless instance doesn't exhaust Cloud SQL connections.
 */

const POOL_MAX = 5
const POOL_IDLE_MS = 600_000

/**
 * Attach the REQUIRED idle-client error handler to a `pg` Pool.
 *
 * `pg` emits `'error'` on the Pool when an IDLE client's connection drops on the
 * server side — Cloud SQL recycling a connection (maintenance/failover/idle
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

/** Inputs that vary per database; everything else is shared policy. */
export type PoolEnvConfig = {
  /**
   * Env var holding the connection string in password mode (local/CI), e.g.
   * `OILIO_DATABASE_URL` or `DATABASE_URL`.
   */
  readonly connectionStringEnvVar: string
  /**
   * Env var that, when `'true'`, switches this pool to IAM auth. Distinct per
   * database so one can flip independently, e.g. `OILIO_USE_IAM_AUTH`.
   */
  readonly iamAuthEnvVar: string
  /**
   * Env var holding the Cloud SQL connection name (`project:region:instance`)
   * for the connector, e.g. `OILIO_CLOUDSQL_INSTANCE`.
   */
  readonly instanceEnvVar: string
  /**
   * Env var holding the IAM DB user (the runtime SA email WITHOUT the
   * `.gserviceaccount.com` suffix), e.g. `OILIO_IAM_DB_USER`.
   */
  readonly iamUserEnvVar: string
  /** Logical database name to connect to in IAM mode, e.g. `oilio`. */
  readonly database: string
}

/** A pool plus the connector that backs it (IAM mode); both must be closed. */
export type ManagedPool = {
  readonly pool: Pool
  /** Tear down the pool and (in IAM mode) the connector. */
  readonly close: () => Promise<void>
}

function iamEnabled(cfg: PoolEnvConfig): boolean {
  return process.env[cfg.iamAuthEnvVar] === 'true'
}

/** Build the password-mode pool (plain connection string). Always synchronous. */
function createPasswordPool(cfg: PoolEnvConfig): ManagedPool {
  const pool = attachPoolErrorHandler(
    new Pool({
      connectionString: requireEnv(cfg.connectionStringEnvVar),
      max: POOL_MAX,
      idleTimeoutMillis: POOL_IDLE_MS,
    }),
    cfg.database,
  )
  return { pool, close: () => pool.end() }
}

/**
 * Build a managed pool for the given database. Async because IAM mode resolves
 * connector socket options over the network; password mode resolves immediately.
 * Production (Cloud Run boot) calls this. Tests/local can use the sync variant.
 */
export async function createManagedPool(cfg: PoolEnvConfig): Promise<ManagedPool> {
  if (!iamEnabled(cfg)) return createPasswordPool(cfg)

  const connector = new Connector()
  const clientOpts = await connector.getOptions({
    instanceConnectionName: requireEnv(cfg.instanceEnvVar),
    authType: AuthTypes.IAM,
    ipType: IpAddressTypes.PRIVATE,
  })
  const pool = attachPoolErrorHandler(
    new Pool({
      ...(clientOpts as PoolConfig),
      user: requireEnv(cfg.iamUserEnvVar),
      database: cfg.database,
      max: POOL_MAX,
      idleTimeoutMillis: POOL_IDLE_MS,
    } satisfies PoolConfig),
    cfg.database,
  )
  return {
    pool,
    close: async () => {
      await pool.end()
      connector.close()
    },
  }
}

/**
 * Synchronous pool for password mode (local/CI/tests against the ephemeral
 * Postgres). Throws in IAM mode — IAM requires the async connector, so prod must
 * eager-init via {@link createManagedPool} at boot, never this. Lets the ~270
 * synchronous domain/test call-sites keep a sync getter with no boot ceremony.
 */
export function createManagedPoolSync(cfg: PoolEnvConfig): ManagedPool {
  if (iamEnabled(cfg)) {
    throw new Error(
      `${cfg.iamAuthEnvVar}=true requires async init (Cloud SQL IAM connector). ` +
        'Call createManagedPool() at boot, not the sync variant.',
    )
  }
  return createPasswordPool(cfg)
}
