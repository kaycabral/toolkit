import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './table'

function FullTable() {
  return (
    <Table>
      <TableCaption>Unidades cadastradas</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Nome</TableHead>
          <TableHead scope="col">Cidade</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Matriz</TableCell>
          <TableCell>Recife</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell>1</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}

describe('Table', () => {
  it('renders the full table structure', () => {
    render(<FullTable />)
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('Matriz')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Nome' })).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<FullTable />)
    await expectNoA11yViolations(container)
  })
})
