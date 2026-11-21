import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabasePublicConfig } from './config'

/**
 * Browser Supabase client (Auth, Storage, …). `createBrowserClient` keeps a
 * singleton, so calling this per render is cheap. `null` when Supabase is not
 * configured.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  const config = supabasePublicConfig()
  return config ? createBrowserClient(config.url, config.key) : null
}
