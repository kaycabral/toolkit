import type { JwtPayload } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import { sessionUserFromAuthUser, sessionUserFromClaims } from './session-user'

describe('sessionUserFromAuthUser', () => {
  it('maps a Google identity', () => {
    expect(
      sessionUserFromAuthUser({
        id: 'u1',
        email: 'ana@example.com',
        app_metadata: { provider: 'google', legacy_uid: 'l1' },
        user_metadata: {
          full_name: 'Ana Souza',
          name: 'Ana',
          avatar_url: 'https://img/a.png',
          picture: 'https://img/b.png',
          email_verified: true,
        },
      }),
    ).toEqual({
      id: 'u1',
      email: 'ana@example.com',
      name: 'Ana Souza',
      avatarUrl: 'https://img/a.png',
      emailVerified: true,
      appMetadata: { provider: 'google', legacy_uid: 'l1' },
    })
  })

  it('falls back to name and picture, skipping empty strings', () => {
    const user = sessionUserFromAuthUser({
      id: 'u1',
      app_metadata: {},
      user_metadata: { full_name: '', name: 'Ana', avatar_url: 42, picture: 'https://img/b.png' },
    })

    expect(user.name).toBe('Ana')
    expect(user.avatarUrl).toBe('https://img/b.png')
  })

  it('returns nulls and false when metadata is missing', () => {
    expect(
      sessionUserFromAuthUser({ id: 'u1', email: '', app_metadata: {}, user_metadata: {} }),
    ).toEqual({
      id: 'u1',
      email: null,
      name: null,
      avatarUrl: null,
      emailVerified: false,
      appMetadata: {},
    })
  })

  it('does not treat a truthy non-boolean email_verified as verified', () => {
    const user = sessionUserFromAuthUser({
      id: 'u1',
      app_metadata: {},
      user_metadata: { email_verified: 'true' },
    })

    expect(user.emailVerified).toBe(false)
  })
})

describe('sessionUserFromClaims', () => {
  const base: JwtPayload = {
    iss: 'https://abc.supabase.co/auth/v1',
    sub: 'u2',
    aud: 'authenticated',
    exp: 2,
    iat: 1,
    role: 'authenticated',
    aal: 'aal1',
    session_id: 's1',
  }

  it('maps verified claims', () => {
    expect(
      sessionUserFromClaims({
        ...base,
        email: 'bia@example.com',
        app_metadata: { legacy_uid: 'l2' },
        user_metadata: { name: 'Bia', picture: 'https://img/c.png', email_verified: true },
      }),
    ).toEqual({
      id: 'u2',
      email: 'bia@example.com',
      name: 'Bia',
      avatarUrl: 'https://img/c.png',
      emailVerified: true,
      appMetadata: { legacy_uid: 'l2' },
    })
  })

  it('tolerates claims without email or metadata', () => {
    expect(sessionUserFromClaims(base)).toEqual({
      id: 'u2',
      email: null,
      name: null,
      avatarUrl: null,
      emailVerified: false,
      appMetadata: {},
    })
  })

  it('ignores metadata that is not a plain object', () => {
    const user = sessionUserFromClaims({ ...base, app_metadata: undefined, user_metadata: ['x'] })

    expect(user.appMetadata).toEqual({})
    expect(user.name).toBeNull()
  })
})
