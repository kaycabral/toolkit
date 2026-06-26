// Layer: module-size gate — Uncle Bob's "module sizes". Caps a source module
// so god-files get flagged structurally (a 900-line module hides too much).
// Counts CODE lines only (blanks + comments skipped) so it tracks real size,
// not formatting/docs. Scoped to `src/**` source: test/spec/e2e/smoke files are
// exempt (large fixtures/table-driven specs are legitimate), as are configs
// (outside src). Existing violations are grandfathered via the bulk-suppressions
// file and pruned as files are split. This is the FILE metric only — we still
// deliberately do NOT gate lines-per-function (gameable, formatting noise; see
// the maintainability block in `javascript.mjs`).
//
// Cap = 500 code-lines: generous enough that cohesive modules (a fixture, a saga
// shell) aren't forced into artificial splits, strict enough that a god-file is
// still flagged. No clean file sits in the 400-500 band, so the bar is real (not
// a loophole). Recalibrado 400→500 em 2026-06-09.

import { GLOB_SRC, GLOB_TESTS } from '../globs.mjs'

/** @type {import('eslint').Linter.Config[]} */
export const moduleSize = [
  {
    files: [GLOB_SRC],
    ignores: GLOB_TESTS,
    rules: {
      'max-lines': ['error', { max: 500, skipBlankLines: true, skipComments: true }],
    },
  },
]
