// Lints the config package itself. `rules/fixtures/**` and `configs/fixtures/**`
// are test inputs (they deliberately contain the patterns the rules flag), not code.
import baseConfig from './index.mjs'

export default [
  ...baseConfig,
  {
    ignores: ['rules/fixtures/**', 'configs/fixtures/**'],
  },
]
