# @cbrl/env

Fail-fast readers for environment variables. A missing required variable throws
at startup instead of running with a silent default.

```sh
pnpm add @cbrl/env
```

```ts
import { readEnvFlag, requireEnv, requireEnvNumber, requireEnvOneOf } from '@cbrl/env'

const databaseUrl = requireEnv('DATABASE_URL') // throws if unset or empty
const port = requireEnvNumber('PORT') // throws unless a finite number > 0
const migrationUrl = requireEnvOneOf('POSTGRES_URL_NON_POOLING', 'POSTGRES_URL')
const billingEnabled = readEnvFlag('BILLING_ENABLED') // true only for 'true' or '1'
```

Pairs with the `cbrl/no-env-value-fallback` rule of `@cbrl/eslint-config`, which
bans `process.env.X ?? 'literal'`.
