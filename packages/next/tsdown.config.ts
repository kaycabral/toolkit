import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: { index: 'src/index.ts', config: 'src/config.ts', server: 'src/server.ts' },
  platform: 'node',
  dts: true,
  exports: true,
})
