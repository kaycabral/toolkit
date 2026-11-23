import { ResponseCookies } from 'next/dist/server/web/spec-extension/cookies.js'
import { NextRequest } from 'next/server.js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { authCallbackRoute } from './routes'

// Real @supabase/ssr + supabase-js against a stubbed Auth API, with the cookie
// store Next.js hands Route Handlers (request cookies seeded into
// ResponseCookies): proves the session cookie the exchange writes is cleared
// when onSession throws.

const AUTH_COOKIE = 'sb-abc-auth-token'

const store = vi.hoisted(() => ({ jar: undefined as ResponseCookies | undefined }))
vi.mock('next/headers.js', () => ({ cookies: () => Promise.resolve(store.jar) }))

function authApi(input: RequestInfo | URL): Promise<Response> {
  const url = new URL(input instanceof Request ? input.url : input)
  if (url.pathname !== '/auth/v1/token') return Promise.resolve(new Response(null, { status: 204 }))
  return Promise.resolve(
    Response.json({
      access_token: 'access',
      refresh_token: 'refresh',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: {
        id: 'u1',
        aud: 'authenticated',
        created_at: '2026-01-01T00:00:00Z',
        app_metadata: {},
        user_metadata: {},
      },
    }),
  )
}

function setCookieHeaders(): string[] {
  const headers = new Headers()
  for (const cookie of store.jar?.getAll() ?? []) new ResponseCookies(headers).set(cookie)
  return headers.getSetCookie().filter((line) => line.startsWith(`${AUTH_COOKIE}=`))
}

describe('authCallbackRoute session cookie', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://abc.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_x')
    vi.stubGlobal('fetch', vi.fn(authApi))
    store.jar = new ResponseCookies(new Headers())
    store.jar.set(`${AUTH_COOKIE}-code-verifier`, JSON.stringify('verifier'))
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('keeps the session cookie when onSession succeeds', async () => {
    const GET = authCallbackRoute({ defaultNext: '/dashboard', failurePath: '/login?error=auth' })

    const response = await GET(new NextRequest('http://localhost:3000/auth/callback?code=abc'))

    expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard')
    expect(store.jar?.get(AUTH_COOKIE)?.value).toMatch(/^base64-/)
  })

  it('clears the session cookie when onSession throws', async () => {
    const onSessionError = vi.fn()
    const GET = authCallbackRoute({
      defaultNext: '/dashboard',
      failurePath: '/login?error=auth',
      onSession: () => {
        throw new Error('upsert failed')
      },
      onSessionError,
    })

    const response = await GET(new NextRequest('http://localhost:3000/auth/callback?code=abc'))

    expect(response.headers.get('location')).toBe('http://localhost:3000/login?error=auth')
    expect(store.jar?.get(AUTH_COOKIE)?.value).toBe('')
    expect(setCookieHeaders()).toEqual([expect.stringMatching(/^sb-abc-auth-token=; .*Max-Age=0/)])
    expect(onSessionError).toHaveBeenCalledWith(new Error('upsert failed'))
  })
})
