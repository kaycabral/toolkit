import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible'

function Tree() {
  return (
    <Collapsible>
      <CollapsibleTrigger>Detalhes</CollapsibleTrigger>
      <CollapsibleContent>Conteúdo escondido</CollapsibleContent>
    </Collapsible>
  )
}

describe('Collapsible', () => {
  it('hides content until the trigger is clicked', async () => {
    render(<Tree />)
    expect(screen.queryByText('Conteúdo escondido')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Detalhes' }))
    expect(screen.getByText('Conteúdo escondido')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Tree />)
    await expectNoA11yViolations(container)
  })
})
