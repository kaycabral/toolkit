import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SidebarProvider } from './sidebar-core'
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from './sidebar-menu'
import { TooltipProvider } from './tooltip'

function Menu() {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <SidebarGroup>
          <SidebarGroupLabel>Operação</SidebarGroupLabel>
          <SidebarGroupAction aria-label="Adicionar">+</SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton variant="outline" size="lg" isActive tooltip="Agenda">
                  Agenda
                </SidebarMenuButton>
                <SidebarMenuAction showOnHover aria-label="Opções">
                  ⋯
                </SidebarMenuAction>
                <SidebarMenuBadge>3</SidebarMenuBadge>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton size="sm" isActive>
                      Hoje
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarProvider>
    </TooltipProvider>
  )
}

describe('SidebarMenu', () => {
  it('renders the button with its variant/active state, action, badge and submenu', () => {
    render(<Menu />)
    const button = screen.getByRole('button', { name: 'Agenda' })
    expect(button).toHaveAttribute('data-active', 'true')
    expect(button).toHaveAttribute('data-size', 'lg')
    expect(screen.getByRole('button', { name: 'Opções' })).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    // SidebarMenuSubButton renders a bare <a> (no href → no link role); query
    // by text and assert its data attributes.
    const sub = screen.getByText('Hoje')
    expect(sub).toHaveAttribute('data-slot', 'sidebar-menu-sub-button')
    expect(sub).toHaveAttribute('data-active', 'true')
    expect(sub).toHaveAttribute('data-size', 'sm')
  })

  it('renders the loading skeleton with an icon', () => {
    render(
      <SidebarProvider>
        <SidebarMenuSkeleton showIcon data-testid="sk" />
      </SidebarProvider>,
    )
    expect(screen.getByTestId('sk')).toHaveAttribute('data-sidebar', 'menu-skeleton')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Menu />)
    await expectNoA11yViolations(container)
  })
})
