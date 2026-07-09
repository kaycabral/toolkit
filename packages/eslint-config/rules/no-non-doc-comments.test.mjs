import { RuleTester } from 'eslint'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import tseslint from 'typescript-eslint'

import { noNonDocComments } from './no-non-doc-comments.mjs'

const fixtures = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'no-non-doc-comments')

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      project: join(fixtures, 'tsconfig.json'),
      tsconfigRootDir: fixtures,
    },
  },
})

test('no-non-doc-comments', () => {
  ruleTester.run('no-non-doc-comments', noNonDocComments, {
    valid: [
      {
        filename: join(fixtures, 'ts-pragma.ts'),
        code: 'export const n: number = (0 as unknown as string as unknown as number)\n// @ts-expect-error intentional\nexport const x: number = "s"\n',
      },
      {
        filename: join(fixtures, 'reference.ts'),
        code: '/// <reference types="node" />\nexport const ok = 1\n',
      },
      {
        filename: join(fixtures, 'attached-tsdoc.ts'),
        code: '/**\n * Materializes the ledger snapshot.\n * @returns the running balance in cents\n */\nexport function ledger(): number {\n  return 1\n}\n',
      },
      {
        filename: join(fixtures, 'prettier-ignore.ts'),
        code: '// prettier-ignore\nexport const grid = [1, 2, 3]\n',
      },
      {
        filename: join(fixtures, 'pure-annotation.ts'),
        code: 'export const x = /*#__PURE__*/ makeThing()\n',
      },
      {
        filename: join(fixtures, 'webpack-magic.ts'),
        code: 'export const load = () => import(/* webpackChunkName: "x" */ "./x")\n',
      },
      {
        filename: join(fixtures, 'fold-region.ts'),
        code: '// #region setup\nexport const a = 1\n// #endregion\n',
      },
    ],
    invalid: [
      {
        filename: join(fixtures, 'line.ts'),
        code: 'export const x = 1 // explains what x is\n',
        output: 'export const x = 1\n',
        errors: [{ messageId: 'prose' }],
      },
      {
        filename: join(fixtures, 'block.ts'),
        code: '/* a block explaining the module */\nexport const y = 2\n',
        output: 'export const y = 2\n',
        errors: [{ messageId: 'prose' }],
      },
      {
        filename: join(fixtures, 'unattached-doc.ts'),
        code: 'export function f(): number {\n  /** prose dressed as doc, attached to nothing useful */\n  return 1\n}\n// trailing prose\n',
        output: 'export function f(): number {\n  return 1\n}\n',
        errors: [{ messageId: 'prose' }, { messageId: 'prose' }],
      },
      {
        filename: join(fixtures, 'doc-without-tag.ts'),
        code: '/** just a prose description with no tag */\nexport function g(): number {\n  return 2\n}\n',
        output: 'export function g(): number {\n  return 2\n}\n',
        errors: [{ messageId: 'prose' }],
      },
    ],
  })
})

const jsxRuleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      project: join(fixtures, 'tsconfig.json'),
      tsconfigRootDir: fixtures,
      ecmaFeatures: { jsx: true },
    },
  },
})

test('no-non-doc-comments — JSX expression comment removes the whole container', () => {
  jsxRuleTester.run('no-non-doc-comments', noNonDocComments, {
    valid: [],
    invalid: [
      {
        filename: join(fixtures, 'jsx-comment.tsx'),
        code: 'export const El = () => (\n  <div>\n    {/* a jsx comment */}\n    <span />\n  </div>\n)\n',
        output: 'export const El = () => (\n  <div>\n    <span />\n  </div>\n)\n',
        errors: [{ messageId: 'prose' }],
      },
    ],
  })
})

const untypedRuleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  },
})

test('no-non-doc-comments — without a TS program, block /** */ is preserved (fail-safe)', () => {
  untypedRuleTester.run('no-non-doc-comments', noNonDocComments, {
    valid: [
      {
        code: '/**\n * Any block doc.\n * @returns n\n */\nexport function f() {\n  return 1\n}\n',
      },
      {
        code: '/** even an untagged block doc is kept when we cannot consult the compiler */\nexport const x = 1\n',
      },
    ],
    invalid: [
      {
        code: 'export const y = 1 // a line comment is still removed without a program\n',
        output: 'export const y = 1\n',
        errors: [{ messageId: 'prose' }],
      },
    ],
  })
})
