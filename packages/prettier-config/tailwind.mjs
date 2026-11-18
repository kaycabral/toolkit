import * as tailwindcss from 'prettier-plugin-tailwindcss'
import base from './index.mjs'

/**
 * Base config plus Tailwind class sorting. `prettier-plugin-tailwindcss` must be
 * the last plugin. Tailwind v4 projects should also set `tailwindStylesheet`.
 *
 * @type {import('prettier').Config}
 */
const config = {
  ...base,
  plugins: [...base.plugins, tailwindcss],
  tailwindFunctions: ['cn', 'clsx', 'cva'],
}

export default config
