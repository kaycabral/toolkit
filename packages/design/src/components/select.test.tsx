import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './select'

// Open-state relies on scrollIntoView + Pointer Capture, both stubbed in
// vitest.setup.ts so the portalled listbox can be asserted here.
function Picker({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return (
    <Select defaultOpen={defaultOpen}>
      <SelectTrigger aria-label="Unidade">
        <SelectValue placeholder="Selecione" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Unidades</SelectLabel>
          <SelectItem value="matriz">Matriz</SelectItem>
          <SelectSeparator />
          <SelectItem value="filial">Filial</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

describe('Select', () => {
  it('renders the trigger with its placeholder when closed', () => {
    render(<Picker />)
    const trigger = screen.getByRole('combobox', { name: 'Unidade' })
    expect(trigger).toBeInTheDocument()
    expect(trigger).toHaveTextContent('Selecione')
  })

  it('renders a small trigger when size is sm', () => {
    render(
      <Select>
        <SelectTrigger size="sm" aria-label="Compacto">
          <SelectValue placeholder="x" />
        </SelectTrigger>
      </Select>,
    )
    expect(screen.getByRole('combobox', { name: 'Compacto' })).toHaveAttribute('data-size', 'sm')
  })

  it('renders the listbox content and options when open', () => {
    render(<Picker defaultOpen />)
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Matriz' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Filial' })).toBeInTheDocument()
  })

  it('has no accessibility violations while open', async () => {
    render(<Picker defaultOpen />)
    await expectNoA11yViolations(document.body)
  })
})
