import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './sheet'

function Drawer({ side }: { side?: 'top' | 'right' | 'bottom' | 'left' }) {
  return (
    <Sheet defaultOpen>
      <SheetTrigger>Abrir</SheetTrigger>
      <SheetContent side={side}>
        <SheetHeader>
          <SheetTitle>Filtros</SheetTitle>
          <SheetDescription>Refine a listagem.</SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <button type="button">Aplicar</button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

describe('Sheet', () => {
  it('renders the content when open', () => {
    render(<Drawer />)
    expect(screen.getByText('Filtros')).toBeInTheDocument()
    expect(screen.getByText('Refine a listagem.')).toBeInTheDocument()
  })

  it('reflects the side on data-side', () => {
    render(<Drawer side="left" />)
    expect(document.querySelector('[data-slot=sheet-content]')).toHaveAttribute('data-side', 'left')
  })

  it('has no accessibility violations while open', async () => {
    render(<Drawer />)
    await expectNoA11yViolations(document.body)
  })
})
