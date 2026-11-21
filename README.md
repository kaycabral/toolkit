# toolkit

Shared engineering foundation for my products: lint, TypeScript and formatting
presets, runtime utilities and a design system, published to npm under `@cbrl/*`.

| Package                                                 | What it is                                                                       |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [`@cbrl/tsconfig`](packages/tsconfig)                   | Strict TypeScript presets: `base`, `nextjs`, `react-library`                     |
| [`@cbrl/eslint-config`](packages/eslint-config)         | ESLint flat config (TS type-aware, React, Next, tests) + custom `cbrl/*` rules   |
| [`@cbrl/prettier-config`](packages/prettier-config)     | Prettier config, with a `/tailwind` variant                                      |
| [`@cbrl/commitlint-config`](packages/commitlint-config) | Conventional Commits with required scope                                         |
| [`@cbrl/env`](packages/env)                             | Fail-fast environment variable readers                                           |
| [`@cbrl/pg`](packages/pg)                               | Hardened `pg` pool: timeouts, idle-error handler, Supabase CA pin, Cloud SQL IAM |
| [`@cbrl/testing`](packages/testing)                     | Vitest coverage base, `server-only` shim, axe matcher                            |
| [`@cbrl/design`](packages/design)                       | Radix + Tailwind v4 design system with overridable tokens                        |

Also in this repo:

- **CI building blocks**, always consumed pinned to a commit SHA
  (`kaycabral/toolkit/<path>@<sha>`, kept current by Dependabot's
  `github-actions` updates):

  | Path                                                                                         | What it does                                                                               |
  | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
  | [`.github/actions/setup`](.github/actions/setup/action.yml)                                  | pnpm + Node from `packageManager`/`.nvmrc`, store cache, frozen install                    |
  | [`.github/actions/playwright`](.github/actions/playwright/action.yml)                        | Chromium + its system packages, both cached (offline `.deb` install on a hit)              |
  | [`.github/actions/drizzle-migrations`](.github/actions/drizzle-migrations/action.yml)        | Journal consistency, schema change without migration, applied migrations are immutable     |
  | [`.github/workflows/provenance.yml`](.github/workflows/provenance.yml)                       | On main: was this exact tree proven by a merged PR? Skips re-running checks when it was    |
  | [`.github/workflows/dependabot-auto-merge.yml`](.github/workflows/dependabot-auto-merge.yml) | Merges trusted Dependabot groups after the PR gate is green, then starts the main workflow |

  Each app keeps only its own composition: a `checks.yml` (which suites run), a
  `pull-request.yml` with the `CI passed` gate, a `main.yml` with its migration
  command, and `scorecard.yml` (the Scorecard action must live in the repo it
  scores).

- **Dependency updates**: copy [`templates/dependabot.yml`](templates/dependabot.yml)
  to the app unchanged. It runs from the workspace root only (per-workspace
  directories never see the root lockfile), quarantines new releases for 3 days,
  and groups `@cbrl/*` so a toolkit release lands as one PR per app.

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
