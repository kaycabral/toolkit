// Canonical ESLint flat config (`@cbrl/eslint-config`).
//
// Consumed by `apps/<x>/eslint.config.mjs` via:
//   import cbrlBase from '@cbrl/eslint-config'
//   export default cbrlBase
//
// Workspaces that need extra rules can spread + extend:
//   export default [...cbrlBase, { rules: { /* per-app overrides */ } }]
//
// This file is a thin composition root: each config "layer" lives in its own
// module under `configs/`, glob patterns in `globs.mjs`, custom rules in
// `rules/` (registered via `plugin.mjs`). To change behavior, edit the layer —
// not this list. Order matters: ignores first, then language baselines, then
// the structural gate.

import { ignores } from './configs/ignores.mjs'
import { javascript } from './configs/javascript.mjs'
import { layering } from './configs/layering.mjs'
import { moduleSize } from './configs/module-size.mjs'
import { next } from './configs/next.mjs'
import { testQuality } from './configs/test-quality.mjs'
import { typescript } from './configs/typescript.mjs'

// Named exports let a workspace compose individual layers when the full preset
// is too much (e.g. a config-only package that wants `ignores` + `javascript`).
export { ignores, javascript, layering, moduleSize, next, testQuality, typescript }

export default [
  ...ignores,
  ...javascript,
  ...typescript,
  ...moduleSize,
  ...layering,
  ...testQuality,
  // Next-framework adjustments last, so its scoped `routes.ts` exception wins
  // over the generic TS assertion rules above. No-op for non-Next workspaces.
  ...next,
]
