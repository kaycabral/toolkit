import { describe, expect, it } from 'vitest'

import { cn } from './cn'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('dedupes tailwind classes with tailwind-merge', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('handles conditional classes', () => {
    expect(cn('base', { active: true, hidden: false })).toBe('base active')
  })
})
