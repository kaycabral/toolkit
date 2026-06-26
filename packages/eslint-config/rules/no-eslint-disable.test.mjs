import { RuleTester } from 'eslint'
import { test } from 'node:test'

import { noEslintDisable } from './no-eslint-disable.mjs'

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
})

test('no-eslint-disable', () => {
  ruleTester.run('no-eslint-disable', noEslintDisable, {
    valid: [
      // Ordinary comments — not disable directives.
      'const x = 1 // just a comment',
      '/* a block comment mentioning eslint but not disabling */',
      // The word eslint-disable inside a string is not a directive.
      'const s = "eslint-disable-line"',
      // A comment that merely contains the substring later, not as a directive.
      '// see eslint-disable docs for why we never use it',
    ],
    invalid: [
      {
        // Block disable scoped to other rules (a bare `/* eslint-disable */`
        // would disable THIS rule too and self-suppress — untestable by design).
        code: '/* eslint-disable no-console */\nconsole.log(1)',
        errors: [{ messageId: 'disableForbidden' }],
      },
      {
        code: 'const x = 1 // eslint-disable-line no-unused-vars',
        errors: [{ messageId: 'disableForbidden' }],
      },
      {
        code: '// eslint-disable-next-line\nconst y = 2',
        errors: [{ messageId: 'disableForbidden' }],
      },
    ],
  })
})
