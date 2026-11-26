import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChevronDown } from 'lucide-react'
import { describe, expect, it } from 'vitest'

import { Button } from './button'
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  buttonGroupVariants,
} from './button-group'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'

function SplitButton() {
  return (
    <ButtonGroup aria-label="Salvar">
      <Button>Salvar</Button>
      <ButtonGroupSeparator />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" aria-label="Mais opções">
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Salvar como rascunho</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  )
}

describe('ButtonGroup', () => {
  it('is a named group, horizontal by default, joining its children', () => {
    render(<SplitButton />)
    const group = screen.getByRole('group', { name: 'Salvar' })
    expect(group).toHaveAttribute('data-slot', 'button-group')
    expect(group).toHaveAttribute('data-orientation', 'horizontal')
    expect(group).toHaveClass('[&>*:not(:first-child)]:rounded-l-none', '*:focus-visible:z-10')
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  it('opens the split menu from the chevron', async () => {
    render(<SplitButton />)
    await userEvent.click(screen.getByRole('button', { name: 'Mais opções' }))
    expect(
      await screen.findByRole('menuitem', { name: 'Salvar como rascunho' }),
    ).toBeInTheDocument()
  })

  it('stacks vertically and renders a text addon', () => {
    render(
      <ButtonGroup orientation="vertical" aria-label="Zoom">
        <ButtonGroupText>100%</ButtonGroupText>
        <Button>+</Button>
      </ButtonGroup>,
    )
    const group = screen.getByRole('group', { name: 'Zoom' })
    expect(group).toHaveAttribute('data-orientation', 'vertical')
    expect(group).toHaveClass('flex-col')
    expect(screen.getByText('100%')).toHaveAttribute('data-slot', 'button-group-text')
  })

  it('renders the text addon as its child with asChild', () => {
    render(
      <ButtonGroup aria-label="URL">
        <ButtonGroupText asChild>
          <label htmlFor="url">https://</label>
        </ButtonGroupText>
        <input id="url" />
      </ButtonGroup>,
    )
    expect(screen.getByLabelText('https://')).toBeInTheDocument()
  })

  it('exposes buttonGroupVariants', () => {
    expect(buttonGroupVariants({ orientation: 'vertical' })).toContain('flex-col')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<SplitButton />)
    await expectNoA11yViolations(container)
  })
})
