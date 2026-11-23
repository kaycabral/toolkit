# @cbrl/commitlint-config

Conventional Commits with a required, lower/kebab-case scope and a 72-char header
(so the subject fits a PR title).

```sh
pnpm add -D @cbrl/commitlint-config @commitlint/cli  # @commitlint/cli >= 20
```

```js
// commitlint.config.mjs
export { default } from '@cbrl/commitlint-config'
```

Accepted: `feat(design): add sidebar rail`. Rejected: `feat: add sidebar rail`.
