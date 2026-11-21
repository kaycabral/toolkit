# @cbrl/testing

## 0.2.0

### Minor Changes

- [#19](https://github.com/kaycabral/toolkit/pull/19) [`9b7fcb3`](https://github.com/kaycabral/toolkit/commit/9b7fcb3aaa17ad47a17d75151feaf9c331d355a3) Thanks [@kaycabral](https://github.com/kaycabral)! - Add the `@cbrl/testing/playwright` entry (optional `@playwright/test` peer) with `defineE2EConfig()` (chromium E2E preset: production build, no server reuse, `forbidOnly` and GitHub reporter on CI; dev server locally), `defineSmokeConfig()` (post-deploy smoke config that fails fast without its base-URL env var) and `smokeSuite()` (health endpoint and home page smoke tests), plus `@cbrl/testing/vitest/jsdom` with `installJsdomPolyfills()` for the browser APIs Radix needs under jsdom. Breaking: the unused `@cbrl/testing/firebase` entry is removed, and `vitest` is now an optional peer.

### Patch Changes

- [#20](https://github.com/kaycabral/toolkit/pull/20) [`2a2777a`](https://github.com/kaycabral/toolkit/commit/2a2777a64bf04738bbd20fe7fc7bd6e85064909d) Thanks [@kaycabral](https://github.com/kaycabral)! - The `layering` purity walls (`features/*/core/**`, `domain/**`) now ban the I/O clients the apps actually use (`pg`, `drizzle-orm`, `@supabase/*`, `stripe`, `@cbrl/pg`, `@cbrl/supabase`) instead of the Firebase SDKs nobody uses anymore. Docs and examples in `@cbrl/env` and `@cbrl/testing` no longer mention Firebase.
- Updated dependencies [[`2a2777a`](https://github.com/kaycabral/toolkit/commit/2a2777a64bf04738bbd20fe7fc7bd6e85064909d)]:
  - @cbrl/env@0.1.1
