import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Label } from './label'
import { Switch } from './switch'

function Field() {
  return (
    <div>
      <Switch id="notif" />
      <Label htmlFor="notif">Notificações</Label>
    </div>
  )
}

describe('Switch', () => {
  it('toggles its checked state on click', async () => {
    render(<Field />)
    const sw = screen.getByRole('switch', { name: 'Notificações' })
    expect(sw).toHaveAttribute('data-state', 'unchecked')
    await userEvent.click(sw)
    expect(sw).toHaveAttribute('data-state', 'checked')
  })

  it('reflects the sm size', () => {
    render(<Switch aria-label="x" size="sm" />)
    expect(screen.getByRole('switch')).toHaveAttribute('data-size', 'sm')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Field />)
    await expectNoA11yViolations(container)
  })
})
