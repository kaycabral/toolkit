import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server.js'
import { supabasePublicConfig } from './config'

/** Default upper bound for the session refresh before the request goes through anyway. */
export const SESSION_REFRESH_TIMEOUT_MS = 4_000

/** Options for {@link updateSession}. */
export type UpdateSessionOptions = {
  /**
   * Headers to forward to the app instead of the incoming ones, e.g. a copy of
   * `request.headers` with extra entries. Refreshed auth cookies are written
   * into it before forwarding.
   */
  requestHeaders?: Headers
  /** Called when the refresh throws or times out; the request still goes through. */
  onError?: (error: unknown) => void
  /** Refresh timeout in milliseconds. Defaults to {@link SESSION_REFRESH_TIMEOUT_MS}. */
  timeoutMs?: number
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`session refresh timed out after ${timeoutMs}ms`))
    }, timeoutMs)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Refreshes the Supabase session cookie in `proxy.ts`, so Server Components see
 * a valid token. Follows the `@supabase/ssr` contract: refreshed cookies go to
 * both the forwarded request and the response, along with the cache headers the
 * library asks for. A Supabase outage only skips the refresh.
 */
export async function updateSession(
  request: NextRequest,
  options: UpdateSessionOptions = {},
): Promise<NextResponse> {
  const { requestHeaders, onError, timeoutMs = SESSION_REFRESH_TIMEOUT_MS } = options

  function forward(): NextResponse {
    if (!requestHeaders) return NextResponse.next({ request })
    const cookie = request.headers.get('cookie')
    if (cookie !== null) requestHeaders.set('cookie', cookie)
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  let response = forward()
  const config = supabasePublicConfig()
  if (!config) return response

  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
        response = forward()
        for (const { name, value, options: cookieOptions } of cookiesToSet) {
          response.cookies.set(name, value, cookieOptions)
        }
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value)
      },
    },
  })

  try {
    await withTimeout(supabase.auth.getClaims(), timeoutMs)
  } catch (error) {
    onError?.(error)
  }
  return response
}
