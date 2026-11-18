import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: { index: 'src/index.ts', 'cloud-sql': 'src/cloud-sql.ts' },
  platform: 'node',
  dts: true,
  exports: true,
})
