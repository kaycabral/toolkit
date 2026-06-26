/**
 * Shared vitest coverage base (v8) for the monorepo. Apps spread it into their
 * own `coverage` block and add the `thresholds` inline:
 *
 *   import { coverageBase } from '@cbrl/testing/vitest'
 *   export default defineConfig({
 *     test: {
 *       coverage: {
 *         ...coverageBase(),
 *         thresholds: { statements: 87, branches: 80, functions: 90, lines: 88, autoUpdate: true },
 *       },
 *     },
 *   })
 *
 * `thresholds` lives inline (not here) on purpose: vitest's `autoUpdate: true`
 * rewrites those numbers in the config file as coverage improves — the ratchet —
 * and only files it can see literally are updatable. The base centralises the
 * provider, what counts as source, and the reporters (incl. json-summary, which
 * the quality snapshot reads).
 */
import type { CoverageOptions } from 'vitest/node'

export function coverageBase() {
  return {
    provider: 'v8',
    include: ['src/**/*.{ts,tsx}'],
    exclude: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'src/**/*.integration.test.{ts,tsx}',
      'src/**/*.d.ts',
      'src/**/__mocks__/**',
    ],
    reporter: ['text-summary', 'json-summary'],
    reportsDirectory: './coverage',
  } satisfies CoverageOptions
}
