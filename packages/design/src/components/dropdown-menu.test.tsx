import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './dropdown-menu'

function Menu() {
  return (
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger>Ações</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Conta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            Editar
            <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive">Excluir</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked>Mostrar arquivados</DropdownMenuCheckboxItem>
        <DropdownMenuRadioGroup value="recentes">
          <DropdownMenuRadioItem value="recentes">Recentes</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="az">A–Z</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Mais</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Duplicar</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

describe('DropdownMenu', () => {
  it('renders items, variants, checkbox, radio and submenu when open', () => {
    render(<Menu />)
    expect(screen.getByRole('menuitem', { name: /Editar/ })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Excluir' })).toHaveAttribute(
      'data-variant',
      'destructive',
    )
    expect(screen.getByRole('menuitemcheckbox', { name: 'Mostrar arquivados' })).toHaveAttribute(
      'data-state',
      'checked',
    )
    expect(screen.getByRole('menuitemradio', { name: 'Recentes' })).toHaveAttribute(
      'data-state',
      'checked',
    )
    // SubTrigger is itself a menuitem; its SubContent only mounts on open
    // (pointer-driven positioning), which is an app-level E2E concern.
    expect(screen.getByRole('menuitem', { name: 'Mais' })).toBeInTheDocument()
  })

  it('has no accessibility violations while open', async () => {
    render(<Menu />)
    await expectNoA11yViolations(document.body)
  })
})
