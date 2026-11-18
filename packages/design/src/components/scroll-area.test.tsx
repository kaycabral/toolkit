import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen, within } from '@testing-library/react'
import { ScrollArea as ScrollAreaPrimitive } from 'radix-ui'
import type * as React from 'react'
import { describe, expect, it } from 'vitest'

import { ScrollArea, ScrollBar } from './scroll-area'

// A minimal Root that always shows its scrollbars so the bar stays mounted in
// jsdom (which has no real overflow to trigger auto-visibility).
function ScrollAreaRootForTest({ children }: { children: React.ReactNode }) {
  return (
    <ScrollAreaPrimitive.Root type="always">
      <ScrollAreaPrimitive.Viewport>content</ScrollAreaPrimitive.Viewport>
      {children}
    </ScrollAreaPrimitive.Root>
  )
}

describe('ScrollArea', () => {
  it('renders its children inside a scroll viewport', () => {
    render(
      <ScrollArea className="h-24" role="region" aria-label="Lista">
        <p>conteúdo longo</p>
      </ScrollArea>,
    )
    const region = screen.getByRole('region', { name: 'Lista' })
    expect(region).toHaveAttribute('data-slot', 'scroll-area')
    expect(within(region).getByText('conteúdo longo')).toBeInTheDocument()
    // The viewport is an internal Radix node with no ARIA role; assert it is
    // mounted inside the root through its serialized markup.
    expect(region).toContainHTML('data-slot="scroll-area-viewport"')
  })

  it('exposes a horizontal scrollbar variant within a scroll area', () => {
    // ScrollBar wraps Radix's ScrollAreaScrollbar, which needs the Root context;
    // render it inside a ScrollArea Root (from radix-ui) with a forced type so
    // jsdom keeps the bar mounted.
    render(
      <ScrollAreaRootForTest>
        <ScrollBar orientation="horizontal" role="group" aria-label="Rolagem horizontal" />
      </ScrollAreaRootForTest>,
    )
    const bar = screen.getByRole('group', { name: 'Rolagem horizontal' })
    expect(bar).toHaveAttribute('data-slot', 'scroll-area-scrollbar')
    expect(bar).toHaveAttribute('data-orientation', 'horizontal')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <ScrollArea className="h-24">
        <p>conteúdo</p>
      </ScrollArea>,
    )
    await expectNoA11yViolations(container)
  })
})
