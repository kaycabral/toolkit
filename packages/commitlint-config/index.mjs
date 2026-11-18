/** @type {import('@commitlint/types').UserConfig} */
const config = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-empty': [2, 'never'],
    'header-max-length': [2, 'always', 72],
    'scope-case': [2, 'always', ['lower-case', 'kebab-case']],
  },
}

export default config
