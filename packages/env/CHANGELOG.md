# @cbrl/env

## 0.1.1

### Patch Changes

- [#20](https://github.com/kaycabral/toolkit/pull/20) [`2a2777a`](https://github.com/kaycabral/toolkit/commit/2a2777a64bf04738bbd20fe7fc7bd6e85064909d) Thanks [@kaycabral](https://github.com/kaycabral)! - The `layering` purity walls (`features/*/core/**`, `domain/**`) now ban the I/O clients the apps actually use (`pg`, `drizzle-orm`, `@supabase/*`, `stripe`, `@cbrl/pg`, `@cbrl/supabase`) instead of the Firebase SDKs nobody uses anymore. Docs and examples in `@cbrl/env` and `@cbrl/testing` no longer mention Firebase.
