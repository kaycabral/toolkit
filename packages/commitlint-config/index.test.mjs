import conventional from '@commitlint/config-conventional'
import lint from '@commitlint/lint'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import config from './index.mjs'

const rules = { ...conventional.rules, ...config.rules }
const check = (message) =>
  lint(message, rules, { parserOpts: conventional.parserPreset?.parserOpts })

test('accepts a scoped conventional commit', async () => {
  assert.equal((await check('feat(design): add a sidebar rail')).valid, true)
})

test('rejects a commit without scope', async () => {
  assert.equal((await check('feat: add a sidebar rail')).valid, false)
})

test('rejects a header longer than 72 chars', async () => {
  assert.equal((await check(`fix(pg): ${'x'.repeat(70)}`)).valid, false)
})
