import { defineConfig } from 'vitest/config'
import { coverageBase } from './src/vitest'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Unit-coverage ratchet (autoUpdate = one-way, só sobe). Seed honesto
    // gravado pelo primeiro run com --coverage.
    coverage: {
      ...coverageBase(),
      thresholds: {
        statements: 93.33,
        branches: 100,
        functions: 85.71,
        lines: 100,
        autoUpdate: true,
      },
    },
  },
})
