import { RuleTester } from 'eslint'
import { test } from 'node:test'

import { noConditionalSpreadChain } from './no-conditional-spread-chain.mjs'

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
})

test('no-conditional-spread-chain', () => {
  ruleTester.run('no-conditional-spread-chain', noConditionalSpreadChain, {
    valid: [
      // Single, shallow conditional spread — idiomatic, allowed.
      'const o = { base: 1, ...(c1 ? { foo: 1 } : {}) }',
      // Two sibling conditional spreads (not nested) — allowed.
      'const o = { ...(c1 ? { a: 1 } : {}), ...(c2 ? { b: 2 } : {}) }',
      // Conditional spread whose value is a plain (non-conditional) spread.
      'const o = { ...(c1 ? { ...base } : {}) }',
      // Non-conditional spread anywhere.
      'const o = { ...base, ...other }',
    ],
    invalid: [
      {
        // Nested conditional spread inside a conditional spread.
        code: 'const o = { ...(c1 ? { ...(c2 ? { a: 1 } : {}) } : {}) }',
        errors: [{ messageId: 'chain' }],
      },
      {
        // Nested inside a helper call within the conditional spread.
        code: 'const o = { ...(c1 ? { foo: f({ ...(c2 ? { a: 1 } : {}) }) } : {}) }',
        errors: [{ messageId: 'chain' }],
      },
      {
        // Nested in the alternate branch.
        code: 'const o = { ...(c1 ? {} : { ...(c2 ? { a: 1 } : {}) }) }',
        errors: [{ messageId: 'chain' }],
      },
    ],
  })
})
