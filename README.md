# toolkit

Shared engineering foundation for my products: lint, TypeScript and formatting
presets, runtime utilities and a design system, published to npm under `@cbrl/*`.

| Package                                                 | What it is                                                                              |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [`@cbrl/tsconfig`](packages/tsconfig)                   | Strict TypeScript presets: `base`, `nextjs`, `react-library`                            |
| [`@cbrl/eslint-config`](packages/eslint-config)         | ESLint flat config (TS type-aware, React, Next, tests) + custom `cbrl/*` rules          |
| [`@cbrl/prettier-config`](packages/prettier-config)     | Prettier config, with a `/tailwind` variant                                             |
| [`@cbrl/commitlint-config`](packages/commitlint-config) | Conventional Commits with required scope                                                |
| [`@cbrl/env`](packages/env)                             | Fail-fast environment variable readers                                                  |
| [`@cbrl/pg`](packages/pg)                               | Hardened `pg` pool: timeouts, idle-error handler, Supabase CA pin, Cloud SQL IAM        |
| [`@cbrl/supabase`](packages/supabase)                   | Supabase Auth for Next.js 16: clients, proxy refresh, callback/test routes, local stack |
| [`@cbrl/testing`](packages/testing)                     | Vitest coverage base, `server-only` shim, axe matcher                                   |
| [`@cbrl/design`](packages/design)                       | Radix + Tailwind v4 design system with overridable tokens                               |

Also in this repo:

- **Reusable CI**: [`.github/workflows/node-ci.yml`](.github/workflows/node-ci.yml), consumed with
  `uses: kaycabral/toolkit/.github/workflows/node-ci.yml@<sha>`.
- **Dependency updates**: each consumer runs Dependabot with a `cbrl-toolkit`
  group, so a toolkit release lands as one PR per app. Copy
  [`.github/dependabot.yml`](.github/dependabot.yml) and add the app's workspace
  directories.

## Development

```sh
pnpm install
pnpm build && pnpm lint && pnpm typecheck && pnpm test && pnpm check:package
```

Requires Node (see `.nvmrc`) and pnpm (see `packageManager`).

## Releasing

Versioning is per package with [Changesets](https://github.com/changesets/changesets):

1. In your PR, run `pnpm changeset` and describe the change (patch/minor/major).
2. On merge, the Release workflow opens a "version packages" PR.
3. Merging that PR publishes to npm through trusted publishing (OIDC, no stored
   token), with provenance.

Breaking changes are major bumps. While a package is `0.x`, a minor bump may break.

## Testing an unreleased change in an app

```sh
# in the app repo
pnpm add @cbrl/design@link:../toolkit/packages/design   # rebuild the package with `pnpm build`
```

Revert to the registry version before merging the app.

## License

[MIT](LICENSE)
