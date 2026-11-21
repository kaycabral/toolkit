import { coverageBase } from '@cbrl/testing/vitest'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      'server-only': fileURLToPath(import.meta.resolve('@cbrl/testing/vitest/server-only-shim')),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      ...coverageBase(),
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100, autoUpdate: true },
    },
  },
})
