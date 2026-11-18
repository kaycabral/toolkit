import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card'

function FullCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Unidade Matriz</CardTitle>
        <CardDescription>Recife, PE</CardDescription>
        <CardAction>
          <button type="button">Editar</button>
        </CardAction>
      </CardHeader>
      <CardContent>Corpo do card</CardContent>
      <CardFooter>Rodapé</CardFooter>
    </Card>
  )
}

describe('Card', () => {
  it('renders the full composition', () => {
    render(<FullCard />)
    expect(screen.getByText('Unidade Matriz')).toBeInTheDocument()
    expect(screen.getByText('Recife, PE')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument()
    expect(screen.getByText('Corpo do card')).toBeInTheDocument()
    expect(screen.getByText('Rodapé')).toBeInTheDocument()
  })

  it('renders the title through a heading when asChild is set', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle asChild>
            <h2>Zona de perigo</h2>
          </CardTitle>
        </CardHeader>
      </Card>,
    )
    // The title carries the heading role (and keeps its data-slot) instead of the
    // default non-semantic div.
    const heading = screen.getByRole('heading', { name: 'Zona de perigo' })
    expect(heading).toHaveAttribute('data-slot', 'card-title')
  })

  it('reflects the sm size on data-size', () => {
    render(
      <Card size="sm" role="region" aria-label="Resumo">
        <CardContent>x</CardContent>
      </Card>,
    )
    expect(screen.getByRole('region', { name: 'Resumo' })).toHaveAttribute('data-size', 'sm')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<FullCard />)
    await expectNoA11yViolations(container)
  })
})
