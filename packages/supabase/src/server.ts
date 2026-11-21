import 'server-only'

import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers.js'
import { supabasePublicConfig } from './config'

/**
 * Server Supabase client bound to the request cookies, for Server Components,
 * Server Actions and Route Handlers. Create one per request. `null` when
 * Supabase is not configured.
 *
 * Cookie writes from a Server Component are dropped (Next.js forbids them
 * there); the proxy's {@link https://supabase.com/docs/guides/auth/server-side/nextjs | session refresh}
 * already wrote the fresh token on the way in.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient | null> {
  const config = supabasePublicConfig()
  if (!config) return null
  const cookieStore = await cookies()
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          return
        }
      },
    },
  })
}
