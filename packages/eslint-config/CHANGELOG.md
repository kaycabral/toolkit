# @cbrl/eslint-config

## 0.2.1

### Patch Changes

- [#36](https://github.com/kaycabral/toolkit/pull/36) [`8a45455`](https://github.com/kaycabral/toolkit/commit/8a45455bb4c0e66bdc3575217bd5089bd6de45e3) Thanks [@kaycabral](https://github.com/kaycabral)! - Bump `globals` to `^17.14.0` (browser globals now come from both Chrome and Firefox; AudioWorklet globals such as `registerProcessor` left `globals.browser`) and narrow the `typescript` peer to `>=5.0.0 <6.1`, the range `typescript-eslint` actually supports. TypeScript 6.1+ and 7 were never usable with this config; the peer now says so.

## 0.2.0

### Minor Changes

- [#20](https://github.com/kaycabral/toolkit/pull/20) [`2a2777a`](https://github.com/kaycabral/toolkit/commit/2a2777a64bf04738bbd20fe7fc7bd6e85064909d) Thanks [@kaycabral](https://github.com/kaycabral)! - The `layering` purity walls (`features/*/core/**`, `domain/**`) now ban the I/O clients the apps actually use (`pg`, `drizzle-orm`, `@supabase/*`, `stripe`, `@cbrl/pg`, `@cbrl/supabase`) instead of the Firebase SDKs nobody uses anymore. Docs and examples in `@cbrl/env` and `@cbrl/testing` no longer mention Firebase.

## 0.1.1

### Patch Changes

- [#4](https://github.com/kaycabral/toolkit/pull/4) [`3c689c2`](https://github.com/kaycabral/toolkit/commit/3c689c27e209b88bf1a11530e7b04b1cc259289d) Thanks [@kaycabral](https://github.com/kaycabral)! - Lint messages of the `layering` layer and the custom rules' documentation are now in English.
