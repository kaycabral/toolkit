import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    firebase: 'src/firebase/index.ts',
    vitest: 'src/vitest/index.ts',
    'vitest/server-only-shim': 'src/vitest/server-only-shim.ts',
    a11y: 'src/vitest/a11y.ts',
  },
  platform: 'node',
  dts: true,
  exports: true,
})
