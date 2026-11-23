import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Calendar, CalendarDropdown } from './calendar'

describe('Calendar', () => {
  it('renders a month grid pinned to pt-BR', () => {
    render(<Calendar mode="single" defaultMonth={new Date(1988, 4, 1)} />)
    expect(screen.getByRole('grid')).toHaveClass('w-full', 'border-collapse')
    // pt-BR locale → month caption in Portuguese.
    expect(screen.getByText(/maio/i)).toBeInTheDocument()
  })

  it('marks the selected day', () => {
    render(
      <Calendar
        mode="single"
        selected={new Date(1988, 4, 20)}
        defaultMonth={new Date(1988, 4, 1)}
      />,
    )
    expect(screen.getByRole('gridcell', { name: '20' })).toHaveAttribute('aria-selected', 'true')
  })

  it('renders month/year dropdowns in dropdown caption layout', () => {
    render(
      <Calendar
        mode="single"
        captionLayout="dropdown"
        startMonth={new Date(1920, 0)}
        endMonth={new Date(2030, 0)}
        defaultMonth={new Date(1988, 4, 1)}
      />,
    )
    // Month + year selects (the whole point for far-past dates like birthdays).
    expect(screen.getAllByRole('combobox').length).toBeGreaterThanOrEqual(2)
  })

  it('navigates via the Select dropdowns (our primitive, not native)', async () => {
    const user = userEvent.setup()
    render(
      <Calendar
        mode="single"
        captionLayout="dropdown"
        startMonth={new Date(2020, 0)}
        endMonth={new Date(2030, 0)}
        defaultMonth={new Date(2024, 5, 1)}
      />,
    )
    const yearTrigger = screen.getAllByRole('combobox')[1]!
    await user.click(yearTrigger)
    await user.click(await screen.findByRole('option', { name: '2022' }))
    expect(screen.getAllByRole('combobox')[1]).toHaveTextContent('2022')
  })

  it('marks a selected range (start, middle, end)', () => {
    render(
      <Calendar
        mode="range"
        defaultMonth={new Date(1988, 4, 1)}
        selected={{ from: new Date(1988, 4, 10), to: new Date(1988, 4, 12) }}
      />,
    )
    expect(screen.getByRole('gridcell', { name: '10' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('gridcell', { name: '12' })).toHaveAttribute('aria-selected', 'true')
  })

  it('moves focus across days with the keyboard', async () => {
    const user = userEvent.setup()
    render(<Calendar mode="single" defaultMonth={new Date(1988, 4, 15)} />)
    await user.click(screen.getByText('15'))
    await user.keyboard('{ArrowRight}')
    // rdp marks the next day focused → CalendarDayButton's effect focuses it.
    expect(screen.getByText('16')).toHaveFocus()
  })

  it('renders week numbers when asked', () => {
    render(<Calendar mode="single" showWeekNumber defaultMonth={new Date(1988, 4, 1)} />)
    expect(screen.getByRole('grid')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Calendar mode="single" defaultMonth={new Date(1988, 4, 1)} />)
    await expectNoA11yViolations(container)
  })
})

describe('CalendarDropdown', () => {
  const options = [
    { value: 2022, label: '2022', disabled: false },
    { value: 2023, label: '2023', disabled: false },
  ]

  it('renders the current option label on our Select trigger', () => {
    render(<CalendarDropdown options={options} value={2023} aria-label="Ano" />)
    expect(screen.getByRole('combobox', { name: 'Ano' })).toHaveTextContent('2023')
  })

  it('handles an undefined value', () => {
    render(<CalendarDropdown options={options} value={undefined} aria-label="Ano" />)
    expect(screen.getByRole('combobox', { name: 'Ano' })).toBeInTheDocument()
  })

  it('propagates the choice to react-day-picker via a real change event', async () => {
    const onChange = vi.fn()
    render(<CalendarDropdown options={options} value={2022} onChange={onChange} aria-label="Ano" />)
    await userEvent.click(screen.getByRole('combobox', { name: 'Ano' }))
    await userEvent.click(await screen.findByRole('option', { name: '2023' }))
    expect(onChange).toHaveBeenCalled()
  })
})
