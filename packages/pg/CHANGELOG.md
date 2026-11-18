# @cbrl/pg

## 0.2.0

### Minor Changes

- [#1](https://github.com/kaycabral/toolkit/pull/1) [`fe68622`](https://github.com/kaycabral/toolkit/commit/fe68622210a6bc23600705ca1d19c59b9de456b1) Thanks [@kaycabral](https://github.com/kaycabral)! - Move Cloud SQL IAM auth to the `@cbrl/pg/cloud-sql` subpath so password-only apps build without `@google-cloud/cloud-sql-connector`.
  
  0.1.0 imported the connector dynamically from the main entry, which Next.js (Turbopack) still tries to resolve at build time: apps without the connector failed with `Module not found`. The main entry no longer references it.
  
  **Breaking:** `PoolEnvConfig` drops `iamAuthEnvVar`, `instanceEnvVar` and `iamUserEnvVar`. Password mode needs only `connectionStringEnvVar` and `database`. For IAM, pass `iam: cloudSqlIam({ enabledEnvVar, instanceEnvVar, userEnvVar })` from `@cbrl/pg/cloud-sql` and add `@google-cloud/cloud-sql-connector` to your dependencies.
