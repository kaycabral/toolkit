import { requireEnvOneOf } from '@cbrl/env'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate as runMigrator } from 'drizzle-orm/node-postgres/migrator'
import { fileURLToPath } from 'node:url'
import type { Pool } from 'pg'
import { closeManagedPool, getOrCreateManagedPool, openPool, type PoolEnvConfig } from './pool'
import { stripSslParams, supabaseSsl } from './supabase'

/** Pool config plus the Drizzle schema and migrations of one database. */
export type DrizzleDatabaseConfig<TSchema extends Record<string, unknown>> = PoolEnvConfig & {
  /** The Drizzle schema module, e.g. `import * as schema from './schema'`. */
  readonly schema: TSchema
  /**
   * Folder with the `drizzle-kit generate` output. Pass a `file:` URL to resolve
   * it relative to the caller: `new URL('../drizzle', import.meta.url)`.
   */
  readonly migrationsFolder: string | URL
  /**
   * Journal table, for databases that hold several independently migrated
   * schemas. Defaults to Drizzle's `__drizzle_migrations`.
   */
  readonly migrationsTable?: string
}

export type MigrateOptions = {
  /**
   * Run against this connection string on a dedicated pool, closed afterwards,
   * instead of the registered one. Use it for the session/direct URL or an owner
   * role: transaction poolers do not support the migrator's advisory lock.
   */
  readonly connectionString?: string
}

export type DrizzleDatabase<TSchema extends Record<string, unknown>> = {
  /** Drizzle client bound to the schema. Lazily opens the pool. */
  readonly db: () => NodePgDatabase<TSchema>
  /** The registered `pg` pool, for raw SQL and transactions Drizzle does not cover. */
  readonly pool: () => Pool
  /** Round-trip `select 1`: health check and keep-alive. */
  readonly ping: () => Promise<void>
  /** Close the registered pool. No-op if never opened. */
  readonly close: () => Promise<void>
  /**
   * Apply pending migrations. Never call this at app boot: with N instances the
   * migrator's advisory lock races.
   */
  readonly migrate: (options?: MigrateOptions) => Promise<void>
}

/**
 * Drizzle on top of the `@cbrl/pg` registered pool. Nothing is opened until the
 * first call, so this is safe at module scope; call `pool()` at boot to fail
 * fast on a missing connection string.
 */
export function createDrizzleDatabase<TSchema extends Record<string, unknown>>(
  config: DrizzleDatabaseConfig<TSchema>,
): DrizzleDatabase<TSchema> {
  const { schema, migrationsFolder, migrationsTable, ...poolConfig } = config
  const dbByPool = new WeakMap<Pool, NodePgDatabase<TSchema>>()

  const pool = (): Pool => getOrCreateManagedPool(poolConfig).pool

  const db = (): NodePgDatabase<TSchema> => {
    const current = pool()
    const cached = dbByPool.get(current)
    if (cached) return cached
    const built = drizzle(current, { schema })
    dbByPool.set(current, built)
    return built
  }

  const migrationConfig = {
    migrationsFolder:
      typeof migrationsFolder === 'string' ? migrationsFolder : fileURLToPath(migrationsFolder),
    ...(migrationsTable === undefined ? {} : { migrationsTable }),
  }

  return {
    db,
    pool,
    ping: async () => {
      await pool().query('select 1')
    },
    close: () => closeManagedPool(poolConfig),
    migrate: async (options = {}) => {
      if (options.connectionString === undefined) {
        await runMigrator(db(), migrationConfig)
        return
      }
      const dedicated = openPool(options.connectionString, poolConfig.database, poolConfig.ssl)
      try {
        await runMigrator(drizzle(dedicated.pool, { schema }), migrationConfig)
      } finally {
        await dedicated.close()
      }
    },
  }
}

/** `dbCredentials` for `drizzle.config.ts`. */
export type DrizzleKitCredentials = {
  readonly url: string
  readonly ssl?: { readonly ca: string }
}

/**
 * Build `dbCredentials` for `drizzle-kit` from the first env var that is set,
 * so list the session/direct URL first (e.g. `POSTGRES_URL_NON_POOLING`, then
 * `POSTGRES_URL`). Supabase hosts get the pinned root CA and lose their URL
 * `ssl*` params, which would otherwise override it. Throws if none is set.
 */
export function drizzleKitCredentials(...envVarNames: readonly string[]): DrizzleKitCredentials {
  const url = requireEnvOneOf(...envVarNames)
  const ssl = supabaseSsl(url)
  return ssl === undefined ? { url } : { url: stripSslParams(url), ssl }
}
