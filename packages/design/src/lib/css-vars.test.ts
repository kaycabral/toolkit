import { describe, expect, it } from 'vitest'

import { cssVars } from './css-vars'

describe('cssVars', () => {
  it('returns the custom properties untouched as a style object', () => {
    expect(cssVars({ '--sidebar-width': '16rem', '--radius': '0.5rem' })).toEqual({
      '--sidebar-width': '16rem',
      '--radius': '0.5rem',
    })
  })
})
