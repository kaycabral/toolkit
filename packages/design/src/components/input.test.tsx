import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Input } from './input'

describe('Input', () => {
  it('accepts typed text', async () => {
    render(<Input aria-label="Nome" />)
    const input = screen.getByLabelText('Nome')
    await userEvent.type(input, 'Maria')
    expect(input).toHaveValue('Maria')
  })

  it('forwards the type attribute', () => {
    render(<Input aria-label="Email" type="email" />)
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email')
  })

  it('does not accept input when disabled', async () => {
    render(<Input aria-label="Bloqueado" disabled />)
    const input = screen.getByLabelText('Bloqueado')
    await userEvent.type(input, 'x')
    expect(input).toHaveValue('')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Input aria-label="Nome" />)
    await expectNoA11yViolations(container)
  })
})
