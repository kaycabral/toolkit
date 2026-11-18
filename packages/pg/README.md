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
- **Cloud SQL IAM** (optional): passwordless auth through
  `@google-cloud/cloud-sql-connector`, loaded only when enabled.

```sh
pnpm add @cbrl/pg pg
pnpm add @google-cloud/cloud-sql-connector   # only for Cloud SQL IAM mode
```

```ts
import { getOrCreateManagedPoolSync, supabaseSsl, type PoolEnvConfig } from '@cbrl/pg'

const config: PoolEnvConfig = {
  connectionStringEnvVar: 'DATABASE_URL',
  iamAuthEnvVar: 'DATABASE_USE_IAM_AUTH', // 'true' switches to Cloud SQL IAM
  instanceEnvVar: 'CLOUDSQL_INSTANCE',
  iamUserEnvVar: 'IAM_DB_USER',
  database: 'app',
  passwordModeSsl: supabaseSsl,
}

export const db = () => getOrCreateManagedPoolSync(config).pool
```

In IAM mode the pool must be opened asynchronously at boot with
`initManagedPool(config)` (for example in Next.js `instrumentation.ts`);
`getOrCreateManagedPoolSync` then returns it. Other exports: `createManagedPool`,
`createManagedPoolSync`, `closeManagedPool`, `stripSslParams`,
`SUPABASE_ROOT_CA_2021`.
