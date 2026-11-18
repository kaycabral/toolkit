# @cbrl/eslint-config

Strict ESLint flat config for TypeScript, React and Next.js. Type-aware rules,
accessibility, test quality, architectural layering, and custom `cbrl/*` rules
that enforce fail-fast code.

```sh
pnpm add -D @cbrl/eslint-config eslint typescript
```

```js
// eslint.config.mjs
import baseConfig from '@cbrl/eslint-config'

export default [...baseConfig]
```

## Layers

The default export composes these layers, also available as named exports:

| Export        | What it does                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------- |
| `ignores`     | Build output, coverage, generated files                                                            |
| `javascript`  | `@eslint/js` recommended, sonarjs, `cbrl/*` rules, `noInlineConfig`                                |
| `typescript`  | `typescript-eslint` type-aware (`no-unsafe-*`, `no-floating-promises`, `no-unsafe-type-assertion`) |
| `moduleSize`  | Caps on file and function size                                                                     |
| `layering`    | `features/*/{ui,adapters,core}`: core stays pure, imports only point down                          |
| `testQuality` | Testing Library + Playwright rules; no `data-testid`, no hand-rolled UI primitives                 |
| `next`        | Next.js-specific exceptions (no-op elsewhere)                                                      |

```js
import { ignores, javascript, typescript } from '@cbrl/eslint-config'

export default [...ignores, ...javascript, ...typescript]
```

## Custom rules

| Rule                               | Default | Enforces                                                                                                                                        |
| ---------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `cbrl/no-eslint-disable`           | error   | No `eslint-disable*` comments. `noInlineConfig` backs it up so it cannot be silenced inline                                                     |
| `cbrl/no-env-value-fallback`       | error   | No literal fallback on `process.env.X` (`?? 'x'`, `\|\| 'x'`); read it with `@cbrl/env`                                                         |
| `cbrl/no-conditional-spread-chain` | error   | No conditional spread nested in another conditional spread                                                                                      |
| `cbrl/no-non-doc-comments`         | off     | Only machine pragmas and attached TSDoc with a tag survive (autofix removes the rest). Opt in: `rules: { 'cbrl/no-non-doc-comments': 'error' }` |

Each rule documents its rationale in the header of `rules/<name>.mjs`. The plugin
is exported from `@cbrl/eslint-config/plugin` and file globs from
`@cbrl/eslint-config/globs`.
