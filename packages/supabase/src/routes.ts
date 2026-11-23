import type { AuthError, SupabaseClient, User } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server.js'
import { safeNextPath } from './safe-next'
import { createSupabaseServerClient } from './server'

/** A Next.js Route Handler. */
export type RouteHandler = (request: NextRequest) => Promise<NextResponse>

/** Options for {@link authCallbackRoute}. */
export type AuthCallbackRouteOptions = {
  /** Where to land when `next` is missing or not a same-origin path. */
  defaultNext: string
  /** Where to land when there is no code, Supabase is not configured or the exchange fails. */
  failurePath: string
  /**
   * Runs after a successful exchange, before redirecting (e.g. upsert the app's
   * user row). A throw fails closed: the fresh session is signed out (cookies
   * cleared), `onSessionError` gets the error and the user lands on `failurePath`.
   */
  onSession?: (user: User, supabase: SupabaseClient) => Promise<void> | void
  /** Called when the code exchange fails. */
  onError?: (error: AuthError) => void
  /** Called with whatever `onSession` threw, after the session is signed out. */
  onSessionError?: (error: unknown) => void
}

/**
 * Drops the session this request just wrote. `local` clears this device's
 * cookies before any network call; a failure here must not mask the original
 * error, so it is swallowed.
 */
async function signOutLocally(supabase: SupabaseClient): Promise<void> {
  try {
    await supabase.auth.signOut({ scope: 'local' })
  } catch {
    return
  }
}

/**
 * `GET` handler for the OAuth (PKCE) return leg, mounted at
 * `app/auth/callback/route.ts`: exchanges `?code` for a session cookie and
 * redirects to `?next` (same-origin only) or `defaultNext`. Fails closed:
 * no session survives a redirect to `failurePath`.
 */
export function authCallbackRoute(options: AuthCallbackRouteOptions): RouteHandler {
  const { defaultNext, failurePath, onSession, onError, onSessionError } = options
  return async function GET(request) {
    const { searchParams, origin } = request.nextUrl
    const code = searchParams.get('code')
    const next = safeNextPath(searchParams.get('next'), defaultNext)

    const supabase = code ? await createSupabaseServerClient() : null
    if (supabase && code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        try {
          await onSession?.(data.user, supabase)
          return NextResponse.redirect(new URL(next, origin))
        } catch (sessionError) {
          await signOutLocally(supabase)
          onSessionError?.(sessionError)
        }
      } else {
        onError?.(error)
      }
    }
    return NextResponse.redirect(new URL(failurePath, origin))
  }
}

/** Options for {@link testSignInRoute}. */
export type TestSignInRouteOptions = {
  /**
   * Runs after a successful sign-in (e.g. upsert the app's user row). Fields it
   * returns are merged into the JSON response next to `userId`.
   */
  onSignIn?: (
    user: User,
    supabase: SupabaseClient,
  ) => Promise<Record<string, unknown> | undefined> | Record<string, unknown> | undefined
}

type Credentials = { email: string; password: string }

function credentials(body: unknown): Credentials | null {
  if (typeof body !== 'object' || body === null) return null
  if (!('email' in body) || !('password' in body)) return null
  const { email, password } = body
  return typeof email === 'string' && typeof password === 'string' ? { email, password } : null
}

function testAuthEnabled(): boolean {
  return process.env.ENABLE_TEST_AUTH === 'true' && process.env.VERCEL_ENV !== 'production'
}

/**
 * `POST` handler for E2E sign-in with email + password against a local
 * Supabase stack; the server client writes the real session cookies, which a
 * Playwright fixture can save as `storageState`.
 *
 * Responds 404 unless `ENABLE_TEST_AUTH=true`, and always 404 when
 * `VERCEL_ENV=production`. Body: `{ email, password }` (400 otherwise).
 * Responds 503 when Supabase is not configured, 401 on bad credentials and
 * `{ userId, ...extra }` on success.
 */
export function testSignInRoute(options: TestSignInRouteOptions = {}): RouteHandler {
  const { onSignIn } = options
  return async function POST(request) {
    if (!testAuthEnabled()) return new NextResponse(null, { status: 404 })

    const body = credentials(await request.json().catch(() => null))
    if (!body) {
      return NextResponse.json({ error: 'email and password are required' }, { status: 400 })
    }
    const supabase = await createSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: 'supabase not configured' }, { status: 503 })

    const { data, error } = await supabase.auth.signInWithPassword(body)
    if (error) return NextResponse.json({ error: error.message }, { status: 401 })
    const extra = await onSignIn?.(data.user, supabase)
    return NextResponse.json({ ...extra, userId: data.user.id })
  }
}
