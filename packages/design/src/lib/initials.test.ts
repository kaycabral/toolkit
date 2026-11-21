import { describe, expect, it } from 'vitest'

import { initials } from './initials'

describe('initials', () => {
  it('takes the first letter of the first two words', () => {
    expect(initials('Ada Lovelace')).toBe('AL')
    expect(initials('  Ada   King  Lovelace ')).toBe('AK')
  })

  it('takes the first two characters of a single word', () => {
    expect(initials('Ada')).toBe('AD')
    expect(initials('A')).toBe('A')
    expect(initials('ada@example.com')).toBe('AD')
  })

  it('falls back when primary is null, undefined or blank', () => {
    expect(initials(null, 'ada@example.com')).toBe('AD')
    expect(initials(undefined, 'Grace Hopper')).toBe('GH')
    expect(initials('   ', 'Grace Hopper')).toBe('GH')
  })

  it('returns "?" when nothing usable is given', () => {
    expect(initials(null)).toBe('?')
    expect(initials(null, null)).toBe('?')
    expect(initials('', '  ')).toBe('?')
  })

  it('keeps astral characters whole', () => {
    expect(initials('😀 Smile')).toBe('😀S')
  })
})
