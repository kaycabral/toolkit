// Root config: lints files outside a package (root configs, changesets).
// Each package runs `eslint .` with its own config.
import baseConfig from '@cbrl/eslint-config'

export default [...baseConfig, { ignores: ['.husky/**', 'packages/**'] }]
