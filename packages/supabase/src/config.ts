/** Project URL and publishable key of the Supabase project the app talks to. */
export type SupabasePublicConfig = {
  url: string
  key: string
}

/**
 * Public Supabase config read from `NEXT_PUBLIC_SUPABASE_URL` and
 * `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, or `null` when either is missing so
 * callers can render a signed-out / degraded UI instead of crashing.
 *
 * Both variables are read as literal `process.env.NEXT_PUBLIC_*` member
 * expressions, which lets Next.js inline them into the browser bundle.
 */
export function supabasePublicConfig(): SupabasePublicConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  return url && key ? { url, key } : null
}

/** Whether both public Supabase variables are set. */
export function isSupabaseConfigured(): boolean {
  return supabasePublicConfig() !== null
}
