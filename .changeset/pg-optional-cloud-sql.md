---
'@cbrl/pg': minor
---

Move Cloud SQL IAM auth to the `@cbrl/pg/cloud-sql` subpath so password-only apps build without `@google-cloud/cloud-sql-connector`.

0.1.0 imported the connector dynamically from the main entry, which Next.js (Turbopack) still tries to resolve at build time: apps without the connector failed with `Module not found`. The main entry no longer references it.

**Breaking:** `PoolEnvConfig` drops `iamAuthEnvVar`, `instanceEnvVar` and `iamUserEnvVar`. Password mode needs only `connectionStringEnvVar` and `database`. For IAM, pass `iam: cloudSqlIam({ enabledEnvVar, instanceEnvVar, userEnvVar })` from `@cbrl/pg/cloud-sql` and add `@google-cloud/cloud-sql-connector` to your dependencies.
