---
'@cbrl/eslint-config': minor
---

Move the `layering` ring-direction wall to `eslint-plugin-boundaries` 7: the deprecated `boundaries/element-types` rule becomes `boundaries/dependencies` with `policies` and entity selectors, and the `mode: 'full'` element descriptors become folder patterns matched anywhere in the path. The wall now actually fires: under v6 it never reported anything, because the `full`-mode patterns only matched a `features/` folder at the project root and the node resolver could not resolve extensionless `.ts` imports. Relative imports from `features/*/core` into `adapters`/`ui`, and from `features/*/adapters` into `ui`, are now reported as `boundaries/dependencies` errors, with the slice name in the message (it used to render `[object Object]`). Imports through path aliases (`@/features/...`) are still not resolved by this wall; core/ keeps catching them through `no-restricted-imports`. v7 also drops the vulnerable `handlebars` 4.7.9 pin (it now pins 4.7.10).
