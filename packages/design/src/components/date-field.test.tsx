import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { DateField } from './date-field'

describe('DateField', () => {
  it('shows the ISO defaultValue in pt-BR (dd/mm/aaaa)', () => {
    render(<DateField defaultValue="1988-05-20" aria-label="Nascimento" />)
    expect(screen.getByLabelText('Nascimento')).toHaveValue('20/05/1988')
  })

  it('masks typing and emits ISO once the date is complete', async () => {
    const onValueChange = vi.fn()
    render(<DateField aria-label="Data" onValueChange={onValueChange} />)
    const input = screen.getByLabelText('Data')
    await userEvent.type(input, '20051988')
    expect(input).toHaveValue('20/05/1988')
    expect(onValueChange).toHaveBeenLastCalledWith('1988-05-20')
    // Blur: leaves the field (exercises the focus-tracking path).
    await userEvent.tab()
    expect(input).toHaveValue('20/05/1988')
  })

  it('submits the ISO value through a hidden input under `name`', () => {
    render(<DateField name="birthDate" defaultValue="1988-05-20" aria-label="Data" />)
    // Visible field shows pt-BR (20/05/1988); the hidden input carries the ISO.
    const hidden = screen.getByDisplayValue('1988-05-20')
    expect(hidden).toHaveAttribute('name', 'birthDate')
    expect(hidden).toHaveAttribute('type', 'hidden')
  })

  it('hides the calendar trigger when calendar={false}', () => {
    render(<DateField aria-label="Data" calendar={false} />)
    expect(screen.queryByRole('button', { name: 'Abrir calendário' })).not.toBeInTheDocument()
  })

  it('exposes a calendar trigger by default', () => {
    render(<DateField aria-label="Data" />)
    expect(screen.getByRole('button', { name: 'Abrir calendário' })).toBeInTheDocument()
  })

  it('renders a button-only trigger in button presentation', () => {
    render(<DateField presentation="button" defaultValue="1988-05-20" aria-label="Data" />)
    expect(screen.getByRole('button')).toHaveTextContent('20/05/1988')
    // No typeable text field in button presentation.
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('commits a date picked from the calendar (input mode, within min/max)', async () => {
    const onValueChange = vi.fn()
    render(
      <DateField
        aria-label="Data"
        defaultValue="1988-05-20"
        min="1988-05-01"
        max="1988-05-31"
        onValueChange={onValueChange}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }))
    await userEvent.click(screen.getByText('15'))
    expect(onValueChange).toHaveBeenLastCalledWith('1988-05-15')
    expect(screen.getByLabelText('Data')).toHaveValue('15/05/1988')
  })

  it('picks a date from the button presentation popover', async () => {
    const onValueChange = vi.fn()
    render(
      <DateField
        presentation="button"
        defaultValue="1988-05-20"
        onValueChange={onValueChange}
        aria-label="Data"
      />,
    )
    await userEvent.click(screen.getByRole('button'))
    await userEvent.click(screen.getByText('10'))
    expect(onValueChange).toHaveBeenLastCalledWith('1988-05-10')
  })

  it('shows the placeholder in button presentation when empty', () => {
    render(<DateField presentation="button" placeholder="Escolha a data" aria-label="Data" />)
    expect(screen.getByRole('button')).toHaveTextContent('Escolha a data')
  })

  it('renders the calendar with month/year dropdowns when captionLayout is dropdown', async () => {
    render(<DateField aria-label="Data" captionLayout="dropdown" />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }))
    expect(screen.getAllByRole('combobox').length).toBeGreaterThanOrEqual(2)
  })

  it('does not clobber the field while focused under a controlled value', async () => {
    const { rerender } = render(<DateField value="1988-05-20" aria-label="Data" />)
    const input = screen.getByLabelText('Data')
    // Focus → the controlled sync must be suppressed so typing isn't clobbered.
    await userEvent.click(input)
    rerender(<DateField value="2000-01-02" aria-label="Data" />)
    expect(input).toHaveValue('20/05/1988')
  })

  it('ignores a toggled-off calendar selection (no date)', async () => {
    render(<DateField aria-label="Data" defaultValue="1988-05-20" />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }))
    // Clicking the already-selected day toggles it off → onSelect(undefined).
    await userEvent.click(screen.getByText('20'))
    expect(screen.getByLabelText('Data')).toHaveValue('20/05/1988')
  })

  it('reflects controlled value changes', () => {
    const { rerender } = render(<DateField value="1988-05-20" aria-label="Data" />)
    expect(screen.getByLabelText('Data')).toHaveValue('20/05/1988')
    rerender(<DateField value="2000-01-02" aria-label="Data" />)
    expect(screen.getByLabelText('Data')).toHaveValue('02/01/2000')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<DateField aria-label="Data" defaultValue="1988-05-20" />)
    await expectNoA11yViolations(container)
  })
})
