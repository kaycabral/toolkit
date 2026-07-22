import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Stepper } from './stepper'

const STEPS = ['Identidade', 'Endereço', 'Funcionamento', 'Revisão'] as const

describe('Stepper', () => {
  it('renders the "Passo N de M" counter for the active step', () => {
    render(<Stepper steps={STEPS} activeIndex={0} />)
    expect(screen.getByText('Passo 1 de 4')).toBeVisible()
  })

  it('marks steps as done, active and todo relative to the active index', () => {
    render(<Stepper steps={STEPS} activeIndex={2} />)
    expect(screen.getByRole('button', { name: /Identidade/ })).toHaveAttribute('data-state', 'done')
    expect(screen.getByRole('button', { name: /Endereço/ })).toHaveAttribute('data-state', 'done')
    expect(screen.getByRole('button', { name: 'Funcionamento' })).toHaveAttribute(
      'data-state',
      'active',
    )
    expect(screen.getByRole('button', { name: 'Revisão' })).toHaveAttribute('data-state', 'todo')
  })

  it('flags the active step with aria-current', () => {
    render(<Stepper steps={STEPS} activeIndex={1} />)
    expect(screen.getByRole('button', { name: 'Endereço' })).toHaveAttribute('aria-current', 'step')
    expect(screen.getByRole('button', { name: 'Revisão' })).not.toHaveAttribute('aria-current')
  })

  it('disables future steps', () => {
    render(<Stepper steps={STEPS} activeIndex={1} onStepSelect={() => undefined} />)
    expect(screen.getByRole('button', { name: 'Funcionamento' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Revisão' })).toBeDisabled()
  })

  it('navigates back through done steps when onStepSelect is provided', async () => {
    const onStepSelect = vi.fn()
    render(<Stepper steps={STEPS} activeIndex={2} onStepSelect={onStepSelect} />)
    await userEvent.click(screen.getByRole('button', { name: /Identidade/ }))
    expect(onStepSelect).toHaveBeenCalledWith(0)
  })

  it('keeps done steps inert without onStepSelect', () => {
    render(<Stepper steps={STEPS} activeIndex={2} />)
    expect(screen.getByRole('button', { name: /Identidade/ })).toBeDisabled()
  })

  it('grows the counter when the step list grows', () => {
    const { rerender } = render(<Stepper steps={STEPS} activeIndex={2} />)
    expect(screen.getByText('Passo 3 de 4')).toBeVisible()
    rerender(
      <Stepper
        steps={['Identidade', 'Endereço', 'Funcionamento', 'Agenda', 'Revisão']}
        activeIndex={2}
      />,
    )
    expect(screen.getByText('Passo 3 de 5')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Agenda' })).toHaveAttribute('data-state', 'todo')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Stepper steps={STEPS} activeIndex={1} />)
    await expectNoA11yViolations(container)
  })
})
