'use client'

import { useCallback, useRef, useState } from 'react'
import { getSupabaseBrowserClient } from './client'
import { safeNextPath } from './safe-next'

/** Options for {@link useGoogleSignIn}. */
export type UseGoogleSignInOptions = {
  /** Same-origin path to land on after sign-in; anything else falls back to `/`. */
  next: string
  /** Path of the OAuth callback route. Defaults to `/auth/callback`. */
  callbackPath?: string
  /**
   * Called when sign-in cannot start: Supabase is not configured, or
   * `signInWithOAuth` returned an error.
   */
  onError?: (error: Error) => void
}

/** State returned by {@link useGoogleSignIn}. */
export type GoogleSignIn = {
  /** Starts the redirect to Google. Repeated calls while pending are ignored. */
  signIn: () => Promise<void>
  /** `true` from the first call until an error (on success the page navigates away). */
  pending: boolean
}

/**
 * Google sign-in through Supabase Auth (OAuth + PKCE). Redirects the page to
 * Google with `prompt=select_account`, back through `callbackPath?next=…`.
 */
export function useGoogleSignIn(options: UseGoogleSignInOptions): GoogleSignIn {
  const { next, callbackPath = '/auth/callback', onError } = options
  const [pending, setPending] = useState(false)
  const started = useRef(false)

  const signIn = useCallback(async () => {
    if (started.current) return
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      onError?.(new Error('Supabase is not configured'))
      return
    }
    started.current = true
    setPending(true)
    const callback = new URL(callbackPath, window.location.origin)
    callback.searchParams.set('next', safeNextPath(next, '/'))
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callback.toString(), queryParams: { prompt: 'select_account' } },
    })
    if (error) {
      started.current = false
      setPending(false)
      onError?.(error)
    }
  }, [next, callbackPath, onError])

  return { signIn, pending }
}
