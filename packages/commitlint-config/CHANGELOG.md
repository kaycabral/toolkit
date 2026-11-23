# @cbrl/commitlint-config

## 0.2.0

### Minor Changes

- [#36](https://github.com/kaycabral/toolkit/pull/36) [`8a45455`](https://github.com/kaycabral/toolkit/commit/8a45455bb4c0e66bdc3575217bd5089bd6de45e3) Thanks [@kaycabral](https://github.com/kaycabral)! - Move to `@commitlint/config-conventional` 21 and require `@commitlint/cli` `>=20` (was `>=19`). Since v20 the preset references its parser by module name, which `@commitlint/cli` 19 does not resolve: it silently falls back to the default parser and misreads headers such as `feat(scope)!: ...`. Requires Node `>=22.12` (commitlint 21's engines).
