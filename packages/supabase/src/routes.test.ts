import type { User } from '@supabase/supabase-js'
import { NextRequest } from 'next/server.js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { authCallbackRoute, testSignInRoute } from './routes'

type AuthResult = {
  data: { user: User }
  error: { message: string; code?: string } | null
}

const auth = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn<(code: string) => Promise<AuthResult>>(),
  signInWithPassword: vi.fn<(body: { email: string; password: string }) => Promise<AuthResult>>(),
  signOut: vi.fn<(options: { scope: 'local' }) => Promise<{ error: null }>>(),
}))
const server = vi.hoisted(() => ({ configured: true }))
const client = { auth }
vi.mock('./server', () => ({
  createSupabaseServerClient: () => Promise.resolve(server.configured ? client : null),
}))

const user: User = {
  id: 'u1',
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: {},
}

function ok(): AuthResult {
  return { data: { user }, error: null }
}

function failed(message: string): AuthResult {
  return { data: { user }, error: { message } }
}

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
  server.configured = true
})

describe('authCallbackRoute', () => {
  const GET = authCallbackRoute({ defaultNext: '/dashboard', failurePath: '/login?error=auth' })

  function callback(query: string): Promise<Response> {
    return GET(new NextRequest(`http://localhost:3000/auth/callback${query}`))
  }

  it('exchanges the code and lands on the safe next path', async () => {
    auth.exchangeCodeForSession.mockResolvedValue(ok())

    const response = await callback(`?code=abc&next=${encodeURIComponent('/listings?deal=sale')}`)

    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith('abc')
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/listings?deal=sale')
  })

  it.each(['', '&next=//evil.example.com', `&next=${encodeURIComponent('/\t/evil.example.com')}`])(
    'lands on defaultNext when next is missing or off-site (%j)',
    async (next) => {
      auth.exchangeCodeForSession.mockResolvedValue(ok())

      const response = await callback(`?code=abc${next}`)

      expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard')
    },
  )

  it('runs onSession with the user and client before redirecting', async () => {
    auth.exchangeCodeForSession.mockResolvedValue(ok())
    const onSession = vi.fn()
    const handler = authCallbackRoute({ defaultNext: '/', failurePath: '/login', onSession })

    await handler(new NextRequest('http://localhost:3000/auth/callback?code=abc'))

    expect(onSession).toHaveBeenCalledWith(user, client)
  })

  describe('when onSession throws', () => {
    const upsertFailure = new Error('upsert failed')

    function failingCallback(hooks: { onSessionError?: (error: unknown) => void } = {}) {
      const handler = authCallbackRoute({
        defaultNext: '/dashboard',
        failurePath: '/login?error=auth',
        onSession: () => Promise.reject(upsertFailure),
        ...hooks,
      })
      return handler(new NextRequest('http://localhost:3000/auth/callback?code=abc&next=/x'))
    }

    beforeEach(() => {
      auth.exchangeCodeForSession.mockResolvedValue(ok())
    })

    it('signs the fresh session out locally, reports the error and lands on failurePath', async () => {
      auth.signOut.mockResolvedValue({ error: null })
      const onSessionError = vi.fn()

      const response = await failingCallback({ onSessionError })

      expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' })
      expect(onSessionError).toHaveBeenCalledWith(upsertFailure)
      expect(auth.signOut.mock.invocationCallOrder[0]).toBeLessThan(
        onSessionError.mock.invocationCallOrder[0] ?? 0,
      )
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('http://localhost:3000/login?error=auth')
    })

    it('still lands on failurePath when signing out throws too', async () => {
      auth.signOut.mockRejectedValue(new Error('network down'))
      const onSessionError = vi.fn()

      const response = await failingCallback({ onSessionError })

      expect(onSessionError).toHaveBeenCalledWith(upsertFailure)
      expect(response.headers.get('location')).toBe('http://localhost:3000/login?error=auth')
    })

    it('does not leak the error to the client without an onSessionError hook', async () => {
      auth.signOut.mockResolvedValue({ error: null })

      const response = await failingCallback()

      expect(response.headers.get('location')).toBe('http://localhost:3000/login?error=auth')
      await expect(response.text()).resolves.not.toContain('upsert failed')
    })
  })

  it('redirects to failurePath and reports the error when the exchange fails', async () => {
    const result = failed('invalid grant')
    auth.exchangeCodeForSession.mockResolvedValue(result)
    const onError = vi.fn()
    const onSession = vi.fn()
    const handler = authCallbackRoute({
      defaultNext: '/',
      failurePath: '/login?error=auth',
      onSession,
      onError,
    })

    const response = await handler(new NextRequest('http://localhost:3000/auth/callback?code=x'))

    expect(response.headers.get('location')).toBe('http://localhost:3000/login?error=auth')
    expect(onError).toHaveBeenCalledWith(result.error)
    expect(onSession).not.toHaveBeenCalled()
  })

  it('redirects to failurePath when the exchange fails without an onError hook', async () => {
    auth.exchangeCodeForSession.mockResolvedValue(failed('invalid grant'))

    const response = await callback('?code=abc')

    expect(response.headers.get('location')).toBe('http://localhost:3000/login?error=auth')
  })

  it('redirects to failurePath when there is no code', async () => {
    const response = await callback('?error=access_denied')

    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled()
    expect(response.headers.get('location')).toBe('http://localhost:3000/login?error=auth')
  })

  it('redirects to failurePath when Supabase is not configured', async () => {
    server.configured = false

    const response = await callback('?code=abc')

    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled()
    expect(response.headers.get('location')).toBe('http://localhost:3000/login?error=auth')
  })
})

describe('testSignInRoute', () => {
  const POST = testSignInRoute()

  function signIn(body: string, handler = POST): Promise<Response> {
    return handler(
      new NextRequest('http://localhost:3000/api/e2e-signin', {
        method: 'POST',
        body,
        headers: { 'content-type': 'application/json' },
      }),
    )
  }

  const credentials = JSON.stringify({ email: 'e2e@example.com', password: 'secret' })

  beforeEach(() => {
    vi.stubEnv('ENABLE_TEST_AUTH', 'true')
    vi.stubEnv('VERCEL_ENV', '')
  })

  it.each([
    ['unset', '', ''],
    ['not exactly "true"', '1', ''],
    ['enabled on Vercel production', 'true', 'production'],
  ])('responds 404 when test auth is %s', async (_label, enabled, vercelEnv) => {
    vi.stubEnv('ENABLE_TEST_AUTH', enabled)
    vi.stubEnv('VERCEL_ENV', vercelEnv)

    const response = await signIn(credentials)

    expect(response.status).toBe(404)
    expect(auth.signInWithPassword).not.toHaveBeenCalled()
  })

  it('allows preview deployments that opt in', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    auth.signInWithPassword.mockResolvedValue(ok())

    expect((await signIn(credentials)).status).toBe(200)
  })

  it.each(['not json', 'null', '{"email":"e2e@example.com"}', '{"email":1,"password":"x"}'])(
    'responds 400 for an invalid body (%j)',
    async (body) => {
      const response = await signIn(body)

      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toEqual({
        error: 'email and password are required',
      })
    },
  )

  it('responds 503 when Supabase is not configured', async () => {
    server.configured = false

    const response = await signIn(credentials)

    expect(response.status).toBe(503)
  })

  it('responds 401 with the auth error on bad credentials', async () => {
    auth.signInWithPassword.mockResolvedValue(failed('Invalid login credentials'))

    const response = await signIn(credentials)

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Invalid login credentials' })
  })

  it('signs in and returns the user id', async () => {
    auth.signInWithPassword.mockResolvedValue(ok())

    const response = await signIn(credentials)

    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'e2e@example.com',
      password: 'secret',
    })
    await expect(response.json()).resolves.toEqual({ userId: 'u1' })
  })

  it('merges the fields onSignIn returns, keeping userId authoritative', async () => {
    auth.signInWithPassword.mockResolvedValue(ok())
    const onSignIn = vi.fn(() => Promise.resolve({ uid: 'legacy-1', userId: 'spoofed' }))

    const response = await signIn(credentials, testSignInRoute({ onSignIn }))

    expect(onSignIn).toHaveBeenCalledWith(user, client)
    await expect(response.json()).resolves.toEqual({ uid: 'legacy-1', userId: 'u1' })
  })
})
