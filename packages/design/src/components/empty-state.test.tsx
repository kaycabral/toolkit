import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { EmptyState } from './empty-state'

describe('EmptyState', () => {
  it('renders the title and nothing optional by default', () => {
    render(<EmptyState title="Nenhuma unidade cadastrada" />)
    expect(screen.getByText('Nenhuma unidade cadastrada')).toBeInTheDocument()
    // No description, no icon, no button when only a title is given.
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('renders the description and icon when provided', () => {
    render(
      <EmptyState
        title="Nenhum serviço"
        description="Cadastre seu primeiro serviço para começar a agendar."
        icon={<svg data-testid="icon" />}
      />,
    )
    expect(
      screen.getByText('Cadastre seu primeiro serviço para começar a agendar.'),
    ).toBeInTheDocument()
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('renders a link CTA when action.href is set', () => {
    render(
      <EmptyState
        title="Nenhuma unidade"
        action={{ label: 'Criar unidade', href: '/units/new' }}
      />,
    )
    const link = screen.getByRole('link', { name: 'Criar unidade' })
    expect(link).toHaveAttribute('href', '/units/new')
  })

  it('fires onClick when action.onClick is set', async () => {
    const onClick = vi.fn()
    render(<EmptyState title="Nenhum cliente" action={{ label: 'Novo cliente', onClick }} />)
    await userEvent.click(screen.getByRole('button', { name: 'Novo cliente' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders a custom action slot (e.g. a framework Link) over action', () => {
    render(
      <EmptyState
        title="Nenhum plano"
        actionSlot={<a href="/plans/new">Criar plano</a>}
        action={{ label: 'ignored', href: '/ignored' }}
      />,
    )
    const link = screen.getByRole('link', { name: 'Criar plano' })
    expect(link).toHaveAttribute('href', '/plans/new')
    expect(screen.queryByText('ignored')).not.toBeInTheDocument()
  })

  it('has no accessibility violations in its richest form', async () => {
    const { container } = render(
      <EmptyState
        title="Nenhum serviço"
        description="Cadastre seu primeiro serviço para começar a agendar."
        icon={<svg data-testid="icon" aria-hidden="true" />}
        action={{ label: 'Criar serviço', href: '/services/new' }}
      />,
    )
    await expectNoA11yViolations(container)
  })
})
