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
  const pool = new Pool({
    connectionString: requireEnv(cfg.connectionStringEnvVar),
    max: POOL_MAX,
    idleTimeoutMillis: POOL_IDLE_MS,
  })
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
  const pool = new Pool({
    ...(clientOpts as PoolConfig),
    user: requireEnv(cfg.iamUserEnvVar),
    database: cfg.database,
    max: POOL_MAX,
    idleTimeoutMillis: POOL_IDLE_MS,
  } satisfies PoolConfig)
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
