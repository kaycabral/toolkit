import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CalendarDays, CreditCard } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'

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
  it('lets the app control the expanded state', async () => {
    const onOpenChange = vi.fn()
    render(
      <AppShell
        brand={<span>Minha conta</span>}
        sections={sections}
        pathname="/me/appointments"
        renderNavLink={renderNavLink}
        open={false}
        onOpenChange={onOpenChange}
      >
        <main>conteúdo</main>
      </AppShell>,
    )
    await userEvent.click(screen.getAllByRole('button', { name: 'Toggle Sidebar' })[0]!)
    // Controlled and collapsed: the toggle asks the app to expand it.
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })

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

  // Regression #1374 + blank-footer follow-up — below the mobile breakpoint the
  // sidebar (and its `footer` account menu) folds off-canvas, so the shell
  // surfaces a separate compact `account` menu in the header. CRITICAL: that
  // header menu is gated on the SAME `useIsMobile()` signal the sidebar uses to
  // fold — NOT a CSS `md:` query. On a real phone `window.innerWidth` and the CSS
  // `@media (min-width:768px)` disagree by a pixel at the boundary; a CSS-gated
  // header menu could hide (CSS=desktop) at the exact width the sidebar already
  // folded (JS=mobile), leaving NO account menu and a blank footer. One source of
  // truth: the header account menu renders iff `isMobile`, in lockstep with the
  // sidebar. Below asserts both regimes by driving `window.innerWidth` — the JS
  // width `useIsMobile()` reads (`window.innerWidth < 768`).
  const setViewportWidth = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: width,
    })
  }

  it('mostra o menu de conta compacto no header quando mobile (#1374)', () => {
    // < 768 → useIsMobile() === true.
    setViewportWidth(400)
    render(
      <AppShell
        brand={<span>Marca</span>}
        sections={sections}
        pathname="/x"
        renderNavLink={renderNavLink}
        footer={<span>Conta ampla (sidebar)</span>}
        account={<button type="button">Conta compacta</button>}
        headerEnd={<span>sinos</span>}
      >
        <main>x</main>
      </AppShell>,
    )

    // The compact account trigger is present inside the header (role `banner`), so
    // the account menu stays reachable while the sidebar footer is off-canvas.
    const header = within(screen.getByRole('banner'))
    expect(header.getByRole('button', { name: 'Conta compacta' })).toBeInTheDocument()
  })

  it('não duplica o menu de conta no header quando desktop — a sidebar o detém (#1374)', () => {
    // >= 768 → useIsMobile() === false.
    setViewportWidth(1200)
    render(
      <AppShell
        brand={<span>Marca</span>}
        sections={sections}
        pathname="/x"
        renderNavLink={renderNavLink}
        footer={<span>Conta ampla (sidebar)</span>}
        account={<button type="button">Conta compacta</button>}
        headerEnd={<span>sinos</span>}
      >
        <main>x</main>
      </AppShell>,
    )

    // On desktop the sidebar footer owns the account menu, so the header does NOT
    // render a second (compact) copy.
    expect(screen.queryByRole('button', { name: 'Conta compacta' })).not.toBeInTheDocument()
  })

  it('renders no header account slot when `account` is omitted (#1374)', () => {
    // Even on mobile (where the header WOULD surface a compact account menu), with
    // no `account` slot the header carries no account menu and the wide sidebar
    // footer never leaks into it.
    setViewportWidth(400)
    render(
      <AppShell
        brand={<span>Marca</span>}
        sections={sections}
        pathname="/x"
        renderNavLink={renderNavLink}
        footer={<button type="button">Conta ampla (sidebar)</button>}
        headerEnd={<span>sinos</span>}
      >
        <main>x</main>
      </AppShell>,
    )
    const header = within(screen.getByRole('banner'))
    expect(header.queryByRole('button', { name: 'Conta ampla (sidebar)' })).not.toBeInTheDocument()
  })
})
