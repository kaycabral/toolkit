import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from './sidebar'

// useIsMobile reads window.innerWidth; jsdom defaults to 1024 (desktop). Helper
// to drive the mobile branch and restore desktop afterwards.
function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width })
}

// matchMedia (needed by useIsMobile in SidebarProvider) is polyfilled globally
// in vitest.setup.ts.

function StateProbe() {
  const { state } = useSidebar()
  return <output aria-label="Sidebar state">{state}</output>
}

function Tree() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>Topo</SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Operação</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>Agenda</SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>Rodapé</SidebarFooter>
      </Sidebar>
      <SidebarTrigger />
      <StateProbe />
    </SidebarProvider>
  )
}

describe('Sidebar', () => {
  it('renders the provider tree with header, menu and footer', () => {
    render(<Tree />)
    expect(screen.getByText('Topo')).toBeInTheDocument()
    expect(screen.getByText('Operação')).toBeInTheDocument()
    expect(screen.getByText('Agenda')).toBeInTheDocument()
    expect(screen.getByText('Rodapé')).toBeInTheDocument()
  })

  it('starts expanded and collapses when the trigger is clicked', async () => {
    render(<Tree />)
    expect(screen.getByRole('status', { name: 'Sidebar state' })).toHaveTextContent('expanded')
    await userEvent.click(screen.getByRole('button', { name: /toggle sidebar/i }))
    expect(screen.getByRole('status', { name: 'Sidebar state' })).toHaveTextContent('collapsed')
  })

  it('toggles via the cmd/ctrl+b keyboard shortcut', async () => {
    render(<Tree />)
    expect(screen.getByRole('status', { name: 'Sidebar state' })).toHaveTextContent('expanded')
    await userEvent.keyboard('{Meta>}b{/Meta}')
    expect(screen.getByRole('status', { name: 'Sidebar state' })).toHaveTextContent('collapsed')
  })

  it('exposes useSidebar context to descendants', () => {
    render(<Tree />)
    // StateProbe rendered without throwing → the context is provided.
    expect(screen.getByRole('status', { name: 'Sidebar state' })).toBeInTheDocument()
  })

  it('has no accessibility violations when expanded', async () => {
    const { container } = render(<Tree />)
    await expectNoA11yViolations(container)
  })

  it('renders inset, rail, input and separator within the provider', () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarInput aria-label="Buscar" />
            <SidebarSeparator />
          </SidebarContent>
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <span>Conteúdo</span>
        </SidebarInset>
      </SidebarProvider>,
    )
    expect(screen.getByLabelText('Buscar')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /toggle sidebar/i })).toBeInTheDocument()
    expect(screen.getByText('Conteúdo')).toBeInTheDocument()
  })

  it('renders the non-collapsible variant as a plain container', () => {
    render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarContent>Fixo</SidebarContent>
        </Sidebar>
      </SidebarProvider>,
    )
    expect(screen.getByText('Fixo')).toBeInTheDocument()
  })

  it('renders the mobile sheet variant and opens it via the trigger', async () => {
    setViewportWidth(500)
    try {
      render(<Tree />)
      // Mobile drawer is closed at first → its content is not mounted.
      expect(screen.queryByText('Topo')).not.toBeInTheDocument()
      await userEvent.click(screen.getByRole('button', { name: /toggle sidebar/i }))
      // Toggling sets openMobile → the Sheet mounts the sidebar content.
      expect(await screen.findByText('Topo')).toBeInTheDocument()
    } finally {
      setViewportWidth(1024)
    }
  })
})
