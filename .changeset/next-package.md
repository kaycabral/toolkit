---
'@cbrl/next': minor
---

New package for Next.js 16 apps. `@cbrl/next/config` builds the shared CSP baseline (`cspDirectives`, `buildCsp`), the security header set with real CSP reporting (`securityHeaders`, `withSecurityHeaders` adds `report-uri`, `report-to` and `Reporting-Endpoints` when given a `reportPath`, and drops `X-Powered-By`), the build commit SHA (`commitSha`) and dev origins (`devOrigins`). `@cbrl/next/server` adds Route Handler factories: `healthRoute` (uncached commit + database check, 200/503) and `cspReportRoute` (accepts `application/csp-report` and `application/reports+json`, caps the body, strips query strings and fragments from reported URIs). The root entry exports the isomorphic `safeNext`/`isSafeInternalPath` open-redirect guards.
