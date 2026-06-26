import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog'

function Confirm() {
  return (
    <AlertDialog defaultOpen>
      <AlertDialogTrigger>Excluir</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir unidade?</AlertDialogTitle>
          <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction>Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

describe('AlertDialog', () => {
  it('renders title, description and both actions when open', () => {
    render(<Confirm />)
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('Excluir unidade?')).toBeInTheDocument()
    expect(screen.getByText('Esta ação não pode ser desfeita.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Excluir' })).toBeInTheDocument()
  })

  it('has no accessibility violations while open', async () => {
    render(<Confirm />)
    // Content is portalled to document.body, so scan the whole document.
    await expectNoA11yViolations(document.body)
  })
})
