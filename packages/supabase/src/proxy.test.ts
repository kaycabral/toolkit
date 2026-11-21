import type { CookieMethodsServer } from '@supabase/ssr'
import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SESSION_REFRESH_TIMEOUT_MS, updateSession } from './proxy'

type ServerClientOptions = { cookies: CookieMethodsServer }

const getClaims = vi.hoisted(() => vi.fn<(cookies: CookieMethodsServer) => Promise<unknown>>())
const ssr = vi.hoisted(() => ({
  createServerClient: vi.fn((_url: string, _key: string, options: ServerClientOptions) => ({
    auth: { getClaims: () => getClaims(options.cookies) },
  })),
}))
vi.mock('@supabase/ssr', () => ssr)

const REFRESHED = [
  { name: 'sb-access', value: 'new', options: { path: '/', httpOnly: true } },
  { name: 'sb-refresh', value: 'r2', options: { path: '/' } },
]

async function refresh(cookies: CookieMethodsServer): Promise<unknown> {
  expect(await cookies.getAll()).toEqual([{ name: 'sb-access', value: 'old' }])
  await cookies.setAll?.(REFRESHED, { 'Cache-Control': 'private, no-store' })
  return { data: { claims: { sub: 'u1' } }, error: null }
}

function request(): NextRequest {
  return new NextRequest('http://localhost:3000/painel?x=1', {
    headers: { cookie: 'sb-access=old' },
  })
}

describe('updateSession', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://abc.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_x')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('passes the request through untouched when Supabase is not configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')

    const response = await updateSession(request())

    expect(response.headers.get('x-middleware-next')).toBe('1')
    expect(ssr.createServerClient).not.toHaveBeenCalled()
  })

  it('writes refreshed cookies to the request and the response', async () => {
    getClaims.mockImplementation(refresh)
    const incoming = request()

    const response = await updateSession(incoming)

    expect(incoming.cookies.get('sb-access')?.value).toBe('new')
    expect(response.cookies.get('sb-access')).toMatchObject({ value: 'new', httpOnly: true })
    expect(response.cookies.get('sb-refresh')?.value).toBe('r2')
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(response.headers.get('x-middleware-override-headers')).toContain('cookie')
    expect(response.headers.get('x-middleware-request-cookie')).toContain('sb-access=new')
  })

  it('forwards custom request headers carrying the refreshed cookies', async () => {
    getClaims.mockImplementation(refresh)
    const incoming = request()
    const requestHeaders = new Headers(incoming.headers)
    requestHeaders.set('x-pathname', '/painel?x=1')

    const response = await updateSession(incoming, { requestHeaders })

    expect(requestHeaders.get('cookie')).toContain('sb-access=new')
    expect(response.headers.get('x-middleware-request-x-pathname')).toBe('/painel?x=1')
    expect(response.headers.get('x-middleware-request-cookie')).toContain('sb-access=new')
    expect(response.cookies.get('sb-access')?.value).toBe('new')
  })

  it('forwards custom request headers when the request has no cookies', async () => {
    getClaims.mockResolvedValue({ data: null, error: null })
    const requestHeaders = new Headers({ 'x-pathname': '/' })

    const response = await updateSession(new NextRequest('http://localhost:3000/'), {
      requestHeaders,
    })

    expect(requestHeaders.has('cookie')).toBe(false)
    expect(response.headers.get('x-middleware-request-x-pathname')).toBe('/')
  })

  it('reports a failed refresh and still lets the request through', async () => {
    const failure = new Error('fetch failed')
    getClaims.mockRejectedValue(failure)
    const onError = vi.fn()

    const response = await updateSession(request(), { onError })

    expect(onError).toHaveBeenCalledWith(failure)
    expect(response.headers.get('x-middleware-next')).toBe('1')
  })

  it('swallows a failed refresh without an onError hook', async () => {
    getClaims.mockRejectedValue(new Error('fetch failed'))

    await expect(updateSession(request())).resolves.toBeDefined()
  })

  it('gives up on a hanging refresh after the timeout', async () => {
    vi.useFakeTimers()
    getClaims.mockReturnValue(new Promise(() => {}))
    const onError = vi.fn()

    const pending = updateSession(request(), { onError })
    await vi.advanceTimersByTimeAsync(SESSION_REFRESH_TIMEOUT_MS)
    const response = await pending

    expect(onError).toHaveBeenCalledWith(
      new Error(`session refresh timed out after ${SESSION_REFRESH_TIMEOUT_MS}ms`),
    )
    expect(response.headers.get('x-middleware-next')).toBe('1')
  })

  it('honours a custom timeout', async () => {
    vi.useFakeTimers()
    getClaims.mockReturnValue(new Promise(() => {}))
    const onError = vi.fn()

    const pending = updateSession(request(), { onError, timeoutMs: 50 })
    await vi.advanceTimersByTimeAsync(50)
    await pending

    expect(onError).toHaveBeenCalledWith(new Error('session refresh timed out after 50ms'))
  })
})
