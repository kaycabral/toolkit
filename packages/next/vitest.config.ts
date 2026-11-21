import { coverageBase } from '@cbrl/testing/vitest'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Unit-coverage ratchet (autoUpdate = one-way, só sobe). Seed honesto
    // gravado pelo primeiro run com --coverage.
    coverage: {
      ...coverageBase(),
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100, autoUpdate: true },
    },
  },
})
