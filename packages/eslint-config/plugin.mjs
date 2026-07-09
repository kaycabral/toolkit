import { noConditionalSpreadChain } from './rules/no-conditional-spread-chain.mjs'
import { noEnvValueFallback } from './rules/no-env-value-fallback.mjs'
import { noEslintDisable } from './rules/no-eslint-disable.mjs'
import { noNonDocComments } from './rules/no-non-doc-comments.mjs'

export const cbrlPlugin = {
  rules: {
    'no-conditional-spread-chain': noConditionalSpreadChain,
    'no-env-value-fallback': noEnvValueFallback,
    'no-eslint-disable': noEslintDisable,
    'no-non-doc-comments': noNonDocComments,
  },
}
