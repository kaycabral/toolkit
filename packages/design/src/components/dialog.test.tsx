import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog'

function Modal({ showCloseButton = true }: { showCloseButton?: boolean }) {
  return (
    <Dialog defaultOpen>
      <DialogTrigger>Abrir</DialogTrigger>
      <DialogContent showCloseButton={showCloseButton}>
        <DialogHeader>
          <DialogTitle>Editar unidade</DialogTitle>
          <DialogDescription>Atualize os dados da unidade.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button type="button">Salvar</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

describe('Dialog', () => {
  it('renders title, description and the default close button when open', () => {
    render(<Modal />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Editar unidade')).toBeInTheDocument()
    expect(screen.getByText('Atualize os dados da unidade.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('omits the close button when showCloseButton is false', () => {
    render(<Modal showCloseButton={false} />)
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
  })

  it('has no accessibility violations while open', async () => {
    render(<Modal />)
    await expectNoA11yViolations(document.body)
  })
})
