import baseConfig from '@cbrl/eslint-config'

export default [...baseConfig, { ignores: ['dist/**', 'coverage/**'] }]
