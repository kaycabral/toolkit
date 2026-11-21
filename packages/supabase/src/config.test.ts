import { afterEach, describe, expect, it, vi } from 'vitest'
import { isSupabaseConfigured, supabasePublicConfig } from './config'

describe('supabasePublicConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns the URL and publishable key when both are set', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://abc.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_x')

    expect(supabasePublicConfig()).toEqual({
      url: 'https://abc.supabase.co',
      key: 'sb_publishable_x',
    })
    expect(isSupabaseConfigured()).toBe(true)
  })

  it.each([
    ['', 'sb_publishable_x'],
    ['https://abc.supabase.co', ''],
  ])('returns null when a variable is empty (url=%j, key=%j)', (url, key) => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', url)
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', key)

    expect(supabasePublicConfig()).toBeNull()
    expect(isSupabaseConfigured()).toBe(false)
  })
})
