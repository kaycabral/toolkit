---
'@cbrl/next': patch
'@cbrl/supabase': patch
---

Import `next/server.js` and `next/headers.js` with their file extension. `next` ships no `exports` map, so plain Node ESM (for example Vitest running the app's tests) could not resolve the bare `next/server` / `next/headers` specifiers inside these packages, and consumers had to inline `@cbrl/*` through `server.deps.inline`. That workaround is no longer needed.
