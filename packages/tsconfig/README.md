# @cbrl/tsconfig

Strict TypeScript presets for bundler-resolved projects (`moduleResolution: bundler`).

```sh
pnpm add -D @cbrl/tsconfig typescript
```

| Preset                              | Use for                                                |
| ----------------------------------- | ------------------------------------------------------ |
| `@cbrl/tsconfig/base.json`          | Node scripts, server packages                          |
| `@cbrl/tsconfig/nextjs.json`        | Next.js apps (DOM lib, `jsx: preserve`, `next` plugin) |
| `@cbrl/tsconfig/react-library.json` | React packages (`jsx: react-jsx`)                      |

```jsonc
// tsconfig.json of a Next.js app
{
  "extends": "@cbrl/tsconfig/nextjs.json",
  "compilerOptions": { "paths": { "@/*": ["./src/*"] } },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"],
}
```

`include`, `exclude` and `paths` stay in the project: TypeScript resolves them
relative to the file that declares them.

Highlights of `base`: `strict`, `noUncheckedIndexedAccess`, `isolatedModules`,
`target: ES2022`, `noEmit` (bundlers emit).

## TypeScript 6

The presets carry no option TypeScript 6 deprecates. One TS 6 default does
reach projects: `types` now defaults to `[]`, so `@types/*` packages are no
longer included automatically. Declare the ambient types the project relies on
in its own `tsconfig.json` (a Node package: `"types": ["node"]`; Vitest
globals: add `"vitest/globals"`). Next.js apps get Node types through
`next-env.d.ts`.
