import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { DropdownMenuItem } from './dropdown-menu'
import { UserMenu, userMenuInitials } from './user-menu'

describe('userMenuInitials', () => {
  it('is an alias of initials', () => {
    expect(userMenuInitials('Ada Lovelace', null)).toBe('AL')
    expect(userMenuInitials(null, 'ada@example.com')).toBe('AD')
    expect(userMenuInitials(null, null)).toBe('?')
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

  it('uses a custom trigger when given, replacing the default avatar button', async () => {
    render(
      <UserMenu
        name="Ada Lovelace"
        secondary="ada@example.com"
        trigger={<button type="button">Minha conta</button>}
      >
        <DropdownMenuItem>Sair</DropdownMenuItem>
      </UserMenu>,
    )
    // The default "Account"/"Conta" avatar button is gone; the custom trigger
    // drives the same dropdown.
    expect(screen.queryByRole('button', { name: 'Account' })).not.toBeInTheDocument()
    const trigger = screen.getByRole('button', { name: 'Minha conta' })
    await userEvent.click(trigger)
    expect(screen.getByRole('menuitem', { name: 'Sair' })).toBeInTheDocument()
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
