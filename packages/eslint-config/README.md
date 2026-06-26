# @cbrl/eslint-base

Canonical ESLint flat config shared por todo workspace do monorepo cbrl. Source of truth para regras de lint (rules, ignores, parser config). Cada workspace tem seu próprio `eslint.config.mjs` que importa daqui — divergência local fica explícita.

## Como consumir

1. Adicione como devDependency no workspace:

   ```jsonc
   // apps/<seu-app>/package.json
   {
     "devDependencies": {
       "@cbrl/eslint-base": "workspace:*",
     },
   }
   ```

2. Crie `eslint.config.mjs` no workspace:

   ```js
   // apps/<seu-app>/eslint.config.mjs
   import cbrlBase from '@cbrl/eslint-base'
   export default cbrlBase
   ```

3. Para extender com regras específicas do app:

   ```js
   import cbrlBase from '@cbrl/eslint-base'
   export default [
     ...cbrlBase,
     {
       rules: {
         // app-specific overrides
       },
     },
   ]
   ```

4. `pnpm install` — pnpm resolve `@cbrl/eslint-base` via workspace protocol.

## Estrutura

O entry-point é um **composition root** fino — cada preocupação vive na sua própria layer:

```
index.mjs            # compõe as layers (e re-exporta cada uma como named export)
globs.mjs            # constantes de glob (GLOB_SRC, GLOB_TS, GLOB_TESTS…) — fonte única
plugin.mjs           # plugin `cbrl` (registry das custom rules)
configs/
  ignores.mjs        # ignores globais
  javascript.mjs     # js.recommended + globals + maintainability gates (sonarjs, max-*)
  typescript.mjs     # tseslint.recommendedTypeChecked (typed linting) + regras TS
  module-size.mjs    # gate max-lines (god-files)
  test-quality.mjs   # gates de teste/a11y/ownership (jsx-a11y, testing-library, playwright, no-data-testid, no-raw-primitives)
rules/               # custom rules — trio <name>.{mjs,test.mjs} + README (convenção)
```

Para mudar comportamento, edite a layer — não o `index.mjs`. Workspaces consomem o default (`...cbrlBase`) ou compõem layers individuais via named export (`import { javascript } from '@cbrl/eslint-base'`).

## O que está aqui

- ESLint recomendado (`@eslint/js`).
- TypeScript-ESLint **type-checked** (`typescript-eslint` `recommendedTypeChecked` + `projectService: true`) — typed linting ligado.
- Regras type-aware: família `no-unsafe-*` (any vazando de libs sem tipo / `JSON.parse`), `no-floating-promises`, `no-misused-promises`, e `no-unsafe-type-assertion` (sucessor type-aware da extinta `cbrl/no-ts-escape-hatches` — pega `as any`, `as unknown as X` e qualquer cast que alargue a segurança).
- **Dívida pré-migration (incl. gabar)** é grandfathered por `eslint-suppressions.json` **per-app** (gerado com `eslint --suppress-all`), não por relaxação de regra. Per-app porque o gate roda `eslint .` por workspace (cwd = dir do app) e o ESLint resolve o suppressions file relativo ao cwd. Isso dá catraca: violação **nova** falha; as antigas ficam congeladas pro burndown.
- Globals: browser + node por default; serviceworker em `public/sw.js`.
- Ignores: `node_modules`, `.next`, `dist`, `build`, `coverage`, `playwright-report`, `test-results`, `*.config.js`.
- Regras TS extras: `consistent-type-imports` (error), `no-unused-vars` com `^_` opt-out.
- Gates de manutenibilidade: `sonarjs/cognitive-complexity` (15), `max-depth` (4), `max-params` (4), `no-nested-ternary`, `max-lines` (500, só `src/**`).
- `linterOptions.noInlineConfig` (nativo) — backstop unbypassable da `cbrl/no-eslint-disable` (neutraliza todo disable inline).
- **Gates de teste/a11y/ownership** (layer `test-quality.mjs` — paved road, ver [CONTRIBUTING §Princípios de engenharia](../../CONTRIBUTING.md#princípios-de-engenharia)). Preferem o plugin canônico; custom/`no-restricted-*` só quando não há equivalente:
  - `eslint-plugin-jsx-a11y` (recommended, `*.tsx`) — `htmlFor`/role; habilita query por role/label no PW.
  - `eslint-plugin-testing-library` (`flat/react`, `*.test.tsx`) — prefer `getByRole`, sem `container.querySelector`.
  - `eslint-plugin-playwright` (`flat/recommended`, e2e specs; todo `warn`→`error`) — web-first assertions, sem `waitForTimeout`/`networkidle`.
  - `no-restricted-syntax` (built-in) — proíbe `data-testid` em todo lugar; e em `apps/**` proíbe primitivo cru (`<button>/<input>/<textarea>/<select>`).
  - `no-restricted-imports` (built-in) — `apps/**` não importa `radix-ui`/`@radix-ui/*` (Radix é responsabilidade do `@cbrl/design`).
- **Custom rules** (detalhe + convenção de autoria em [`rules/README.md`](rules/README.md)):
  - `cbrl/no-eslint-disable` — proíbe TODA directive `eslint-disable*` (error). Codifica invariante #7 do CLAUDE.md raiz.
  - `cbrl/no-conditional-spread-chain` — proíbe spread condicional aninhado em outro spread condicional. Codifica decisão dos PRs #971/#972; complementa `no-nested-ternary`.
  - `cbrl/no-env-value-fallback` — proíbe fallback **literal de valor** em `process.env.<QUALQUER>` (`?? 'x'`, `|| 'x'`, `??= 'x'`, `||= 'x'`, e cadeias `A ?? B ?? 'x'`). Codifica **fail-fast > silent default**: um default literal mascara misconfig (o app roda com valor trivial em vez de quebrar e expor que a env não foi setada). Vale pra qualquer env, não só secrets. **NÃO viola** (default não é literal de valor): `||` booleano / lógica (`if (env.X || env.Y)`), cadeia env→env sem literal (`env.A ?? env.B`, termina em throw downstream), normalização de ausência (`?? null` / `?? undefined`), e fallback computado (`?? join(homedir(), …)`). Correto: ler a env e falhar alto se ausente (helper `env('X')`).

## Custom rules — pattern de mock em tests

Quando precisar mockar SDK externo (Firebase Auth, etc.) sem cast, **não use `as unknown as X`** — viola `@typescript-eslint/no-unsafe-type-assertion`. Alternativas type-safe:

- **Function mocks**: `vi.fn<MyDep>(impl)` — retorna `Mock<MyDep>` que **é** callable como `MyDep`.
- **Interface mocks**: criar factory completa (`createMockUser()` que retorna `User` com cada método como `vi.fn()`).
- **DOM types**: prefira APIs reais do jsdom (ex.: `new DataTransfer()` retorna `FileList` válido sem cast).
- **Partial value casting**: single cast `as X` (não `unknown as X`) **é permitido** quando contexto trivial.

## Atualizando

Bump `version` no `package.json` daqui quando mudar algo. Workspaces que usam `workspace:*` pegam automaticamente no próximo `pnpm install`.

## Pattern

Esse pacote faz parte do padrão de **shared canonical config**. Não duplique regras daqui em workspaces — importe.
