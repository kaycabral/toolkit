# Custom rules — `cbrl/*`

Cada regra codifica um invariante do monorepo que built-ins não cobrem. O rationale completo (anti-pattern, por quê, padrão correto) vive no header de cada `.mjs` — fonte única, não duplicar aqui.

| Regra                         | Codifica                                              | Built-in que complementa                                                 |
| ----------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------ |
| `no-eslint-disable`           | Invariante #7 (nunca desabilitar) — reporta **error** | `noInlineConfig` (nativo, só warning) → usado como backstop unbypassable |
| `no-conditional-spread-chain` | Decisão PR #971/#972 (spread cond aninhado)           | `no-nested-ternary` (forma ternária direta)                              |
| `no-env-value-fallback`       | fail-fast > silent default em `process.env`           | —                                                                        |

> `no-eslint-disable` é error + `linterOptions.noInlineConfig: true` (em `../configs/javascript.mjs`) como backstop: o nativo sozinho só emite warning (não barra `eslint .` sem `--max-warnings 0`); a custom rule dá o hard-fail e o `noInlineConfig` impede que ela seja silenciada inline.

## Convenção de autoria

Toda regra custom é um **trio**:

```
rules/
  <name>.mjs        # a regra: header com rationale + export const <camelCase>
  <name>.test.mjs   # RuleTester com casos valid + invalid
```

1. **`<name>.mjs`** — header em prosa (o porquê + anti-pattern + padrão correto), depois `export const <camelCase> = { meta, create }`. `meta.docs.description` em inglês.
2. **`<name>.test.mjs`** — `RuleTester` do `eslint` + `node:test`. Regras que inspecionam AST de TS (`TSAsExpression`, etc.) precisam de `languageOptions.parser: tseslint.parser`.
3. **Registrar** em [`../plugin.mjs`](../plugin.mjs) sob o id kebab-case.
4. **Ativar** na layer apropriada (`../configs/javascript.mjs` para regras gerais, `../configs/typescript.mjs` para regras TS-only).

`pnpm test` (`node --test rules/*.test.mjs`) roda toda a suíte.

## Gotcha — testar `no-eslint-disable`

Não dá pra testar com um `/* eslint-disable */` sem escopo: ele desabilita TODA regra do arquivo, inclusive a própria, e o report se auto-suprime. Use sempre um disable escopado a outra regra (`/* eslint-disable no-console */`) nos casos `invalid`.
