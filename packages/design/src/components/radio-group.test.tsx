import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Label } from './label'
import { RadioGroup, RadioGroupItem } from './radio-group'

function Modes() {
  return (
    <RadioGroup aria-label="Modo de atendimento">
      <div>
        <RadioGroupItem id="mode-appointment" value="appointment" />
        <Label htmlFor="mode-appointment">Por agendamento</Label>
      </div>
      <div>
        <RadioGroupItem id="mode-fixed" value="fixed" />
        <Label htmlFor="mode-fixed">Ordem de chegada</Label>
      </div>
    </RadioGroup>
  )
}

describe('RadioGroup', () => {
  it('renders radios without any preselected item', () => {
    render(<Modes />)
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(2)
    for (const radio of radios) expect(radio).toHaveAttribute('data-state', 'unchecked')
  })

  it('checks the clicked item and unchecks the sibling', async () => {
    render(<Modes />)
    await userEvent.click(screen.getByRole('radio', { name: 'Por agendamento' }))
    expect(screen.getByRole('radio', { name: 'Por agendamento' })).toHaveAttribute(
      'data-state',
      'checked',
    )
    expect(screen.getByRole('radio', { name: 'Ordem de chegada' })).toHaveAttribute(
      'data-state',
      'unchecked',
    )
  })

  it('emits the selected value through onValueChange', async () => {
    const onValueChange = vi.fn()
    render(
      <RadioGroup aria-label="Modo" onValueChange={onValueChange}>
        <RadioGroupItem value="appointment" aria-label="Por agendamento" />
      </RadioGroup>,
    )
    await userEvent.click(screen.getByRole('radio', { name: 'Por agendamento' }))
    expect(onValueChange).toHaveBeenCalledWith('appointment')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Modes />)
    await expectNoA11yViolations(container)
  })
})
