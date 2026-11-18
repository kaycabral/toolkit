# Custom rules: `cbrl/*`

Each rule is a pair:

```
rules/
  <name>.mjs        # header with the rationale, then `export const <camelCase> = { meta, create }`
  <name>.test.mjs   # RuleTester (eslint) + node:test, valid and invalid cases
```

To add one: write the pair, register it in [`../plugin.mjs`](../plugin.mjs) under
its kebab-case id, enable it in the right layer (`../configs/javascript.mjs` for
general rules, `../configs/typescript.mjs` for TS-only ones) and add a changeset.
Rules that inspect TS nodes need `languageOptions.parser: tseslint.parser` in tests.

`pnpm test` runs the suite. Fixtures for type-aware tests live in `fixtures/`.
