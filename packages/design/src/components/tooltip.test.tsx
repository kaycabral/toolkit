import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

function Tip() {
  return (
    <TooltipProvider>
      <Tooltip defaultOpen>
        <TooltipTrigger>Info</TooltipTrigger>
        <TooltipContent>Dica útil</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

describe('Tooltip', () => {
  it('renders the content when open', () => {
    render(<Tip />)
    // Radix renders the tooltip text in both the visible content and an a11y
    // mirror; assert at least one is present.
    expect(screen.getAllByText('Dica útil').length).toBeGreaterThan(0)
  })

  it('has no accessibility violations while open', async () => {
    render(<Tip />)
    await expectNoA11yViolations(document.body)
  })
})
