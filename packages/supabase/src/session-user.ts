import type { JwtPayload, User } from '@supabase/supabase-js'

/** The signed-in user, normalised from a Supabase user or verified JWT claims. */
export type SessionUser = {
  /** Supabase Auth user id (`auth.users.id`, the JWT `sub`). */
  id: string
  email: string | null
  /** `full_name`, falling back to `name`, from the identity metadata. */
  name: string | null
  /** `avatar_url`, falling back to `picture`, from the identity metadata. */
  avatarUrl: string | null
  /** `true` only when the identity provider reported `email_verified: true`. */
  emailVerified: boolean
  /** Server-controlled `app_metadata`, for app-specific claims. */
  appMetadata: Record<string, unknown>
}

/** The fields of a Supabase `User` that {@link sessionUserFromAuthUser} reads. */
export type AuthUserFields = Pick<User, 'id' | 'email' | 'app_metadata' | 'user_metadata'>

type Metadata = Record<string, unknown>

function isRecord(value: unknown): value is Metadata {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asMetadata(value: unknown): Metadata {
  return isRecord(value) ? value : {}
}

function text(metadata: Metadata, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = metadata[key]
    if (typeof value === 'string' && value.length > 0) return value
  }
  return null
}

function build(
  id: string,
  email: unknown,
  appMetadata: unknown,
  userMetadata: unknown,
): SessionUser {
  const identity = asMetadata(userMetadata)
  return {
    id,
    email: typeof email === 'string' && email.length > 0 ? email : null,
    name: text(identity, 'full_name', 'name'),
    avatarUrl: text(identity, 'avatar_url', 'picture'),
    emailVerified: identity.email_verified === true,
    appMetadata: asMetadata(appMetadata),
  }
}

/**
 * Maps a Supabase `User` (from `exchangeCodeForSession`, `signInWithPassword`,
 * `onAuthStateChange`, …) to a {@link SessionUser}.
 */
export function sessionUserFromAuthUser(user: AuthUserFields): SessionUser {
  return build(user.id, user.email, user.app_metadata, user.user_metadata)
}

/**
 * Maps verified JWT claims (`supabase.auth.getClaims()`) to a
 * {@link SessionUser}, so server code can read the user without a network
 * round trip to the Auth server.
 */
export function sessionUserFromClaims(claims: JwtPayload): SessionUser {
  return build(claims.sub, claims.email, claims.app_metadata, claims.user_metadata)
}
