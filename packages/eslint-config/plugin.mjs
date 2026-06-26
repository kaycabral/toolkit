// The `cbrl` ESLint plugin — registry of the monorepo's custom rules.
// Each rule lives in `rules/<name>.mjs` with a sibling `.test.mjs` and a
// `.md` doc. Wire a new rule in three steps: add the trio, import it here,
// register it under its kebab-case id.

import { noConditionalSpreadChain } from './rules/no-conditional-spread-chain.mjs'
import { noEnvValueFallback } from './rules/no-env-value-fallback.mjs'
import { noEslintDisable } from './rules/no-eslint-disable.mjs'

export const cbrlPlugin = {
  rules: {
    'no-conditional-spread-chain': noConditionalSpreadChain,
    'no-env-value-fallback': noEnvValueFallback,
    'no-eslint-disable': noEslintDisable,
  },
}
