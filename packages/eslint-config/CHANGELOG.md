# @cbrl/eslint-config

## 0.3.0

### Minor Changes

- [#49](https://github.com/kaycabral/toolkit/pull/49) [`c878791`](https://github.com/kaycabral/toolkit/commit/c87879179537e65954f914c7bbaedefa7dd0de4c) Thanks [@kaycabral](https://github.com/kaycabral)! - Move the `layering` ring-direction wall to `eslint-plugin-boundaries` 7: the deprecated `boundaries/element-types` rule becomes `boundaries/dependencies` with `policies` and entity selectors, and the `mode: 'full'` element descriptors become folder patterns matched anywhere in the path. The wall now actually fires: under v6 it never reported anything, because the `full`-mode patterns only matched a `features/` folder at the project root and the node resolver could not resolve extensionless `.ts` imports. Relative imports from `features/*/core` into `adapters`/`ui`, and from `features/*/adapters` into `ui`, are now reported as `boundaries/dependencies` errors, with the slice name in the message (it used to render `[object Object]`). Imports through path aliases (`@/features/...`) are still not resolved by this wall; core/ keeps catching them through `no-restricted-imports`. v7 also drops the vulnerable `handlebars` 4.7.9 pin (it now pins 4.7.10).

## 0.2.1

### Patch Changes

- [#36](https://github.com/kaycabral/toolkit/pull/36) [`8a45455`](https://github.com/kaycabral/toolkit/commit/8a45455bb4c0e66bdc3575217bd5089bd6de45e3) Thanks [@kaycabral](https://github.com/kaycabral)! - Bump `globals` to `^17.14.0` (browser globals now come from both Chrome and Firefox; AudioWorklet globals such as `registerProcessor` left `globals.browser`) and narrow the `typescript` peer to `>=5.0.0 <6.1`, the range `typescript-eslint` actually supports. TypeScript 6.1+ and 7 were never usable with this config; the peer now says so.

## 0.2.0

### Minor Changes

- [#20](https://github.com/kaycabral/toolkit/pull/20) [`2a2777a`](https://github.com/kaycabral/toolkit/commit/2a2777a64bf04738bbd20fe7fc7bd6e85064909d) Thanks [@kaycabral](https://github.com/kaycabral)! - The `layering` purity walls (`features/*/core/**`, `domain/**`) now ban the I/O clients the apps actually use (`pg`, `drizzle-orm`, `@supabase/*`, `stripe`, `@cbrl/pg`, `@cbrl/supabase`) instead of the Firebase SDKs nobody uses anymore. Docs and examples in `@cbrl/env` and `@cbrl/testing` no longer mention Firebase.

## 0.1.1

### Patch Changes

- [#4](https://github.com/kaycabral/toolkit/pull/4) [`3c689c2`](https://github.com/kaycabral/toolkit/commit/3c689c27e209b88bf1a11530e7b04b1cc259289d) Thanks [@kaycabral](https://github.com/kaycabral)! - Lint messages of the `layering` layer and the custom rules' documentation are now in English.
