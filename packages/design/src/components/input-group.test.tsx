import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { InputGroup, InputGroupAddon, InputGroupInput } from './input-group'

function Group() {
  return (
    <InputGroup>
      <InputGroupAddon align="inline-start">R$</InputGroupAddon>
      <InputGroupInput aria-label="Preço" />
      <InputGroupAddon align="inline-end">/mês</InputGroupAddon>
    </InputGroup>
  )
}

describe('InputGroup', () => {
  it('renders the control with both addons inside a group', () => {
    render(<Group />)
    expect(screen.getByRole('group')).toBeInTheDocument()
    expect(screen.getByLabelText('Preço')).toBeInTheDocument()
    expect(screen.getByText('R$')).toBeInTheDocument()
    expect(screen.getByText('/mês')).toBeInTheDocument()
  })

  it('defaults the addon alignment to inline-end', () => {
    render(
      <InputGroup>
        <InputGroupAddon>%</InputGroupAddon>
        <InputGroupInput aria-label="Taxa" />
      </InputGroup>,
    )
    // The addon renders its text directly, so the text match is the addon itself.
    const addon = screen.getByText('%')
    expect(addon).toHaveAttribute('data-slot', 'input-group-addon')
    expect(addon).toHaveClass('order-last')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Group />)
    await expectNoA11yViolations(container)
  })
})
