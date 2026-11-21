# @cbrl/pg

A `pg` pool factory with production defaults, so each app does not rediscover them:

- **Bounded timeouts** (connect, statement, query, idle-in-transaction) and TCP
  keepalive: a stalled connection fails fast instead of wedging the pool.
- **Idle-client `error` handler**: a server-side disconnect (`57P01`) is logged
  instead of crashing the process with `uncaughtException`.
- **Process-wide registry** on `globalThis`: one pool per database even when the
  bundler duplicates the module across chunks (Next.js instrumentation vs routes).
- **Supabase TLS**: verify-full against the pinned Supabase root CA, with the
  URL's `ssl*` params stripped so they cannot override it.
- **Postgres error helpers**: find the SQLSTATE behind wrapped errors.
- **Drizzle** (optional): `@cbrl/pg/drizzle` wires a schema, migrations and
  `drizzle-kit` credentials on top of the pool. Only that subpath imports
  `drizzle-orm`.

```sh
pnpm add @cbrl/pg pg
```

```ts
import { getOrCreateManagedPool, supabaseSsl, type PoolEnvConfig } from '@cbrl/pg'

const config: PoolEnvConfig = {
  connectionStringEnvVar: 'DATABASE_URL',
  database: 'app',
  ssl: supabaseSsl,
}

export const pool = () => getOrCreateManagedPool(config).pool
```

Other pool exports: `createManagedPool` (unregistered pool), `closeManagedPool`,
`stripSslParams` and `SUPABASE_ROOT_CA_2021`.

## Drizzle

```sh
pnpm add drizzle-orm
```

```ts
// src/db.ts
import { supabaseSsl } from '@cbrl/pg'
import { createDrizzleDatabase } from '@cbrl/pg/drizzle'
import * as schema from './schema'

export const appDb = createDrizzleDatabase({
  connectionStringEnvVar: 'POSTGRES_URL',
  database: 'app',
  ssl: supabaseSsl,
  schema,
  migrationsFolder: new URL('../drizzle', import.meta.url),
  // migrationsTable: '__drizzle_migrations_app', // when several journals share a database
})

appDb.db() // NodePgDatabase<typeof schema>, cached per pool
appDb.pool() // the registered pg Pool, for raw SQL and transactions
await appDb.ping() // select 1
await appDb.close()
```

Nothing is opened until the first call, so the factory is safe at module scope.
Call `appDb.pool()` at boot to fail fast on a missing connection string.

`migrate()` applies pending migrations on the registered pool. Transaction
poolers do not support the migrator's advisory lock, so a migration script
usually passes the session/direct URL, which runs on a dedicated pool (same TLS
policy) closed afterwards:

```ts
// scripts/migrate.ts
import { requireEnvOneOf } from '@cbrl/env'
import { appDb } from '../src/db'

await appDb.migrate({
  connectionString: requireEnvOneOf('POSTGRES_URL_NON_POOLING', 'POSTGRES_URL'),
})
```

Never migrate at app boot: with N instances the advisory lock races.

`drizzleKitCredentials` builds `dbCredentials` from the first env var that is
set, with the Supabase CA pinned:

```ts
// drizzle.config.ts
import { drizzleKitCredentials } from '@cbrl/pg/drizzle'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './drizzle',
  dbCredentials: drizzleKitCredentials('POSTGRES_URL_NON_POOLING', 'POSTGRES_URL'),
})
```

## Errors

```ts
import { isForeignKeyViolation, isUniqueViolation, PG_ERROR, pgErrorOf } from '@cbrl/pg'

try {
  await insertUser(input)
} catch (err) {
  if (isUniqueViolation(err, 'users_email_key')) return { error: 'email_taken' }
  if (isForeignKeyViolation(err)) return { error: 'missing_reference' }
  throw err
}

pgErrorOf(err) // { code?: '23505', constraint?: 'users_email_key' }
```

`pgErrorOf` walks `.cause` chains (Drizzle wraps the `pg` error) with cycle
protection and only accepts five-character SQLSTATE codes. `PG_ERROR` names the
integrity-constraint codes: `NOT_NULL_VIOLATION`, `FOREIGN_KEY_VIOLATION`,
`UNIQUE_VIOLATION`, `CHECK_VIOLATION` and `EXCLUSION_VIOLATION`.

Runtimes that park the original error somewhere else (e.g. a fiber failure
under a symbol) plug in an `unwrap` hook; return `undefined` to follow `.cause`:

```ts
const unwrap = (value: object) => extractParkedError(value) // unknown | undefined

pgErrorOf(err, { unwrap })
isUniqueViolation(err, undefined, { unwrap })
```
