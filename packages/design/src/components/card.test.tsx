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

  it('reflects the sm size on data-size', () => {
    render(
      <Card size="sm" data-testid="card">
        <CardContent>x</CardContent>
      </Card>,
    )
    expect(screen.getByTestId('card')).toHaveAttribute('data-size', 'sm')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<FullCard />)
    await expectNoA11yViolations(container)
  })
})
