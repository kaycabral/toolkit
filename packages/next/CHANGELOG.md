# @cbrl/next

## 0.2.0

### Minor Changes

- [#58](https://github.com/kaycabral/toolkit/pull/58) [`5d308cd`](https://github.com/kaycabral/toolkit/commit/5d308cd16f83243ced011ea809e01198bead4682) Thanks [@kaycabral](https://github.com/kaycabral)! - `readBackend(read, { label, timeoutMs?, logger? })` in `@cbrl/next/server`: runs a server-side backend read with a timeout and returns `{ ok: true, data } | { ok: false }`, logging failures with `@cbrl/log`, so an unavailable backend degrades the page instead of crashing it. Adds `@cbrl/log` as a dependency.

## 0.1.1

### Patch Changes

- [#32](https://github.com/kaycabral/toolkit/pull/32) [`8e03526`](https://github.com/kaycabral/toolkit/commit/8e035260203930872be672d9c04a5eca07d3b5c0) Thanks [@kaycabral](https://github.com/kaycabral)! - Import `next/server.js` and `next/headers.js` with their file extension. `next` ships no `exports` map, so plain Node ESM (for example Vitest running the app's tests) could not resolve the bare `next/server` / `next/headers` specifiers inside these packages, and consumers had to inline `@cbrl/*` through `server.deps.inline`. That workaround is no longer needed.

## 0.1.0

### Minor Changes

- [#14](https://github.com/kaycabral/toolkit/pull/14) [`ec54ad7`](https://github.com/kaycabral/toolkit/commit/ec54ad7f87278e15a6c15002895ba956077bb66c) Thanks [@kaycabral](https://github.com/kaycabral)! - New package for Next.js 16 apps. `@cbrl/next/config` builds the shared CSP baseline (`cspDirectives`, `buildCsp`), the security header set with real CSP reporting (`securityHeaders`, `withSecurityHeaders` adds `report-uri`, `report-to` and `Reporting-Endpoints` when given a `reportPath`, and drops `X-Powered-By`), the build commit SHA (`commitSha`) and dev origins (`devOrigins`). `@cbrl/next/server` adds Route Handler factories: `healthRoute` (uncached commit + database check, 200/503) and `cspReportRoute` (accepts `application/csp-report` and `application/reports+json`, caps the body, strips query strings and fragments from reported URIs). The root entry exports the isomorphic `safeNext`/`isSafeInternalPath` open-redirect guards.
