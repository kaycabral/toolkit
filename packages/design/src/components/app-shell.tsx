'use client'

import * as React from 'react'

import { isActive, type NavItem, type NavSection } from '../lib/nav'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from './sidebar'
import { TooltipProvider } from './tooltip'

// Generic application shell: a collapsible sidebar (brand + grouped nav +
// footer) alongside a sticky top header and the page content. Centralizes the
// chrome every authenticated surface shares so each product/area only supplies
// what differs — its nav sections, brand, footer (account menu) and header
// actions. Routing stays out of the design system: the consumer renders each
// nav link via `renderNavLink`, so `next/link` (or any router) never leaks in.
// Mirrors the `List` promotion — the shape is shared; the data is injected.

export type AppShellNavLink = (
  item: NavItem,
  props: { onNavigate: () => void; children: React.ReactNode },
) => React.ReactNode

export type AppShellProps = {
  /** Brand block at the top of the sidebar (product/tenant name, logo). */
  brand: React.ReactNode
  /** Nav sections, already filtered/resolved by the consumer (RBAC, signals…). */
  sections: NavSection[]
  /** Current pathname — drives the active nav highlight. */
  pathname: string
  /** Renders the link element wrapping an item's icon+label (keeps routing out). */
  renderNavLink: AppShellNavLink
  /** Sidebar footer — typically the account/user menu. */
  footer?: React.ReactNode
  /** Left of the top header, after the trigger (e.g. a context switcher). */
  headerStart?: React.ReactNode
  /** Right of the top header (e.g. notifications). */
  headerEnd?: React.ReactNode
  /** Sidebar collapse behavior. Defaults to `icon`. */
  collapsible?: React.ComponentProps<typeof Sidebar>['collapsible']
  /** Accessible label for the nav landmark. Defaults to `Navegação principal`. */
  navLabel?: string
  children: React.ReactNode
}

export function AppShell({
  brand,
  sections,
  pathname,
  renderNavLink,
  footer,
  headerStart,
  headerEnd,
  collapsible = 'icon',
  navLabel = 'Navegação principal',
  children,
}: AppShellProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <Sidebar collapsible={collapsible}>
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2 py-1.5">{brand}</div>
          </SidebarHeader>
          <SidebarContent>
            <ShellNav
              sections={sections}
              pathname={pathname}
              renderNavLink={renderNavLink}
              navLabel={navLabel}
            />
          </SidebarContent>
          {footer ? <SidebarFooter>{footer}</SidebarFooter> : null}
          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          {/* Static header: first child of the viewport-locked flex-col inset, so
              it stays put without `sticky` (which broke under document-scroll +
              the Radix scroll-lock when a menu opened). `shrink-0` keeps its height. */}
          <header className="border-border bg-card/60 z-30 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur md:px-6">
            <SidebarTrigger />
            {headerStart}
            {headerEnd ? <div className="ml-auto">{headerEnd}</div> : null}
          </header>
          {/* The SOLE scroller. `overscroll-contain` stops a nested scroller (e.g.
              the agenda grid) from chaining its scroll out and yanking the page. */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}

function ShellNav({
  sections,
  pathname,
  renderNavLink,
  navLabel,
}: {
  sections: NavSection[]
  pathname: string
  renderNavLink: AppShellNavLink
  navLabel: string
}) {
  const { setOpenMobile } = useSidebar()
  const onNavigate = () => setOpenMobile(false)

  return (
    <nav aria-label={navLabel}>
      {sections.map((section) => (
        <SidebarGroup key={section.label}>
          {section.label ? <SidebarGroupLabel>{section.label}</SidebarGroupLabel> : null}
          <SidebarGroupContent>
            <SidebarMenu>
              {section.items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item, pathname)}
                    tooltip={item.label}
                  >
                    {renderNavLink(item, {
                      onNavigate,
                      children: (
                        <>
                          <item.icon />
                          <span>{item.label}</span>
                        </>
                      ),
                    })}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </nav>
  )
}
