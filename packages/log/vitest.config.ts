import { coverageBase } from '@cbrl/testing/vitest'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Unit-coverage ratchet (autoUpdate is one-way: it only goes up).
    coverage: {
      ...coverageBase(),
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100, autoUpdate: true },
    },
  },
})
