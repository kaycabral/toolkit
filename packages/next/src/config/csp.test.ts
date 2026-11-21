import { describe, expect, it } from 'vitest'

import { buildCsp, cspDirectives } from './csp'

describe('buildCsp', () => {
  it('joins directives in order and de-duplicates sources', () => {
    expect(
      buildCsp({
        'default-src': ["'self'", "'self'"],
        'img-src': ["'self'", 'data:'],
        'upgrade-insecure-requests': [],
        'object-src': undefined,
      }),
    ).toBe("default-src 'self'; img-src 'self' data:; upgrade-insecure-requests")
  })
})

describe('cspDirectives', () => {
  it('returns the baseline without additions', () => {
    expect(buildCsp(cspDirectives())).toBe(
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: blob:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "worker-src 'self' blob:",
        "frame-src 'none'",
        "frame-ancestors 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; '),
    )
  })

  it('appends to baseline directives and replaces a lone none', () => {
    const csp = cspDirectives({
      'connect-src': ['https://abc.supabase.co', "'self'"],
      'frame-src': ['https://challenges.cloudflare.com'],
      'form-action': ['https://checkout.stripe.com'],
    })
    expect(csp['connect-src']).toEqual(["'self'", 'https://abc.supabase.co'])
    expect(csp['frame-src']).toEqual(['https://challenges.cloudflare.com'])
    expect(csp['form-action']).toEqual(["'self'", 'https://checkout.stripe.com'])
  })

  it('adds new directives and ignores empty or undefined additions to baseline ones', () => {
    const csp = cspDirectives({
      'upgrade-insecure-requests': [],
      'media-src': ['https://cdn.example.com'],
      'frame-src': [],
      'img-src': undefined,
    })
    expect(csp['upgrade-insecure-requests']).toEqual([])
    expect(csp['media-src']).toEqual(['https://cdn.example.com'])
    expect(csp['frame-src']).toEqual(["'none'"])
    expect(csp['img-src']).toEqual(["'self'", 'data:', 'https:', 'blob:'])
  })
})
