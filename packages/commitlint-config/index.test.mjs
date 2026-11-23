import lint from '@commitlint/lint'
import load from '@commitlint/load'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import config from './index.mjs'

// Resolve the config the way @commitlint/cli does: `extends` merged and the
// parser preset (a module name since config-conventional 20) loaded.
const { rules, parserPreset } = await load(config)
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
