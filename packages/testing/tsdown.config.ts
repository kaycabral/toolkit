import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    playwright: 'src/playwright/index.ts',
    vitest: 'src/vitest/index.ts',
    'vitest/jsdom': 'src/vitest/jsdom.ts',
    'vitest/server-only-shim': 'src/vitest/server-only-shim.ts',
    a11y: 'src/vitest/a11y.ts',
  },
  platform: 'node',
  dts: true,
  exports: true,
})
