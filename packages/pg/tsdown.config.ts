import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: { index: 'src/index.ts', drizzle: 'src/drizzle.ts' },
  platform: 'node',
  dts: true,
  exports: true,
})
