# @cbrl/log

PII-safe structured logger plus a per-request context on `AsyncLocalStorage`.
Framework-agnostic: it runs on Node and works with the standard `Request`, so it
fits Next.js route handlers, server actions, jobs and plain HTTP servers alike.

```sh
pnpm add @cbrl/log
```

## Logger

```ts
import { logger } from '@cbrl/log'

logger.info('order created', { orderId: 'ord_123', items: 3 })
logger.warn('slow query', { ms: 1840 })
logger.error('payment failed', { orderId: 'ord_123', err })
```

- `NODE_ENV` is `production` or `test`: one JSON line per call, ready for Cloud
  Logging / Vercel log drains:

  ```json
  {
    "severity": "ERROR",
    "level": "error",
    "message": "payment failed",
    "ts": "2026-01-02T03:04:05.000Z",
    "correlationId": "4bf9…",
    "orderId": "ord_123",
    "err": { "name": "Error", "message": "…", "stack": "…" }
  }
  ```

- Otherwise (local dev): one colored line, `03:04:05 ERROR payment failed {"orderId":…}`.
- `warn` and `error` go to stderr; `debug` and `info` go to stdout.
- `severity`, `level`, `message` and `ts` are reserved: meta cannot overwrite them.

Need more keys redacted? Build your own instance:

```ts
import { createLogger } from '@cbrl/log'

export const logger = createLogger({ piiKeys: ['fullName', 'birthDate'] })
```

`piiKeys` extends the defaults; it never replaces them.

## PII policy

Never log personal data. Under the LGPD (Lei 13.709/2018) every log line holding
an email, phone number or CPF is personal data you now have to justify, protect,
retain for a bounded time and erase on request — and logs are copied to drains,
dashboards and third-party tools you cannot clean up. Log **identifiers**
(`userId`, `orderId`, `orgId`) instead, and look the person up in the database
when you need to.

The logger enforces that as defence in depth:

- **Redaction by key.** Any value under a PII key is replaced by `[redacted]`,
  at any depth (nested objects, arrays), matched case-insensitively against the
  exact key name. `null`/`undefined` stay as they are. The default set
  (`DEFAULT_PII_KEYS`) covers `email`, `phone`, `mobile`, `whatsapp`, `document`,
  `cpf`, `cnpj`, `password`, `secret`, `token`, `accesstoken`/`access_token`,
  `refreshtoken`/`refresh_token`, `apikey`/`api_key`, `authorization`, `cookie`,
  `set-cookie`, `ip` and `x-forwarded-for`.
- **Error normalization.** An `Error` is reduced to `name`, `message`, `stack`
  and a string `code` (e.g. a Postgres SQLSTATE). Everything else is dropped,
  because driver fields like `detail` echo row values
  (`Key (email)=(ana@…) already exists`).
- Dates become ISO strings, bigints become strings, circular references become
  `[circular]`.

Redaction is a safety net, not a licence: it cannot see personal data inside
free text (a `message`, an error `message`, a key it does not know). Keep
personal data out of log messages in the first place.

## Request context

Every log line includes the string fields of the active context, starting with
its `correlationId`.

```ts
import { logger, setRequestContextField, withRequestContext } from '@cbrl/log'

async function handler(request: Request): Promise<Response> {
  const session = await auth(request)
  setRequestContextField('orgId', session.orgId)
  logger.info('listing orders') // carries correlationId + orgId
  return Response.json(await listOrders(session.orgId))
}

export const GET = withRequestContext(handler)
```

`withRequestContext(handler)` takes the correlation id from the first argument's
headers, in order: `x-cloud-trace-context` (trace id), `traceparent` (W3C trace
id), `x-request-id`, `x-vercel-id`; with none (or no `Request`), it mints a
`crypto.randomUUID()`. Arguments and return value pass through untouched.

| Export                               | Use                                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `withRequestContext(handler)`        | Route handlers `(request: Request, ...rest) => Response \| Promise<Response>`                           |
| `withActionContext(fn)`              | Async code without a `Request` (server actions, jobs); reuses an outer scope when nested                |
| `runWithRequestContext(ctx, fn)`     | Open a scope by hand: `runWithRequestContext({ correlationId: messageId }, () => consume())`            |
| `getRequestContext()`                | The active `RequestContext` (`{ correlationId } & Record<string, string \| undefined>`), or `undefined` |
| `setRequestContextField(key, value)` | Add, change or clear (`undefined`) a field on the active scope; no-op outside one                       |
| `correlationIdFromHeaders(headers)`  | The header lookup above, on its own                                                                     |

`correlationId` is fixed for the scope: `setRequestContextField('correlationId', …)`
throws. `runWithRequestContext` copies the context it receives, and fields set
inside a nested `withActionContext` do not leak to the outer scope.

## Ban `console.*` in apps

With every log going through this package, turn on ESLint's core `no-console`
rule in the app so raw `console.log` cannot creep back in (`@cbrl/eslint-config`
does not enable it for you):

```js
// eslint.config.mjs
import baseConfig from '@cbrl/eslint-config'

export default [...baseConfig, { rules: { 'no-console': 'error' } }]
```

Scripts and CLIs that legitimately print to the terminal can opt out with a
`files`-scoped override, e.g. `{ files: ['scripts/**'], rules: { 'no-console': 'off' } }`.
