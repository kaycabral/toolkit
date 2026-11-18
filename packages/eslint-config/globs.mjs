// Centralized glob patterns shared across config layers.
// One source of truth — change a pattern here, every layer picks it up.

/** All lintable source/script files. */
export const GLOB_ALL = '**/*.{js,mjs,cjs,ts,tsx}'

/** TypeScript files (TS-specific rules attach here). */
export const GLOB_TS = '**/*.{ts,tsx}'

/** React/JSX files — jsx-a11y attaches here. */
export const GLOB_TSX = '**/*.tsx'

/** Unit/component test files — testing-library query rules attach here. */
export const GLOB_TEST_FILES = '**/*.test.{ts,tsx}'

/** Playwright e2e specs — the playwright plugin attaches here. */
export const GLOB_E2E_SPECS = ['**/tests/e2e/**', '**/*.spec.ts']

/** App source — the ownership gate (no raw primitives / no Radix) attaches here. */
export const GLOB_APPS = 'apps/**/*.{ts,tsx}'

/** TypeScript files under a `src/` source root (excludes configs at the root). */
export const GLOB_SRC = '**/src/**/*.{ts,tsx}'

/** Service workers — separate global scope (`self`, no DOM `window`). */
export const GLOB_SERVICE_WORKER = ['**/public/sw.js', '**/public/**/sw.js']

/** Build artifacts, generated output, and config files to never lint. */
export const GLOB_IGNORES = [
  '**/node_modules/**',
  '**/.next/**',
  '**/dist/**',
  '**/build/**',
  '**/coverage/**',
  '**/playwright-report/**',
  '**/test-results/**',
  '**/.stryker-tmp/**',
  '**/*.config.js',
  // Rule-test fixtures: deliberately violating source fed to RuleTester/tsc.
  '**/rules/fixtures/**',
]

/**
 * Test/spec/e2e/smoke files — exempt from the module-size gate. Large
 * table-driven specs and fixtures are legitimate; the cap targets god-files
 * in production source only.
 */
export const GLOB_TESTS = [
  '**/*.test.{ts,tsx}',
  '**/*.spec.{ts,tsx}',
  '**/*.integration.test.{ts,tsx}',
  '**/_e2e/**',
  '**/_smoke/**',
  '**/e2e/**',
]
