# @cbrl/next

Building blocks every Next.js 16 app here repeats, in one place:

- **`@cbrl/next/config`** (Node-only, for `next.config.ts`): a shared CSP baseline,
  the security header set with **CSP reporting that actually reports**, the build
  commit SHA and the dev origins allowlist.
- **`@cbrl/next/server`** (Route Handlers): an uncached `/api/health` and a CSP
  report endpoint that strips personal data from reported URLs.
- **`@cbrl/next`** (isomorphic, safe in Client Components): `safeNext`, the
  open-redirect guard for `?next=` params.

```sh
pnpm add @cbrl/next
```

Peer dependency: `next ^16`.

## `next.config.ts`

```ts
import { commitSha, cspDirectives, devOrigins, withSecurityHeaders } from '@cbrl/next/config'
import type { NextConfig } from 'next'

const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : 'https://*.supabase.co'

const nextConfig: NextConfig = {
  typedRoutes: true,
  // Served by /api/health so a smoke test can check which commit is live.
  env: { NEXT_PUBLIC_COMMIT_SHA: commitSha() },
  // 127.0.0.1, <hostname>.local and the machine's LAN IPv4s.
  allowedDevOrigins: devOrigins(),
}

export default withSecurityHeaders(nextConfig, {
  csp: cspDirectives({
    'connect-src': [supabaseOrigin],
    'form-action': ['https://checkout.stripe.com'],
  }),
  cspMode: 'report-only',
  reportPath: '/api/csp-report',
})
```

`withSecurityHeaders` sets `poweredByHeader: false` and prepends one rule
(`source: '/:path*'` by default) to whatever `headers()` the config already has, so
an app rule for the same header key on a narrower path still wins.

### The CSP baseline

`cspDirectives(additions)` starts from:

```
default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self';
worker-src 'self' blob:; frame-src 'none'; frame-ancestors 'none'; object-src 'none';
base-uri 'self'; form-action 'self'
```

Additions are appended to the directive of the same name (keys are the CSP
directive names). Adding to a directive whose baseline is `'none'`, such as
`frame-src`, replaces the `'none'`. Unknown directives are added as given, with an
empty list emitting a bare directive (`'upgrade-insecure-requests': []`).
`buildCsp(directives)` serializes any directive map if you need the string.

### Headers

`securityHeaders({ csp, cspMode, reportPath })` returns:

| Header                                                            | Value                                                           |
| ----------------------------------------------------------------- | --------------------------------------------------------------- |
| `Strict-Transport-Security`                                       | `max-age=31536000; includeSubDomains; preload`                  |
| `X-Content-Type-Options`                                          | `nosniff`                                                       |
| `X-Frame-Options`                                                 | `DENY`                                                          |
| `Referrer-Policy`                                                 | `strict-origin-when-cross-origin`                               |
| `Permissions-Policy`                                              | `camera=(), microphone=(), geolocation=(), interest-cohort=()`  |
| `Content-Security-Policy-Report-Only` / `Content-Security-Policy` | the CSP, plus `report-uri <reportPath>; report-to csp-endpoint` |
| `Reporting-Endpoints` (only with `reportPath`)                    | `csp-endpoint="<reportPath>"`                                   |

A report-only CSP **without** `reportPath` blocks nothing and reports nothing; it
is only useful in the browser console. Always pass `reportPath`. Both `report-uri`
(Firefox, Safari) and `report-to` (Chromium) are emitted.

## Route Handlers

```ts
// app/api/health/route.ts
import { healthRoute } from '@cbrl/next/server'

import { pool } from '@/lib/db'

export const GET = healthRoute({
  ping: () => pool.query('SELECT 1'),
  timeoutMs: 4000,
  onError: (error) => logger.error({ err: error }, 'health ping failed'),
})
```

Responds `{ status: 'ok' | 'error', commit, database: 'ok' | 'unreachable' }` with
200 or 503. `commit` is `NEXT_PUBLIC_COMMIT_SHA`, else `VERCEL_GIT_COMMIT_SHA`, else
`null`. The handler awaits `connection()`, so it is never prerendered with Cache
Components, and sends `Cache-Control: no-store`. A ping that hangs longer than
`timeoutMs` counts as unreachable.

```ts
// app/api/csp-report/route.ts
import { cspReportRoute } from '@cbrl/next/server'

export const POST = cspReportRoute({
  onReport: (violation) => logger.warn(violation, 'csp violation'),
})
```

Accepts `application/csp-report` (`report-uri`), `application/reports+json`
(`report-to`) and `application/json`; anything else gets 415. Bodies over
`maxBytes` (64 KiB by default) get 413, invalid JSON 400, otherwise 204. Each
violation reaches `onReport` as:

```ts
interface CspViolation {
  documentUri: string // origin + path
  blockedUri: string // origin + path, a scheme such as `data`, or `inline` / `eval`
  violatedDirective: string
  disposition: 'enforce' | 'report'
  sourceFile?: string
  lineNumber?: number
  columnNumber?: number
}
```

Query strings and fragments are stripped from every URI and the referrer, script
sample and user agent are dropped: URLs routinely carry tokens, emails and search
terms, and violation logs must not become a store of personal data (LGPD). The
endpoint is public by design (browsers send reports without credentials), so make
sure your `proxy.ts` does not require a session on it.

## `safeNext`

```ts
import { safeNext } from '@cbrl/next'

redirect(safeNext(searchParams.get('next'), '/dashboard'))
const next = safeNext(raw, null) // string | null
```

Returns `raw` only when it is a same-origin path: starts with `/`, not `//` or
`/\`, no control characters (browsers strip tabs and newlines, turning `/\t/evil.com`
into `//evil.com`). Otherwise returns `fallback`. `isSafeInternalPath(raw)` is the
underlying type guard.

## Rolling out an enforced CSP

1. Ship `cspMode: 'report-only'` **with** `reportPath` and the `cspReportRoute`
   endpoint.
2. Watch the reports through real traffic for a while (include auth, checkout and
   any third-party flows). For each legitimate violation, add the source to
   `cspDirectives(...)`; ignore noise from browser extensions (`chrome-extension`,
   `moz-extension` blocked URIs).
3. When the reports have run clean, switch to `cspMode: 'enforce'` and keep
   `reportPath`, so regressions keep being reported after they start being blocked.
