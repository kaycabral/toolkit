---
'@cbrl/next': minor
---

`readBackend(read, { label, timeoutMs?, logger? })` in `@cbrl/next/server`: runs a server-side backend read with a timeout and returns `{ ok: true, data } | { ok: false }`, logging failures with `@cbrl/log`, so an unavailable backend degrades the page instead of crashing it. Adds `@cbrl/log` as a dependency.
