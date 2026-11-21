---
'@cbrl/testing': minor
---

Add the `@cbrl/testing/playwright` entry (optional `@playwright/test` peer) with `defineE2EConfig()` (chromium E2E preset: production build, no server reuse, `forbidOnly` and GitHub reporter on CI; dev server locally), `defineSmokeConfig()` (post-deploy smoke config that fails fast without its base-URL env var) and `smokeSuite()` (health endpoint and home page smoke tests), plus `@cbrl/testing/vitest/jsdom` with `installJsdomPolyfills()` for the browser APIs Radix needs under jsdom. Breaking: the unused `@cbrl/testing/firebase` entry is removed, and `vitest` is now an optional peer.
