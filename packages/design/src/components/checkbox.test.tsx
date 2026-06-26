import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Checkbox } from './checkbox'
import { Label } from './label'

function Field() {
  return (
    <div>
      <Checkbox id="terms" />
      <Label htmlFor="terms">Aceito os termos</Label>
    </div>
  )
}

describe('Checkbox', () => {
  it('renders an unchecked checkbox tied to its label', () => {
    render(<Field />)
    const checkbox = screen.getByRole('checkbox', { name: 'Aceito os termos' })
    expect(checkbox).toHaveAttribute('data-state', 'unchecked')
  })

  it('toggles when clicked', async () => {
    render(<Field />)
    const checkbox = screen.getByRole('checkbox', { name: 'Aceito os termos' })
    await userEvent.click(checkbox)
    expect(checkbox).toHaveAttribute('data-state', 'checked')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Field />)
    await expectNoA11yViolations(container)
  })
})
