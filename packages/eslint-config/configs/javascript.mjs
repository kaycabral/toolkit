// Layer: JavaScript baseline — ESLint recommended, runtime globals, and the
// language-agnostic maintainability gates. TS-only rules live in `typescript.mjs`.

import js from '@eslint/js'
import sonarjs from 'eslint-plugin-sonarjs'
import globals from 'globals'

import { GLOB_ALL, GLOB_SERVICE_WORKER } from '../globs.mjs'
import { cbrlPlugin } from '../plugin.mjs'

/** @type {import('eslint').Linter.Config[]} */
export const javascript = [
  js.configs.recommended,
  {
    // Invariant #7 backstop: neutralizes every `eslint-disable*` / inline
    // `/* eslint */` comment (the suppressed rule fires anyway), so the
    // `cbrl/no-eslint-disable` error below can't itself be silenced inline.
    linterOptions: { noInlineConfig: true },
  },
  {
    files: [GLOB_ALL],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    // Public service workers run in a separate global scope. Without this
    // override `self` collides with the default `globals.browser` declaration
    // and triggers `no-redeclare`.
    files: GLOB_SERVICE_WORKER,
    languageOptions: {
      globals: { ...globals.serviceworker },
    },
  },
  {
    files: [GLOB_ALL],
    plugins: { cbrl: cbrlPlugin, sonarjs },
    rules: {
      'cbrl/no-conditional-spread-chain': 'error',
      'cbrl/no-env-value-fallback': 'error',
      'cbrl/no-eslint-disable': 'error',
      // Maintainability gates (high-signal, error). Existing violations are
      // grandfathered via the native ESLint bulk-suppressions file
      // (`eslint-suppressions.json`) and pruned as they're fixed — new code
      // must comply.
      //
      // Cognitive complexity (SonarJS — the SonarQube metric) is the gate: it
      // weights how hard code is to *understand*, not just branch count. We
      // deliberately do NOT gate cyclomatic `complexity` (flags readable flat
      // switches), `max-nested-callbacks` (flags legit describe/it test nesting)
      // or raw lines-per-function (formatting noise, gameable) — high bar on the
      // metric that signals, not on the noisy ones.
      'sonarjs/cognitive-complexity': ['error', 15],
      'max-depth': ['error', 4],
      'max-params': ['error', 4],
      // Native ESLint rule paired with `cbrl/no-conditional-spread-chain`.
      // Catches the *direct* nested-ternary form (`a ? b ? x : y : z`) that the
      // custom rule doesn't target (the custom rule targets the spread nesting
      // form). Together they close both faces of "ternary legibility" the team
      // has flagged.
      'no-nested-ternary': 'error',
      // Keep the rule enforced (catches the real bug, `const {} = x`) but allow
      // an empty object pattern as a *parameter* — the canonical Playwright
      // no-dependency fixture signature `async ({}, use) => …`. Avoids a blanket
      // `no-empty-pattern: off` exception for e2e dirs.
      'no-empty-pattern': ['error', { allowObjectPatternsAsParameters: true }],
      'sonarjs/no-commented-code': 'error',
      'no-inline-comments': 'error',
      'line-comment-position': ['error', 'above'],
      'no-warning-comments': ['error', { terms: ['hack'], location: 'anywhere' }],
    },
  },
]
