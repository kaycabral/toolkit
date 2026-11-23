# @cbrl/testing

## 0.3.0

### Minor Changes

- [#36](https://github.com/kaycabral/toolkit/pull/36) [`8a45455`](https://github.com/kaycabral/toolkit/commit/8a45455bb4c0e66bdc3575217bd5089bd6de45e3) Thanks [@kaycabral](https://github.com/kaycabral)! - Support Vitest 5 (the `vitest` peer stays `>=3`). `expectNoA11yViolations` now runs jest-axe's matcher directly instead of registering it with `expect.extend`, because Vitest 5 no longer merges jest-axe's `jest.Matchers` typings into `Assertion`. Importing `@cbrl/testing/a11y` therefore has no side effects anymore: code that called `expect(results).toHaveNoViolations()` relying on that import must switch to `expectNoA11yViolations(container)` (or call `expect.extend(toHaveNoViolations)` itself).

## 0.2.0

### Minor Changes

- [#19](https://github.com/kaycabral/toolkit/pull/19) [`9b7fcb3`](https://github.com/kaycabral/toolkit/commit/9b7fcb3aaa17ad47a17d75151feaf9c331d355a3) Thanks [@kaycabral](https://github.com/kaycabral)! - Add the `@cbrl/testing/playwright` entry (optional `@playwright/test` peer) with `defineE2EConfig()` (chromium E2E preset: production build, no server reuse, `forbidOnly` and GitHub reporter on CI; dev server locally), `defineSmokeConfig()` (post-deploy smoke config that fails fast without its base-URL env var) and `smokeSuite()` (health endpoint and home page smoke tests), plus `@cbrl/testing/vitest/jsdom` with `installJsdomPolyfills()` for the browser APIs Radix needs under jsdom. Breaking: the unused `@cbrl/testing/firebase` entry is removed, and `vitest` is now an optional peer.

### Patch Changes

- [#20](https://github.com/kaycabral/toolkit/pull/20) [`2a2777a`](https://github.com/kaycabral/toolkit/commit/2a2777a64bf04738bbd20fe7fc7bd6e85064909d) Thanks [@kaycabral](https://github.com/kaycabral)! - The `layering` purity walls (`features/*/core/**`, `domain/**`) now ban the I/O clients the apps actually use (`pg`, `drizzle-orm`, `@supabase/*`, `stripe`, `@cbrl/pg`, `@cbrl/supabase`) instead of the Firebase SDKs nobody uses anymore. Docs and examples in `@cbrl/env` and `@cbrl/testing` no longer mention Firebase.
- Updated dependencies [[`2a2777a`](https://github.com/kaycabral/toolkit/commit/2a2777a64bf04738bbd20fe7fc7bd6e85064909d)]:
  - @cbrl/env@0.1.1
