---
'@cbrl/supabase': minor
---

New package: Supabase Auth wiring for Next.js 16 apps. The root entry reads the public config (`supabasePublicConfig`, `isSupabaseConfigured`) and normalises users (`sessionUserFromAuthUser`, `sessionUserFromClaims`); `/client` and `/server` create the browser and cookie-bound server clients; `/proxy` exports `updateSession` for `proxy.ts`, following the `@supabase/ssr` cookie contract with a bounded, outage-tolerant refresh; `/routes` builds the OAuth (PKCE) callback and the E2E password sign-in Route Handlers (404 unless `ENABLE_TEST_AUTH=true`, always 404 on Vercel production); `/react` exports the `useGoogleSignIn` hook; `/local` reads the local stack from `supabase status`, swaps database roles and upserts `.env.local`.
