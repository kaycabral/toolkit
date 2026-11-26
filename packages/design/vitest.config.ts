import { coverageBase } from '@cbrl/testing/vitest'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Component-level tests for the design system. jsdom + Testing Library so we
// can assert rendered output and interaction (the first such setup in the
// monorepo's UI packages — see #1027). Keep it minimal: no app env, no
// aliases; design components are self-contained.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**'],
    // Unit-coverage ratchet (autoUpdate = one-way, só sobe). Floor reflete o
    // que está coberto por teste direto (lógica de nav, smoke + axe dos
    // componentes); sobe conforme novos componentes ganham teste na mesma MR
    // em que entram — nunca diluir o pacote sem cobrir.
    coverage: {
      ...coverageBase(),
      thresholds: {
        statements: 98.92,
        branches: 96.21,
        functions: 98.17,
        lines: 98.83,
        autoUpdate: true,
      },
    },
  },
})
