import { afterEach, describe, expect, it, vi } from 'vitest'
import { getSupabaseBrowserClient } from './client'

const createBrowserClient = vi.hoisted(() => vi.fn((url: string, key: string) => ({ url, key })))
vi.mock('@supabase/ssr', () => ({ createBrowserClient }))

describe('getSupabaseBrowserClient', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    createBrowserClient.mockClear()
  })

  it('creates the browser client from the public config', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://abc.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_x')

    expect(getSupabaseBrowserClient()).toEqual({
      url: 'https://abc.supabase.co',
      key: 'sb_publishable_x',
    })
    expect(createBrowserClient).toHaveBeenCalledWith('https://abc.supabase.co', 'sb_publishable_x')
  })

  it('returns null when Supabase is not configured', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')

    expect(getSupabaseBrowserClient()).toBeNull()
    expect(createBrowserClient).not.toHaveBeenCalled()
  })
})
