// Layer: architectural layering gate — turns the feature-slice ring model into
// a machine-checked dependency graph instead of a prose convention. Two walls:
//
//   1. PURITY — `features/*/core/**` is the functional core: pure rules, view
//      models, parsing. It MUST NOT reach for React, Next, Firestore, or any
//      I/O. The whole point is that core is unit-testable with zero harness, so
//      coverage + mutation have teeth. Enforced with stock `no-restricted-imports`
//      (zero false positives — purity is literally "doesn't import these").
//
//   2. DIRECTION — dependencies only ever point DOWN the ring stack:
//         ui  →  adapters  →  core
//      A component may call an adapter; an adapter may call core; never the
//      reverse. core importing an adapter (or ui) is the classic leak that makes
//      the "pure" core impure by transitivity. Enforced with eslint-plugin-
//      boundaries' element-types graph.
//
// Scoped entirely to the `features/<slice>/<ring>/` convention — an app that
// hasn't adopted feature slices has no matching files, so this layer is a no-op
// there. Adopt the folders, get the wall; nothing to opt into per-app.
//
// External packages (`@acme/shared`, `@cbrl/design`, …) are deliberately
// unclassified: `default: 'allow'` means only the upward-import rules below bite.
// A pure-domain shared package can be imported from core.

import boundaries from 'eslint-plugin-boundaries'
import { GLOB_SRC } from '../globs.mjs'

const CORE_FILES = ['**/features/*/core/**/*.{ts,tsx}']

/** @type {import('eslint').Linter.Config[]} */
export const layering = [
  // ── Wall 1: core purity ────────────────────────────────────────────────
  {
    files: CORE_FILES,
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'next', 'next/*'],
              message:
                'core/ is the functional core: no React/Next. State, effects and rendering live in ui/ or adapters/.',
            },
            {
              group: [
                'firebase',
                'firebase/*',
                'firebase-admin',
                'firebase-admin/*',
                '@/shared/db',
                '@/shared/db/*',
                'server-only',
              ],
              message:
                'core/ is pure: no Firestore/admin/server-only. Data access lives in adapters/ (e.g. *.repo.ts).',
            },
            {
              group: ['**/adapters/*', '**/ui/*', '@/features/*/adapters/*', '@/features/*/ui/*'],
              message:
                'Dependencies only point down (ui→adapters→core): core/ must not import adapters/ or ui/.',
            },
            {
              group: ['@/app/*', '@/app/**'],
              message:
                'features/ must not import app/: app is the outer routing shell (inversion).',
            },
          ],
        },
      ],
    },
  },
  // ── Wall 1b: domain kernel purity ──────────────────────────────────────
  // `domain/` is the innermost ring (ES aggregates, read-model schemas, pure
  // rules). It depends on NOTHING above it — no framework, no I/O, no app infra
  // (`shared/`), no features. Keeps the kernel mutation-testable + reusable.
  {
    files: ['**/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'next', 'next/*'],
              message: 'domain/ is the pure kernel: no React/Next.',
            },
            {
              group: [
                'firebase',
                'firebase/*',
                'firebase-admin',
                'firebase-admin/*',
                '@/shared/db',
                '@/shared/db/*',
                'server-only',
              ],
              message: 'domain/ is pure: no Firestore/admin/server-only.',
            },
            {
              group: ['@/shared/*', '@/features/*', '@/app/*'],
              message:
                'domain/ is the innermost ring: it must not import shared/, features/ or app/.',
            },
          ],
        },
      ],
    },
  },
  // ── Wall 1c: no layer inversion ────────────────────────────────────────
  // Dependencies point inward only: app → features → shared → domain. These
  // catch the upward (inverted) imports the per-ring walls above don't:
  //   • features (adapters/ui) → app   (app is the outer routing shell)
  //   • shared → features / app         (shared is below features)
  //   • components → app                (shared visual is below routing)
  // Scopes are disjoint from the core/domain walls above (no rule-merge clash).
  {
    files: ['**/features/*/adapters/**/*.{ts,tsx}', '**/features/*/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/*', '@/app/**'],
              message:
                'features/ must not import app/: app is the outer routing shell (inversion).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*', '@/features/**', '@/app/*', '@/app/**'],
              message:
                'shared/ is infrastructure below features/: it must not import features/ or app/ (layer inversion).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/*', '@/app/**'],
              message: 'components/ is shared UI: it must not import app/ (layer inversion).',
            },
          ],
        },
      ],
    },
  },
  // ── Wall 2: ring direction ─────────────────────────────────────────────
  {
    files: [GLOB_SRC],
    plugins: { boundaries },
    settings: {
      'boundaries/include': ['**/features/**'],
      'boundaries/elements': [
        { type: 'feat-core', pattern: 'features/*/core/**', mode: 'full' },
        { type: 'feat-adapters', pattern: 'features/*/adapters/**', mode: 'full' },
        { type: 'feat-ui', pattern: 'features/*/ui/**', mode: 'full' },
      ],
    },
    rules: {
      'boundaries/element-types': [
        'error',
        {
          default: 'allow',
          rules: [
            {
              from: ['feat-core'],
              disallow: ['feat-adapters', 'feat-ui'],
              message:
                'core ({{from}}) must not import {{target}}: dependencies only point down (ui→adapters→core).',
            },
            {
              from: ['feat-adapters'],
              disallow: ['feat-ui'],
              message:
                'adapters ({{from}}) must not import ui: the flow is ui→adapters, never the reverse.',
            },
          ],
        },
      ],
    },
  },
]
