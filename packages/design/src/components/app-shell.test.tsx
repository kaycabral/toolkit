import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CalendarDays, CreditCard } from 'lucide-react'
import { describe, expect, it } from 'vitest'

import { type NavItem, type NavSection } from '../lib/nav'
import { AppShell } from './app-shell'

const sections: NavSection[] = [
  {
    label: 'Conta',
    items: [
      { href: '/me/appointments', label: 'Meus agendamentos', icon: CalendarDays, match: 'prefix' },
      { href: '/me/subscriptions', label: 'Minhas assinaturas', icon: CreditCard, match: 'prefix' },
    ],
  },
]

// Render each nav item as a plain anchor — the consumer owns routing, the shell
// only supplies the icon+label content and the active/mobile behavior.
const renderNavLink = (
  item: NavItem,
  { onNavigate, children }: { onNavigate: () => void; children: React.ReactNode },
) => (
  <a href={item.href} onClick={onNavigate}>
    {children}
  </a>
)

function renderShell(pathname = '/me/appointments') {
  return render(
    <AppShell
      brand={<span>Minha conta</span>}
      sections={sections}
      pathname={pathname}
      renderNavLink={renderNavLink}
      footer={<span>Conta do usuário</span>}
      headerStart={<span>contexto</span>}
      headerEnd={<span>sinos</span>}
    >
      <main>conteúdo</main>
    </AppShell>,
  )
}

describe('AppShell', () => {
  it('renders the brand, nav links, footer and header slots', () => {
    renderShell()
    expect(screen.getByText('Minha conta')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /meus agendamentos/i })).toHaveAttribute(
      'href',
      '/me/appointments',
    )
    expect(screen.getByRole('link', { name: /minhas assinaturas/i })).toBeInTheDocument()
    expect(screen.getByText('Conta do usuário')).toBeInTheDocument()
    expect(screen.getByText('contexto')).toBeInTheDocument()
    expect(screen.getByText('sinos')).toBeInTheDocument()
    expect(screen.getByText('conteúdo')).toBeInTheDocument()
  })

  it('marks the link matching the current pathname as active', () => {
    renderShell('/me/subscriptions')
    expect(screen.getByRole('link', { name: /minhas assinaturas/i })).toHaveAttribute(
      'data-active',
      'true',
    )
    expect(screen.getByRole('link', { name: /meus agendamentos/i })).toHaveAttribute(
      'data-active',
      'false',
    )
  })

  it('labels the nav landmark', () => {
    renderShell()
    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument()
  })

  it('omits the footer region when no footer is given', () => {
    render(
      <AppShell
        brand={<span>Marca</span>}
        sections={sections}
        pathname="/x"
        renderNavLink={renderNavLink}
      >
        <main>x</main>
      </AppShell>,
    )
    expect(screen.queryByText('Conta do usuário')).not.toBeInTheDocument()
  })

  it('omits the group label when a section has none', () => {
    render(
      <AppShell
        brand={<span>Marca</span>}
        sections={[{ label: '', items: sections[0]!.items }]}
        pathname="/x"
        renderNavLink={renderNavLink}
      >
        <main>x</main>
      </AppShell>,
    )
    // The unlabeled group still renders its items, just no group heading.
    expect(screen.getByRole('link', { name: /meus agendamentos/i })).toBeInTheDocument()
  })

  it('runs the navigate callback when a nav link is activated', async () => {
    renderShell()
    // The shell wires onNavigate (mobile-close) into the rendered link's
    // onClick — activating it must not throw and keeps the link mounted.
    await userEvent.click(screen.getByRole('link', { name: /meus agendamentos/i }))
    expect(screen.getByRole('link', { name: /meus agendamentos/i })).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = renderShell()
    await expectNoA11yViolations(container)
  })

  // Regression #1374 — below `md` the sidebar (and its `footer` account menu) is
  // off-canvas, so the account/Settings/Sign-out menu was unreachable without
  // opening the nav sheet. The shell now surfaces a separate `account` slot in
  // the header, mobile-only (`md:hidden`), so the account menu stays reachable on
  // a phone/tablet. It is a DISTINCT node from `footer` (the header takes the
  // compact trigger, the sidebar keeps the wide one) — not the same node reused.
  it('renders the account slot in the header, hidden on md+ (#1374)', () => {
    const { container } = render(
      <AppShell
        brand={<span>Marca</span>}
        sections={sections}
        pathname="/x"
        renderNavLink={renderNavLink}
        footer={<span>Conta ampla (sidebar)</span>}
        account={<span data-testid="account-compact">Conta compacta</span>}
        headerEnd={<span>sinos</span>}
      >
        <main>x</main>
      </AppShell>,
    )

    // The compact account trigger is present…
    const account = screen.getByTestId('account-compact')
    // …inside the header (a `banner`/`<header>`), NOT the sidebar footer.
    const header = container.querySelector('header')
    expect(header).not.toBeNull()
    expect(header).toContainElement(account)

    // …wrapped in a mobile-only container so `md+` defers to the sidebar footer.
    const mobileWrapper = account.parentElement
    expect(mobileWrapper).toHaveClass('md:hidden')

    // …and it is a DISTINCT node from the wide sidebar footer (no reuse).
    expect(screen.getByText('Conta ampla (sidebar)')).toBeInTheDocument()
    expect(header).not.toContainElement(screen.getByText('Conta ampla (sidebar)'))
  })

  it('renders no header account slot when `account` is omitted (#1374)', () => {
    const { container } = render(
      <AppShell
        brand={<span>Marca</span>}
        sections={sections}
        pathname="/x"
        renderNavLink={renderNavLink}
        footer={<span>Conta do usuário</span>}
      >
        <main>x</main>
      </AppShell>,
    )
    // The wide sidebar footer must NOT leak into the header when there is no
    // dedicated compact `account` slot — the header simply has no account menu.
    const header = container.querySelector('header')
    expect(header).not.toBeNull()
    expect(header?.querySelector('.md\\:hidden')).toBeNull()
  })
})
