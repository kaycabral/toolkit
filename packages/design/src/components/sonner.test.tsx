import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Toaster } from './sonner'

// Toaster is a thin wrapper over sonner (external lib) — it only injects theme,
// icons and CSS vars; the toast behaviour itself is sonner's and is exercised by
// app-level flows. The unit-level contract here is just that the wrapper mounts
// without throwing (it reads next-themes + window.matchMedia, which is the part
// that has broken before). sonner renders toasts lazily, so there's no stable
// synchronous DOM to assert beyond a clean mount.
describe('Toaster', () => {
  it('mounts without throwing', () => {
    expect(() => render(<Toaster />)).not.toThrow()
  })
})
