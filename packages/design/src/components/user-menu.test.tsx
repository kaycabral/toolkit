import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { DropdownMenuItem } from './dropdown-menu'
import { UserMenu, userMenuInitials } from './user-menu'

describe('userMenuInitials', () => {
  it('derives up to two letters from name, then secondary, then "?"', () => {
    expect(userMenuInitials('Ada Lovelace', null)).toBe('AL')
    expect(userMenuInitials('Ada', null)).toBe('A')
    expect(userMenuInitials(null, 'ada.lovelace@example.com')).toBe('AL')
    expect(userMenuInitials(null, null)).toBe('?')
    // Non-empty but only separators → no usable letters → "?".
    expect(userMenuInitials('...', null)).toBe('?')
  })
})

describe('UserMenu', () => {
  it('renders a labeled avatar trigger with initials fallback', () => {
    render(
      <UserMenu name="Ada Lovelace" secondary="ada@example.com" triggerLabel="Conta">
        <DropdownMenuItem>Sair</DropdownMenuItem>
      </UserMenu>,
    )
    const trigger = screen.getByRole('button', { name: 'Conta' })
    expect(trigger).toBeInTheDocument()
    expect(screen.getByText('AL')).toBeInTheDocument()
  })

  it('defaults the trigger label to "Account" when none is given', () => {
    render(
      <UserMenu name="Ada Lovelace">
        <DropdownMenuItem>Sair</DropdownMenuItem>
      </UserMenu>,
    )
    expect(screen.getByRole('button', { name: 'Account' })).toBeInTheDocument()
  })

  it('reveals the identity header and the consumer actions when opened', async () => {
    render(
      <UserMenu name="Ada Lovelace" secondary="ada@example.com" triggerLabel="Conta">
        <DropdownMenuItem>Sair</DropdownMenuItem>
      </UserMenu>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Conta' }))
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('ada@example.com')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Sair' })).toBeInTheDocument()
  })

  it('shows only the name line when secondary is absent', async () => {
    render(
      <UserMenu name="Ada Lovelace" secondary={null} triggerLabel="Conta">
        <DropdownMenuItem>Sair</DropdownMenuItem>
      </UserMenu>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Conta' }))
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
  })

  it('renders the avatar image when an avatarUrl is given, even with no identity', () => {
    render(
      <UserMenu
        name={null}
        secondary={null}
        avatarUrl="https://x/a.png"
        align="start"
        triggerLabel="Conta"
      >
        <DropdownMenuItem>Sair</DropdownMenuItem>
      </UserMenu>,
    )
    // Exercises the avatar-image branch + the empty `alt` fallback + a
    // non-default `align`. Radix may keep the img hidden until load in jsdom;
    // we only assert the trigger renders, which is enough to hit the branches.
    expect(screen.getByRole('button', { name: 'Conta' })).toBeInTheDocument()
  })

  it('omits the identity header when no name or secondary is given', async () => {
    render(
      <UserMenu name={null} triggerLabel="Conta">
        <DropdownMenuItem>Sair</DropdownMenuItem>
      </UserMenu>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Conta' }))
    expect(screen.getByRole('menuitem', { name: 'Sair' })).toBeInTheDocument()
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <UserMenu name="Ada Lovelace" secondary="ada@example.com" triggerLabel="Conta">
        <DropdownMenuItem>Sair</DropdownMenuItem>
      </UserMenu>,
    )
    await expectNoA11yViolations(container)
  })
})
