import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: { index: 'src/index.ts' },
  unbundle: true,
  platform: 'neutral',
  dts: true,
  copy: [{ from: 'src/*.css', to: 'dist', flatten: true }],
  exports: {
    customExports: {
      './globals.css': './dist/globals.css',
      './tokens.css': './dist/tokens.css',
      './shadcn.css': './dist/shadcn.css',
    },
  },
})
