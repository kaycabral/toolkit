# @cbrl/tsconfig-base

Canonical TypeScript compiler options shared by every app and package no monorepo cbrl. Source of truth para `target`, `module`, `strict`, etc. Cada workspace estende este config e adiciona apenas o que é específico (paths, includes, jsx).

## Como consumir

1. Adicione como devDependency no workspace:

   ```jsonc
   // apps/<seu-app>/package.json
   {
     "devDependencies": {
       "@cbrl/tsconfig-base": "workspace:*",
     },
   }
   ```

2. Estenda no `tsconfig.json` do workspace:

   ```jsonc
   // apps/<seu-app>/tsconfig.json
   {
     "extends": "@cbrl/tsconfig-base/base.json",
     "compilerOptions": {
       "lib": ["dom", "dom.iterable", "esnext"],
       "jsx": "preserve",
       "paths": {
         "@/*": ["./src/*"],
       },
     },
     "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
     "exclude": ["node_modules"],
   }
   ```

3. `pnpm install` — pnpm resolve `@cbrl/tsconfig-base` via workspace protocol.

## O que está aqui (e por quê)

| Opção                        | Valor               | Por quê                                                  |
| ---------------------------- | ------------------- | -------------------------------------------------------- |
| `target`                     | `ES2022`            | Node 22 (engine mínimo do monorepo) + browsers modernos. |
| `lib`                        | `["ES2022"]`        | DOM lib é per-app (`lib` é override, não extends).       |
| `module`, `moduleResolution` | `esnext`, `bundler` | Casamento com Next.js + Vite.                            |
| `strict`                     | `true`              | Não negociável.                                          |
| `noUncheckedIndexedAccess`   | `true`              | Pega `arr[i] === undefined` em tempo de compilação.      |
| `isolatedModules`            | `true`              | Required pelo SWC/esbuild.                               |
| `allowJs`, `noEmit`          | `false`, `true`     | TS é só typechecking; build é via bundler.               |

## Atualizando

Bump `version` no `package.json` daqui quando mudar algo. Workspaces que usam `workspace:*` pegam automaticamente no próximo `pnpm install`. Se publicarmos isso como pacote npm interno no futuro, será via `pnpm up @cbrl/tsconfig-base -F <workspace>`.

## Pattern

Esse pacote faz parte do padrão de **shared canonical config**. Não duplique opções daqui em workspaces — extenda.
