import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Popover, PopoverContent, PopoverTrigger } from './popover'

function Pop() {
  return (
    <Popover defaultOpen>
      <PopoverTrigger>Abrir</PopoverTrigger>
      {/* role=dialog needs an accessible name — label it like real usage. */}
      <PopoverContent aria-label="Detalhes">Conteúdo do popover</PopoverContent>
    </Popover>
  )
}

describe('Popover', () => {
  it('renders the content in a portal when open', () => {
    render(<Pop />)
    expect(screen.getByText('Conteúdo do popover')).toBeInTheDocument()
  })

  it('has no accessibility violations while open', async () => {
    render(<Pop />)
    await expectNoA11yViolations(document.body)
  })
})
