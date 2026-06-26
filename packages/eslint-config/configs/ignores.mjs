// Layer: global ignores. Must stay a standalone config object (no `files`)
// so ESLint treats it as global — applies before every other layer.

import { GLOB_IGNORES } from '../globs.mjs'

/** @type {import('eslint').Linter.Config[]} */
export const ignores = [{ ignores: GLOB_IGNORES }]
