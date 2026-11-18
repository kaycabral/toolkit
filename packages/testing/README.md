# @cbrl/testing

Small Vitest helpers.

```sh
pnpm add -D @cbrl/testing vitest @vitest/coverage-v8
```

| Entry                                   | Export                                                                                                          |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `@cbrl/testing/vitest`                  | `coverageBase()`: v8 provider, `src/**` include, test files excluded, `text-summary` + `json-summary` reporters |
| `@cbrl/testing/vitest/server-only-shim` | Empty module to alias `server-only` to in tests                                                                 |
| `@cbrl/testing/a11y`                    | `expectNoA11yViolations(container)`: axe-core check for jsdom component tests (page-level `region` rule off)    |
| `@cbrl/testing/firebase`                | Fail-fast readers for the env `firebase emulators:exec` injects, and a Playwright `webServer` builder           |

```ts
// vitest.config.ts
import { coverageBase } from '@cbrl/testing/vitest'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      ...coverageBase(),
      // Keep thresholds inline so `autoUpdate` can ratchet them in this file.
      thresholds: { statements: 90, branches: 85, functions: 90, lines: 90, autoUpdate: true },
    },
  },
})
```

Alias `server-only` in tests:

```ts
import { fileURLToPath } from 'node:url'

resolve: {
  alias: {
    'server-only': fileURLToPath(import.meta.resolve('@cbrl/testing/vitest/server-only-shim')),
  },
}
```
