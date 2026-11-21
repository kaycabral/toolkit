/** @vitest-environment jsdom */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useGoogleSignIn, type UseGoogleSignInOptions } from './react'

type OAuthCall = {
  provider: 'google'
  options: { redirectTo: string; queryParams: Record<string, string> }
}
type OAuthResult = { error: Error | null }

const signInWithOAuth = vi.hoisted(() => vi.fn<(call: OAuthCall) => Promise<OAuthResult>>())
const browser = vi.hoisted(() => ({ configured: true }))
vi.mock('./client', () => ({
  getSupabaseBrowserClient: () => (browser.configured ? { auth: { signInWithOAuth } } : null),
}))

function render(options: UseGoogleSignInOptions) {
  return renderHook(() => useGoogleSignIn(options))
}

function redirectTo(): URL {
  const call = signInWithOAuth.mock.calls[0]?.[0]
  if (!call) throw new Error('signInWithOAuth was not called')
  return new URL(call.options.redirectTo)
}

describe('useGoogleSignIn', () => {
  beforeEach(() => {
    signInWithOAuth.mockResolvedValue({ error: null })
  })

  afterEach(() => {
    vi.clearAllMocks()
    browser.configured = true
  })

  it('redirects to Google through the callback with the next path', async () => {
    const { result } = render({ next: '/dashboard?tab=a' })

    await act(() => result.current.signIn())

    const call = signInWithOAuth.mock.calls[0]?.[0]
    expect(call?.provider).toBe('google')
    expect(call?.options.queryParams).toEqual({ prompt: 'select_account' })
    const url = redirectTo()
    expect(url.origin).toBe(window.location.origin)
    expect(url.pathname).toBe('/auth/callback')
    expect(url.searchParams.get('next')).toBe('/dashboard?tab=a')
  })

  it('uses a custom callback path', async () => {
    const { result } = render({ next: '/', callbackPath: '/oauth/return' })

    await act(() => result.current.signIn())

    expect(redirectTo().pathname).toBe('/oauth/return')
  })

  it('replaces an off-site next with /', async () => {
    const { result } = render({ next: '//evil.example.com' })

    await act(() => result.current.signIn())

    expect(redirectTo().searchParams.get('next')).toBe('/')
  })

  it('stays pending after a successful start and ignores repeated calls', async () => {
    const { result } = render({ next: '/' })

    await act(() => result.current.signIn())
    await act(() => result.current.signIn())

    expect(result.current.pending).toBe(true)
    expect(signInWithOAuth).toHaveBeenCalledTimes(1)
  })

  it('reports an unconfigured client without starting', async () => {
    browser.configured = false
    const onError = vi.fn()
    const { result } = render({ next: '/', onError })

    await act(() => result.current.signIn())

    expect(onError).toHaveBeenCalledWith(new Error('Supabase is not configured'))
    expect(result.current.pending).toBe(false)
  })

  it('tolerates an unconfigured client without an onError hook', async () => {
    browser.configured = false
    const { result } = render({ next: '/' })

    await act(() => result.current.signIn())

    expect(result.current.pending).toBe(false)
  })

  it('reports an OAuth error, resets pending and allows a retry', async () => {
    const failure = new Error('provider disabled')
    signInWithOAuth.mockResolvedValueOnce({ error: failure })
    const onError = vi.fn()
    const { result } = render({ next: '/', onError })

    await act(() => result.current.signIn())

    expect(onError).toHaveBeenCalledWith(failure)
    expect(result.current.pending).toBe(false)

    await act(() => result.current.signIn())
    expect(signInWithOAuth).toHaveBeenCalledTimes(2)
  })

  it('resets pending on an OAuth error without an onError hook', async () => {
    signInWithOAuth.mockResolvedValueOnce({ error: new Error('provider disabled') })
    const { result } = render({ next: '/' })

    await act(() => result.current.signIn())

    expect(result.current.pending).toBe(false)
  })
})
