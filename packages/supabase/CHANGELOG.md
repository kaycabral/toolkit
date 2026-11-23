# @cbrl/supabase

## 0.2.0

### Minor Changes

- [#45](https://github.com/kaycabral/toolkit/pull/45) [`7f80240`](https://github.com/kaycabral/toolkit/commit/7f80240080d0ab42ffdabbb156b09a155556f36e) Thanks [@kaycabral](https://github.com/kaycabral)! - `authCallbackRoute` fails closed: when `onSession` throws, the session the code exchange just wrote is signed out (`scope: 'local'`, clearing the session cookies), the new `onSessionError` hook receives the error and the user is redirected to `failurePath` instead of getting a 500 while signed in.

## 0.1.1

### Patch Changes

- [#32](https://github.com/kaycabral/toolkit/pull/32) [`8e03526`](https://github.com/kaycabral/toolkit/commit/8e035260203930872be672d9c04a5eca07d3b5c0) Thanks [@kaycabral](https://github.com/kaycabral)! - Import `next/server.js` and `next/headers.js` with their file extension. `next` ships no `exports` map, so plain Node ESM (for example Vitest running the app's tests) could not resolve the bare `next/server` / `next/headers` specifiers inside these packages, and consumers had to inline `@cbrl/*` through `server.deps.inline`. That workaround is no longer needed.

## 0.1.0

### Minor Changes

- [#17](https://github.com/kaycabral/toolkit/pull/17) [`3ca1ffe`](https://github.com/kaycabral/toolkit/commit/3ca1ffed5372e7e86e68f4ae57ab5c75afcc3f34) Thanks [@kaycabral](https://github.com/kaycabral)! - New package: Supabase Auth wiring for Next.js 16 apps. The root entry reads the public config (`supabasePublicConfig`, `isSupabaseConfigured`) and normalises users (`sessionUserFromAuthUser`, `sessionUserFromClaims`); `/client` and `/server` create the browser and cookie-bound server clients; `/proxy` exports `updateSession` for `proxy.ts`, following the `@supabase/ssr` cookie contract with a bounded, outage-tolerant refresh; `/routes` builds the OAuth (PKCE) callback and the E2E password sign-in Route Handlers (404 unless `ENABLE_TEST_AUTH=true`, always 404 on Vercel production); `/react` exports the `useGoogleSignIn` hook; `/local` reads the local stack from `supabase status`, swaps database roles and upserts `.env.local`.
