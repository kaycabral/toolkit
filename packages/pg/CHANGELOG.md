# @cbrl/pg

## 0.3.0

### Minor Changes

- [#18](https://github.com/kaycabral/toolkit/pull/18) [`c0cad1f`](https://github.com/kaycabral/toolkit/commit/c0cad1fa2c68463d9a7407945775b5eac1a58026) Thanks [@kaycabral](https://github.com/kaycabral)! - Drop Cloud SQL IAM support, add Postgres error helpers and the `@cbrl/pg/drizzle` subpath. **Breaking:** the `@cbrl/pg/cloud-sql` subpath, the `@google-cloud/cloud-sql-connector` peer dependency, `IamAuth`, `IamConnection`, `PoolEnvConfig.iam` and the async `createManagedPool`/`initManagedPool` are gone; `createManagedPoolSync` is now `createManagedPool`, `getOrCreateManagedPoolSync` is now `getOrCreateManagedPool`, and `PoolEnvConfig.passwordModeSsl` is now `ssl`. New on the root entry: `PG_ERROR`, `pgErrorOf(err, { unwrap })`, `isUniqueViolation` and `isForeignKeyViolation`. New `@cbrl/pg/drizzle` (optional `drizzle-orm` peer): `createDrizzleDatabase({ connectionStringEnvVar, database, ssl, schema, migrationsFolder, migrationsTable })` returning `db`, `pool`, `ping`, `close` and `migrate({ connectionString })`, plus `drizzleKitCredentials(...envVarNames)` for `drizzle.config.ts`.

### Patch Changes

- Updated dependencies [[`2a2777a`](https://github.com/kaycabral/toolkit/commit/2a2777a64bf04738bbd20fe7fc7bd6e85064909d)]:
  - @cbrl/env@0.1.1

## 0.2.0

### Minor Changes

- [#1](https://github.com/kaycabral/toolkit/pull/1) [`fe68622`](https://github.com/kaycabral/toolkit/commit/fe68622210a6bc23600705ca1d19c59b9de456b1) Thanks [@kaycabral](https://github.com/kaycabral)! - Move Cloud SQL IAM auth to the `@cbrl/pg/cloud-sql` subpath so password-only apps build without `@google-cloud/cloud-sql-connector`.
  
  0.1.0 imported the connector dynamically from the main entry, which Next.js (Turbopack) still tries to resolve at build time: apps without the connector failed with `Module not found`. The main entry no longer references it.
  
  **Breaking:** `PoolEnvConfig` drops `iamAuthEnvVar`, `instanceEnvVar` and `iamUserEnvVar`. Password mode needs only `connectionStringEnvVar` and `database`. For IAM, pass `iam: cloudSqlIam({ enabledEnvVar, instanceEnvVar, userEnvVar })` from `@cbrl/pg/cloud-sql` and add `@google-cloud/cloud-sql-connector` to your dependencies.
