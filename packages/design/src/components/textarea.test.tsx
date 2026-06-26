import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Textarea } from './textarea'

describe('Textarea', () => {
  it('accepts typed text', async () => {
    render(<Textarea aria-label="Observações" />)
    const ta = screen.getByLabelText('Observações')
    await userEvent.type(ta, 'linha 1')
    expect(ta).toHaveValue('linha 1')
  })

  it('does not accept input when disabled', async () => {
    render(<Textarea aria-label="Bloqueado" disabled />)
    const ta = screen.getByLabelText('Bloqueado')
    await userEvent.type(ta, 'x')
    expect(ta).toHaveValue('')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Textarea aria-label="Observações" />)
    await expectNoA11yViolations(container)
  })
})
