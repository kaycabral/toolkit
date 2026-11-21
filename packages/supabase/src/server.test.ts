import type { CookieMethodsServer, CookieOptions } from '@supabase/ssr'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseServerClient } from './server'

type ServerClientOptions = { cookies: CookieMethodsServer }

const ssr = vi.hoisted(() => ({
  createServerClient: vi.fn((url: string, key: string, options: ServerClientOptions) => ({
    url,
    key,
    options,
  })),
}))
vi.mock('@supabase/ssr', () => ssr)

const cookieStore = vi.hoisted(() => ({
  getAll: vi.fn(() => [{ name: 'sb-access', value: 'a' }]),
  set: vi.fn<(name: string, value: string, options?: CookieOptions) => void>(),
}))
vi.mock('next/headers.js', () => ({ cookies: () => Promise.resolve(cookieStore) }))

async function cookieMethods(): Promise<CookieMethodsServer> {
  await createSupabaseServerClient()
  const options = ssr.createServerClient.mock.calls[0]?.[2]
  if (!options) throw new Error('createServerClient was not called')
  return options.cookies
}

describe('createSupabaseServerClient', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://abc.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_x')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('returns null when Supabase is not configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')

    await expect(createSupabaseServerClient()).resolves.toBeNull()
    expect(ssr.createServerClient).not.toHaveBeenCalled()
  })

  it('binds the client to the request cookie store', async () => {
    const client = await createSupabaseServerClient()

    expect(client).toMatchObject({ url: 'https://abc.supabase.co', key: 'sb_publishable_x' })
    const methods = await cookieMethods()
    expect(await methods.getAll()).toEqual([{ name: 'sb-access', value: 'a' }])
  })

  it('writes refreshed cookies to the store', async () => {
    const methods = await cookieMethods()

    await methods.setAll?.([{ name: 'sb-access', value: 'b', options: { path: '/' } }], {})

    expect(cookieStore.set).toHaveBeenCalledWith('sb-access', 'b', { path: '/' })
  })

  it('ignores cookie writes from a Server Component', async () => {
    cookieStore.set.mockImplementation(() => {
      throw new Error('Cookies can only be modified in a Server Action or Route Handler')
    })
    const methods = await cookieMethods()

    await expect(
      Promise.resolve(methods.setAll?.([{ name: 'sb-access', value: 'b', options: {} }], {})),
    ).resolves.toBeUndefined()
  })
})
