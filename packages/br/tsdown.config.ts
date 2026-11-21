import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    phone: 'src/phone.ts',
    money: 'src/money.ts',
    'tax-id': 'src/tax-id.ts',
    'postal-code': 'src/postal-code.ts',
  },
  platform: 'neutral',
  dts: true,
  exports: true,
})
