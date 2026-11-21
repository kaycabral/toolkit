# @cbrl/testing

Test helpers for Vitest and Playwright.

```sh
pnpm add -D @cbrl/testing vitest @vitest/coverage-v8
# Playwright presets (optional peer):
pnpm add -D @playwright/test
```

| Entry                                   | Export                                                                                                          |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `@cbrl/testing/vitest`                  | `coverageBase()`: v8 provider, `src/**` include, test files excluded, `text-summary` + `json-summary` reporters |
| `@cbrl/testing/vitest/server-only-shim` | Empty module to alias `server-only` to in tests                                                                 |
| `@cbrl/testing/vitest/jsdom`            | `installJsdomPolyfills()`: stubs `ResizeObserver`, `matchMedia`, `scrollIntoView` and Pointer Capture           |
| `@cbrl/testing/a11y`                    | `expectNoA11yViolations(container)`: axe-core check for jsdom component tests (page-level `region` rule off)    |
| `@cbrl/testing/playwright`              | `defineE2EConfig()`, `defineSmokeConfig()` and `smokeSuite()` presets                                           |

## Vitest

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

Polyfill the browser APIs Radix primitives need under jsdom:

```ts
// vitest.setup.ts
import '@testing-library/jest-dom/vitest'
import { installJsdomPolyfills } from '@cbrl/testing/vitest/jsdom'

installJsdomPolyfills()
```

## Playwright

`defineE2EConfig` boots the app and runs chromium. On CI (`CI` set) it serves a
production build, never reuses a running server, forbids `.only` and reports
with GitHub annotations; locally it runs the dev server. Spread it to add app
specifics:

```ts
// playwright.config.ts
import { defineE2EConfig } from '@cbrl/testing/playwright'
import { defineConfig } from '@playwright/test'

export default defineConfig({
  ...defineE2EConfig({
    port: 3000,
    testDir: './src',
    testMatch: '**/_e2e/**/*.spec.ts',
    webServerEnv: { ENABLE_TEST_AUTH: 'true' },
    // devCommand: 'pnpm run dev', ciCommand: 'pnpm run build && pnpm run start -p 3000'
  }),
  globalSetup: './e2e/global-setup.ts',
})
```

Post-deploy smoke tests against a deployed URL (fails fast when the env var is
missing):

```ts
// playwright.smoke.config.ts
import { defineSmokeConfig } from '@cbrl/testing/playwright'

export default defineSmokeConfig() // { testDir: './_smoke', baseUrlEnv: 'SMOKE_BASE_URL' }
```

```ts
// _smoke/health.spec.ts
import { smokeSuite } from '@cbrl/testing/playwright'
import { expect, test } from '@playwright/test'

// GET /api/health -> 200 { status: 'ok' }, and `/` renders with a title.
smokeSuite({ healthPath: '/api/health' })

test('listing renders', async ({ page }) => {
  expect((await page.goto('/listing'))?.status()).toBeLessThan(400)
})
```
