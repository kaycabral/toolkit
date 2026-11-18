// Lints the config package itself. `rules/fixtures/**` are inputs for the custom
// rules' tests (they deliberately contain the patterns the rules flag), not code.
import baseConfig from './index.mjs'

export default [
  ...baseConfig,
  {
    ignores: ['rules/fixtures/**'],
  },
]
