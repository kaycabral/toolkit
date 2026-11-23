import { ESLint } from 'eslint'
import assert from 'node:assert/strict'
import { dirname, join, relative } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import tseslint from 'typescript-eslint'

import { layering } from './layering.mjs'

const fixtures = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'layering')

async function lintFixtures(ruleId) {
  const eslint = new ESLint({
    cwd: fixtures,
    overrideConfigFile: true,
    overrideConfig: [
      { files: ['**/*.ts'], languageOptions: { parser: tseslint.parser } },
      ...layering,
    ],
  })
  const results = await eslint.lintFiles(['**/*.ts'])
  return results
    .flatMap((result) =>
      result.messages.map((message) => ({
        file: relative(fixtures, result.filePath),
        line: message.line,
        ruleId: message.ruleId,
        message: message.message,
      })),
    )
    .filter((report) => report.ruleId === ruleId)
    .sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)
}

test('layering wall 2: imports only point down the ring stack', async () => {
  const reports = await lintFixtures('boundaries/dependencies')

  assert.deepEqual(
    reports.map(({ file, line, message }) => ({ file, line, message })),
    [
      {
        file: 'src/features/billing/adapters/repo.ts',
        line: 2,
        message:
          'adapters (billing) must not import ui: the flow is ui→adapters, never the reverse.',
      },
      {
        file: 'src/features/billing/core/total.ts',
        line: 1,
        message:
          'core (billing) must not import feat-adapters: dependencies only point down (ui→adapters→core).',
      },
      {
        file: 'src/features/billing/core/total.ts',
        line: 2,
        message:
          'core (billing) must not import feat-ui: dependencies only point down (ui→adapters→core).',
      },
      {
        file: 'src/features/orders/adapters/sync.ts',
        line: 3,
        message:
          'adapters (orders) must not import ui: the flow is ui→adapters, never the reverse.',
      },
    ],
  )
})

test('layering wall 1: core/ purity still flags upward imports', async () => {
  const reports = await lintFixtures('no-restricted-imports')

  assert.deepEqual(
    reports.map(({ file, line }) => ({ file, line })),
    [
      { file: 'src/features/billing/core/total.ts', line: 1 },
      { file: 'src/features/billing/core/total.ts', line: 2 },
    ],
  )
})
