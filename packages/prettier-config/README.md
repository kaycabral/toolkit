# @cbrl/prettier-config

No semicolons, single quotes, trailing commas, 100 columns, imports organized on save.

```sh
pnpm add -D @cbrl/prettier-config prettier
```

```jsonc
// package.json
{ "prettier": "@cbrl/prettier-config" }
// or, for Tailwind projects (adds class sorting for cn/clsx/cva):
{ "prettier": "@cbrl/prettier-config/tailwind" }
```

Tailwind v4 projects should point the plugin at their stylesheet with an
override config:

```js
// prettier.config.mjs
import tailwind from '@cbrl/prettier-config/tailwind'
export default { ...tailwind, tailwindStylesheet: './src/app/globals.css' }
```
