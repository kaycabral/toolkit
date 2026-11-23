---
'@cbrl/commitlint-config': minor
---

Move to `@commitlint/config-conventional` 21 and require `@commitlint/cli` `>=20` (was `>=19`). Since v20 the preset references its parser by module name, which `@commitlint/cli` 19 does not resolve: it silently falls back to the default parser and misreads headers such as `feat(scope)!: ...`. Requires Node `>=22.12` (commitlint 21's engines).
