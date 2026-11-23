# @cbrl/supabase

Supabase Auth wiring for Next.js 16 (App Router, `proxy.ts`), so each app keeps
only its specifics (redirect paths, user upsert, logging):

- Public config read as literal `process.env.NEXT_PUBLIC_*`, so Next.js inlines it.
- Browser and cookie-bound server clients that return `null` when Supabase is
  not configured, letting the app render a signed-out UI instead of crashing.
- Session refresh for `proxy.ts` per the `@supabase/ssr` cookie contract, bounded
  by a timeout so an outage never blocks a request.
- Route Handler factories for the OAuth (PKCE) callback and an E2E-only password
  sign-in, both with same-origin `next` sanitisation.
- A Google sign-in hook and helpers that read the local stack for scripts and
  Playwright.

```sh
pnpm add @cbrl/supabase @supabase/ssr @supabase/supabase-js
```

Peers: `next` ^16, `react` ^19, `@supabase/ssr` ^0.12, `@supabase/supabase-js` ^2.119.

| Entry                   | Runs in                            | Exports                                                                                                                 |
| ----------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `@cbrl/supabase`        | anywhere                           | `supabasePublicConfig()`, `isSupabaseConfigured()`, `sessionUserFromAuthUser(user)`, `sessionUserFromClaims(claims)`    |
| `@cbrl/supabase/client` | browser                            | `getSupabaseBrowserClient()`                                                                                            |
| `@cbrl/supabase/server` | server (`server-only`)             | `createSupabaseServerClient()`                                                                                          |
| `@cbrl/supabase/proxy`  | `proxy.ts`                         | `updateSession(request, options?)`, `SESSION_REFRESH_TIMEOUT_MS`                                                        |
| `@cbrl/supabase/routes` | Route Handlers (`server-only`)     | `authCallbackRoute(options)`, `testSignInRoute(options?)`                                                               |
| `@cbrl/supabase/react`  | Client Components (`'use client'`) | `useGoogleSignIn(options)`                                                                                              |
| `@cbrl/supabase/local`  | Node scripts, Playwright config    | `findSupabaseAppDir(cwd?, options?)`, `readLocalSupabase(options?)`, `withRole(dbUrl, user, password)`, `writeEnvLocal` |

Environment: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Root: config and session user

```ts
import { isSupabaseConfigured, sessionUserFromClaims, type SessionUser } from '@cbrl/supabase'
```

`SessionUser` is `{ id, email, name, avatarUrl, emailVerified, appMetadata }`:
`name` is `full_name` or `name`, `avatarUrl` is `avatar_url` or `picture` from the
identity metadata, `emailVerified` is `true` only when the provider reported
`email_verified: true`. Map it further in the app when needed:

```ts
// app: lib/auth/session.ts
import 'server-only'
import { sessionUserFromClaims } from '@cbrl/supabase'
import { createSupabaseServerClient } from '@cbrl/supabase/server'
import { isAuthSessionMissingError } from '@supabase/supabase-js'
import { cache } from 'react'

export const getSessionUser = cache(async () => {
  const supabase = await createSupabaseServerClient()
  if (!supabase) return null
  const { data, error } = await supabase.auth.getClaims()
  if (error && !isAuthSessionMissingError(error)) throw error
  if (!data?.claims) return null
  const user = sessionUserFromClaims(data.claims)
  const legacyUid = user.appMetadata.legacy_uid
  return { ...user, uid: typeof legacyUid === 'string' ? legacyUid : user.id }
})
```

## `/client` and `/server`

```ts
'use client'
import { getSupabaseBrowserClient } from '@cbrl/supabase/client'

const supabase = getSupabaseBrowserClient() // singleton; null when unconfigured
```

```ts
import { createSupabaseServerClient } from '@cbrl/supabase/server'

const supabase = await createSupabaseServerClient() // one per request; null when unconfigured
```

Cookie writes from Server Components are dropped (Next.js forbids them); the
proxy refresh already wrote the fresh token on the way in.

## `/proxy`

```ts
// src/proxy.ts
import { updateSession } from '@cbrl/supabase/proxy'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname + request.nextUrl.search)
  return updateSession(request, {
    requestHeaders,
    onError: (error) => console.warn('session refresh failed', error),
  })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)',
  ],
}
```

| Option           | Default  | Effect                                                                                  |
| ---------------- | -------- | --------------------------------------------------------------------------------------- |
| `requestHeaders` | incoming | Headers forwarded to the app; refreshed `cookie` is written into them before forwarding |
| `onError`        | none     | Called when `getClaims()` throws or times out; the request still goes through           |
| `timeoutMs`      | `4000`   | Upper bound for the refresh                                                             |

## `/routes`

```ts
// src/app/auth/callback/route.ts
import { sessionUserFromAuthUser } from '@cbrl/supabase'
import { authCallbackRoute } from '@cbrl/supabase/routes'
import { upsertUser } from '@/lib/auth/upsert-user'

export const GET = authCallbackRoute({
  defaultNext: '/dashboard',
  failurePath: '/login?error=auth',
  onSession: (user) => upsertUser(sessionUserFromAuthUser(user)),
  onError: (error) => console.warn('code exchange failed', error.code ?? error.name),
  onSessionError: (error) =>
    console.error('user upsert failed', error instanceof Error ? error.name : 'unknown'),
})
```

`next` is honoured only when it resolves to a same-origin path; otherwise the
user lands on `defaultNext`. A missing code, missing config or failed exchange
redirects to `failurePath`. The callback fails closed: when `onSession` throws, the
fresh session is signed out with `scope: 'local'` (clearing the session cookies
on the redirect), `onSessionError` receives the error and the user lands on
`failurePath`. A sign-out failure is swallowed, and the error never reaches the
client. Keep PII out of what the hooks log.

```ts
// src/app/api/e2e-signin/route.ts
import { testSignInRoute } from '@cbrl/supabase/routes'

export const POST = testSignInRoute()
```

The test sign-in responds 404 unless `ENABLE_TEST_AUTH=true`, and always 404 when
`VERCEL_ENV=production`. It takes `{ email, password }` (400 otherwise), returns
503 without config, 401 on bad credentials and `{ userId, ...extra }` on success,
where `extra` is what the optional `onSignIn(user, supabase)` returns. Enable
password sign-in only in the local `supabase/config.toml`.

## `/react`

```tsx
'use client'
import { Button } from '@cbrl/design'
import { useGoogleSignIn } from '@cbrl/supabase/react'
import { toast } from 'sonner'

export function GoogleButton({ next }: { next: string }) {
  const { signIn, pending } = useGoogleSignIn({
    next,
    onError: () => toast.error('Could not sign in. Try again.'),
  })
  return (
    <Button onClick={() => void signIn()} disabled={pending}>
      Continue with Google
    </Button>
  )
}
```

Redirects to Google (`prompt=select_account`) and back through
`/auth/callback?next=…` (`callbackPath` overrides it). Repeated clicks while
pending are ignored; `pending` stays `true` on success because the page navigates
away. An off-site `next` becomes `/`.

## `/local`

For Node scripts and Playwright only (uses `node:child_process` and `node:fs`).
`readLocalSupabase()` runs `pnpm exec supabase status -o json` in the directory
holding `supabase/config.toml`, found by walking up from `cwd` (and probing
`apps/web` at each level, configurable with `subdirs`).

```ts
// scripts/local-env.ts
import {
  findSupabaseAppDir,
  readLocalSupabase,
  withRole,
  writeEnvLocal,
} from '@cbrl/supabase/local'

const local = readLocalSupabase()
const target = writeEnvLocal(
  {
    NEXT_PUBLIC_SUPABASE_URL: local.apiUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: local.publishableKey,
    SUPABASE_SECRET_KEY: local.secretKey,
    DATABASE_URL: withRole(local.dbUrl, 'app_runtime', 'local_only_password'),
  },
  { appDir: findSupabaseAppDir() },
)
console.log(`Local Supabase values written to ${target}`)
```

`writeEnvLocal` creates `.env.local` from `.env.example` when missing (or starts
empty), replaces every line for the given keys, appends the rest and sets mode
`0o600`.

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test'
import { readLocalSupabase } from '@cbrl/supabase/local'

const local = readLocalSupabase()
const supabaseEnv = {
  NEXT_PUBLIC_SUPABASE_URL: local.apiUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: local.publishableKey,
  SUPABASE_SECRET_KEY: local.secretKey,
  DATABASE_URL: local.dbUrl,
}
Object.assign(process.env, supabaseEnv)

export default defineConfig({
  webServer: {
    command: 'pnpm run build && pnpm run start -p 3000',
    url: 'http://localhost:3000',
    env: { ...supabaseEnv, ENABLE_TEST_AUTH: 'true' },
  },
})
```
