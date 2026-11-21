---
'@cbrl/pg': minor
---

Drop Cloud SQL IAM support, add Postgres error helpers and the `@cbrl/pg/drizzle` subpath. **Breaking:** the `@cbrl/pg/cloud-sql` subpath, the `@google-cloud/cloud-sql-connector` peer dependency, `IamAuth`, `IamConnection`, `PoolEnvConfig.iam` and the async `createManagedPool`/`initManagedPool` are gone; `createManagedPoolSync` is now `createManagedPool`, `getOrCreateManagedPoolSync` is now `getOrCreateManagedPool`, and `PoolEnvConfig.passwordModeSsl` is now `ssl`. New on the root entry: `PG_ERROR`, `pgErrorOf(err, { unwrap })`, `isUniqueViolation` and `isForeignKeyViolation`. New `@cbrl/pg/drizzle` (optional `drizzle-orm` peer): `createDrizzleDatabase({ connectionStringEnvVar, database, ssl, schema, migrationsFolder, migrationsTable })` returning `db`, `pool`, `ping`, `close` and `migrate({ connectionString })`, plus `drizzleKitCredentials(...envVarNames)` for `drizzle.config.ts`.
