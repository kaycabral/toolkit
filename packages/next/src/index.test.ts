import { describe, expect, it } from 'vitest'

import { isSafeInternalPath, safeNext } from './index'

describe('isSafeInternalPath', () => {
  it.each(['/', '/dashboard', '/a/b?x=1#y', '/path//double'])('accepts %s', (raw) => {
    expect(isSafeInternalPath(raw)).toBe(true)
  })

  it.each([
    null,
    undefined,
    42,
    '',
    'dashboard',
    'https://evil.com',
    'javascript:alert(1)',
    '//evil.com',
    '/\\evil.com',
    '/\t/evil.com',
    '/\n/evil.com',
    '/x\u007f',
  ])('rejects %j', (raw) => {
    expect(isSafeInternalPath(raw)).toBe(false)
  })
})

describe('safeNext', () => {
  it('returns the path when safe', () => {
    expect(safeNext('/settings', '/dashboard')).toBe('/settings')
  })

  it('returns the fallback when unsafe', () => {
    expect(safeNext('//evil.com', '/dashboard')).toBe('/dashboard')
    expect(safeNext(null, null)).toBeNull()
  })
})
