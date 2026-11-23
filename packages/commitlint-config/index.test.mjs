import lint from '@commitlint/lint'
import load from '@commitlint/load'
import assert from 'node:assert/strict'
import { test } from 'node:test'
// Load index.mjs as the config file, the way @commitlint/cli loads a
// consumer's commitlint.config.mjs: `extends` resolved from this package and
// the parser preset (a module name since config-conventional 20) loaded.
// Passing `file` also stops the upward search from merging the repo's own
// commitlint.config.mjs into the result.
const { rules, parserPreset } = await load({}, { cwd: import.meta.dirname, file: 'index.mjs' })
const check = (message) => lint(message, rules, { parserOpts: parserPreset?.parserOpts })

test('loads the conventional parser preset', () => {
  assert.ok(parserPreset?.parserOpts, 'parser preset did not resolve')
})

test('accepts a scoped conventional commit', async () => {
  assert.equal((await check('feat(design): add a sidebar rail')).valid, true)
})

test('rejects a commit without scope', async () => {
  assert.equal((await check('feat: add a sidebar rail')).valid, false)
})

test('rejects a header longer than 72 chars', async () => {
  assert.equal((await check(`fix(pg): ${'x'.repeat(70)}`)).valid, false)
})

test('accepts a breaking-change header (needs the conventional parser)', async () => {
  assert.equal((await check('feat(design)!: drop the legacy sidebar')).valid, true)
})
