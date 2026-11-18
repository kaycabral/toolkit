import organizeImports from 'prettier-plugin-organize-imports'

/**
 * Plugins are passed as imported modules, not names: Prettier resolves plugin
 * names from the consuming project, which does not depend on them directly.
 * The `name` lets prettier-plugin-tailwindcss recognize and chain this plugin
 * instead of overriding its parsers.
 */
const organizeImportsPlugin = { ...organizeImports, name: 'prettier-plugin-organize-imports' }

/** @type {import('prettier').Config} */
const config = {
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  plugins: [organizeImportsPlugin],
}

export default config
