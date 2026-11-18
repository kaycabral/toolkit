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
- **Cloud SQL IAM** (optional): passwordless auth via `@cbrl/pg/cloud-sql`. Only
  that subpath depends on `@google-cloud/cloud-sql-connector`, so password-only
  apps never bundle or install it.

```sh
pnpm add @cbrl/pg pg
```

```ts
import { getOrCreateManagedPoolSync, supabaseSsl, type PoolEnvConfig } from '@cbrl/pg'

const config: PoolEnvConfig = {
  connectionStringEnvVar: 'DATABASE_URL',
  database: 'app',
  passwordModeSsl: supabaseSsl,
}

export const db = () => getOrCreateManagedPoolSync(config).pool
```

## Cloud SQL IAM

```sh
pnpm add @google-cloud/cloud-sql-connector
```

```ts
import { initManagedPool, type PoolEnvConfig } from '@cbrl/pg'
import { cloudSqlIam } from '@cbrl/pg/cloud-sql'

const config: PoolEnvConfig = {
  connectionStringEnvVar: 'DATABASE_URL', // still used locally and in CI
  database: 'app',
  iam: cloudSqlIam({
    enabledEnvVar: 'DATABASE_USE_IAM_AUTH', // 'true' in production
    instanceEnvVar: 'CLOUDSQL_INSTANCE',
    userEnvVar: 'IAM_DB_USER',
  }),
}

// Next.js instrumentation.ts: IAM pools open asynchronously at boot.
export async function register() {
  await initManagedPool(config)
}
```

After `initManagedPool`, `getOrCreateManagedPoolSync(config)` returns the boot
pool. Other exports: `createManagedPool`, `createManagedPoolSync`,
`closeManagedPool`, `stripSslParams`, `SUPABASE_ROOT_CA_2021`, and the `IamAuth`
type for other providers.
