import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
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
      <ScrollArea className="h-24">
        <p>conteúdo longo</p>
      </ScrollArea>,
    )
    expect(screen.getByText('conteúdo longo')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="scroll-area-viewport"]')).toBeInTheDocument()
  })

  it('exposes a horizontal scrollbar variant within a scroll area', () => {
    // ScrollBar wraps Radix's ScrollAreaScrollbar, which needs the Root context;
    // render it inside a ScrollArea Root (from radix-ui) with a forced type so
    // jsdom keeps the bar mounted.
    render(
      <ScrollAreaRootForTest>
        <ScrollBar orientation="horizontal" data-testid="bar" />
      </ScrollAreaRootForTest>,
    )
    expect(screen.getByTestId('bar')).toHaveAttribute('data-slot', 'scroll-area-scrollbar')
    expect(screen.getByTestId('bar')).toHaveAttribute('data-orientation', 'horizontal')
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
