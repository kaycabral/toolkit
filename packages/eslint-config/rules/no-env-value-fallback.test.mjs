import { RuleTester } from 'eslint'
import { test } from 'node:test'

import { noEnvValueFallback } from './no-env-value-fallback.mjs'

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
})

test('no-env-value-fallback', () => {
  ruleTester.run('no-env-value-fallback', noEnvValueFallback, {
    valid: [
      // Read without fallback — fine.
      'const x = process.env.APP_URL',
      // Fail-fast helper — the sanctioned pattern.
      'const x = process.env.APP_URL; if (!x) throw new Error("APP_URL")',
      // Boolean logic, not a value default.
      'if (process.env.CI || process.env.VERCEL) {}',
      'const on = !!process.env.A || !!process.env.B',
      // env→env chain with no literal (ends in throw downstream).
      'const u = process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL',
      // Absence normalization — not a fake value.
      'const id = process.env.GITHUB_APP_ID ?? null',
      'const id = process.env.GITHUB_APP_ID ?? undefined',
      // Non-literal fallback (computed path / call).
      'const dir = process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config")',
      'const v = process.env.X ?? someFn()',
      // Not process.env.
      'const x = config.value ?? "default"',
    ],
    invalid: [
      {
        code: 'const url = process.env.APP_URL ?? "http://localhost:3000"',
        errors: [{ messageId: 'envFallback', data: { varName: 'APP_URL' } }],
      },
      {
        code: 'const x = process.env.NOMINATIM_URL || "https://nominatim.example/search"',
        errors: [{ messageId: 'envFallback', data: { varName: 'NOMINATIM_URL' } }],
      },
      {
        code: 'const n = Number(process.env.LIMIT ?? "5")',
        errors: [{ messageId: 'envFallback', data: { varName: 'LIMIT' } }],
      },
      {
        // Chain that ends in a literal — flagged; var name is the leftmost env.
        code: 'const p = process.env.A ?? process.env.B ?? "cbrl-dev"',
        errors: [{ messageId: 'envFallback', data: { varName: 'A' } }],
      },
      {
        code: 'const c = process.env.COMMIT_SHA ?? "unknown"',
        errors: [{ messageId: 'envFallback', data: { varName: 'COMMIT_SHA' } }],
      },
      {
        code: 'process.env.POSTGRES_URL ??= "postgres://localhost:5432/app"',
        errors: [{ messageId: 'envFallback', data: { varName: 'POSTGRES_URL' } }],
      },
      {
        code: 'process.env.HOST ||= "127.0.0.1"',
        errors: [{ messageId: 'envFallback', data: { varName: 'HOST' } }],
      },
      {
        // Template literal default.
        code: 'const b = process.env.GCS_BUCKET ?? `${proj}.app`',
        errors: [{ messageId: 'envFallback', data: { varName: 'GCS_BUCKET' } }],
      },
    ],
  })
})
