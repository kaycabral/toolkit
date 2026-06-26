// Layer: TypeScript — typescript-eslint *type-checked* preset plus the
// project's type-safety rules.
//
// This layer turns on TYPED LINTING: `projectService: true` makes the parser
// build a TS program per file, which unlocks the `no-unsafe-*` family,
// `no-floating-promises`, `no-misused-promises`, and `no-unsafe-type-assertion`
// (the type-aware replacement for the old `cbrl/no-ts-escape-hatches` custom
// rule — it sees `as any`, `as unknown as X` AND any cast that widens safety).
//
// Type-aware rules only make sense on real source files that belong to a
// tsconfig. Plain `.js/.mjs/.cjs` (configs, scripts) get `disableTypeChecked`
// so the parser doesn't try to find a program for them.
//
// gabar is NOT special-cased here: a `**/gabar/**` glob can't work, because
// each workspace lints with cwd = its own dir (`eslint .`), so paths are
// relative to that dir and never contain `gabar`. gabar's pre-migration debt
// is grandfathered the same way every other app's is — via a per-app
// `eslint-suppressions.json` snapshot — which also gives it the same ratchet
// (new violations fail) instead of a silently-ignored warn tier.

import tseslint from 'typescript-eslint'

import { GLOB_TS } from '../globs.mjs'
import { cbrlPlugin } from '../plugin.mjs'

/** @type {import('eslint').Linter.Config[]} */
export const typescript = [
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: [GLOB_TS],
    languageOptions: {
      parserOptions: {
        // Auto-discovers the nearest tsconfig per file. tsconfigRootDir
        // defaults to process.cwd() — the app dir when `eslint .` runs there.
        projectService: true,
      },
    },
    plugins: { cbrl: cbrlPlugin },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      // Type-aware successor to the retired `cbrl/no-ts-escape-hatches`.
      '@typescript-eslint/no-unsafe-type-assertion': 'error',
      // Promise hygiene — the most common real bug typed linting catches.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
    },
  },
  {
    // Non-typed files (plain JS configs/scripts) have no TS program — turn the
    // type-aware rules off so the parser doesn't error looking for one.
    files: ['**/*.{js,mjs,cjs}'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    // TS config files (vitest/playwright/next.config.ts …) usually aren't in
    // any tsconfig, so `projectService` can't find a program for them and
    // throws a parse error (which `--suppress-all` can't grandfather). Opt
    // them out of the project service entirely + disable type-aware rules.
    // `disableTypeChecked` already resets parserOptions (project/projectService
    // → false), which is what stops the parse error.
    files: ['**/*.config.{ts,cts,mts}', '**/*.config.*.{ts,cts,mts}'],
    ...tseslint.configs.disableTypeChecked,
  },
]
