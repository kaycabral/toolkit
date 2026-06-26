// Layer: test-quality & ownership gates (paved road). See CONTRIBUTING.md
// §"Princípios de engenharia". Prefer the canonical community plugin over a
// custom rule; a built-in `no-restricted-*` is used ONLY where no plugin rule
// exists (the data-testid and raw-primitive bans). Existing violations are
// grandfathered via the native bulk-suppressions file and pruned over time —
// new code must comply.

import jsxA11y from 'eslint-plugin-jsx-a11y'
import playwright from 'eslint-plugin-playwright'
import testingLibrary from 'eslint-plugin-testing-library'

import { GLOB_APPS, GLOB_E2E_SPECS, GLOB_TEST_FILES, GLOB_TS, GLOB_TSX } from '../globs.mjs'

// `data-testid` is banned everywhere: tests must target accessible
// roles/labels/text (reachable via the jsx-a11y layer). A test that can only be
// written against a testid signals inaccessible markup — fix the markup, not the
// test. No community rule bans the attribute at the source, so this is the
// built-in no-restricted-syntax (not a custom cbrl/* rule).
const NO_DATA_TESTID = {
  selector: "JSXAttribute[name.name='data-testid']",
  message:
    'Do not use data-testid. Make the element queryable by role/label/text (see jsx-a11y) so tests target accessible semantics, not test hooks.',
}

// Apps must not hand-roll UI primitives the design system owns.
const NO_RAW_PRIMITIVE = {
  selector: 'JSXOpeningElement[name.name=/^(button|input|textarea|select)$/]',
  message:
    'Do not hand-roll UI primitives in an app. Import Button/Input/Textarea/Select from @cbrl/design — the design system owns primitives so they are built and tested in one place.',
}

// The playwright recommended set ships several rules as `warn`; force every one
// to `error` — an advisory that never blocks is documentation in disguise. A
// flaky-test smell must fail loud and be fixed now, not accumulate.
const playwrightErrors = Object.fromEntries(
  Object.entries(playwright.configs['flat/recommended'].rules).map(([rule, level]) => [
    rule,
    level === 'warn' || level === 1 ? 'error' : level,
  ]),
)

/** @type {import('eslint').Linter.Config[]} */
export const testQuality = [
  // Accessibility — jsx-a11y. Beyond the a11y win, `htmlFor`/role pairing is
  // what lets Playwright/Testing-Library query by role+label instead of brittle
  // selectors. The upstream half of "no data-testid".
  { ...jsxA11y.flatConfigs.recommended, files: [GLOB_TSX] },

  // Testing Library — query best practices (prefer getByRole, no direct
  // container.querySelector, await async queries). Component/unit tests only.
  { ...testingLibrary.configs['flat/react'], files: [GLOB_TEST_FILES] },

  // Playwright — web-first assertions, no arbitrary waitForTimeout/networkidle,
  // no ElementHandle. Scoped to the e2e specs.
  {
    ...playwright.configs['flat/recommended'],
    files: GLOB_E2E_SPECS,
    rules: {
      ...playwrightErrors,
      // Teach expect-expect about our custom assertion helpers so a test that
      // asserts *through* a helper isn't flagged as assertion-less.
      'playwright/expect-expect': ['error', { assertFunctionNames: ['assertOk', 'assertNoCrash'] }],
    },
  },

  // `data-testid` banned everywhere.
  {
    files: [GLOB_TS],
    rules: { 'no-restricted-syntax': ['error', NO_DATA_TESTID] },
  },

  // Test-ownership / no-duplication gate. Apps must not re-implement design
  // primitives nor reach for Radix directly — that path belongs to @cbrl/design.
  // Keeps app code about business rules and primitives built/tested in one place.
  {
    files: [GLOB_APPS],
    rules: {
      'no-restricted-syntax': ['error', NO_DATA_TESTID, NO_RAW_PRIMITIVE],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['radix-ui', '@radix-ui/*'],
              message:
                'Radix belongs to @cbrl/design. Apps consume design components, not Radix directly — promote the primitive to @cbrl/design instead.',
            },
          ],
        },
      ],
    },
  },
]
