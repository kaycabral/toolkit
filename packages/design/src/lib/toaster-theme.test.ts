import { describe, expect, it } from 'vitest'

import { toasterTheme } from './toaster-theme'

describe('toasterTheme', () => {
  it('keeps the explicit light and dark themes', () => {
    expect(toasterTheme('light')).toBe('light')
    expect(toasterTheme('dark')).toBe('dark')
  })

  it('falls back to system for system or unknown themes', () => {
    expect(toasterTheme('system')).toBe('system')
    expect(toasterTheme('sepia')).toBe('system')
  })
})
