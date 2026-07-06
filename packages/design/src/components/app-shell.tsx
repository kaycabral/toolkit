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
  /** Sidebar footer — typically the account/user menu (wide trigger: avatar +
   * identity + chevron). Lives at the bottom of the sidebar on `md+`. */
  footer?: React.ReactNode
  /** Compact account menu for the mobile header. Below `md` the sidebar (and its
   * `footer`) is off-canvas, so the account/Settings/Sign-out menu is otherwise
   * unreachable without opening the nav sheet (#1374). This slot surfaces the
   * SAME menu in the header — but as its COMPACT trigger (a bare avatar button),
   * not the wide sidebar footer, which would overflow a phone header. Rendered
   * `md:hidden`; on `md+` the sidebar `footer` owns the account menu. */
  account?: React.ReactNode
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
  account,
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
          {/* Static header: first child of the viewport-locked flex-col inset,
              so it stays put without `sticky` (the document does not scroll —
              see the inner-scroll contract in SidebarProvider). `shrink-0`
              keeps its height. */}
          <header className="border-border bg-card/60 z-30 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur md:px-6">
            <SidebarTrigger />
            {headerStart}
            {/* Everything from here is right-aligned (the spacer pushes it over)
                regardless of whether footer/headerEnd are present. */}
            <div className="ml-auto flex items-center gap-2">
              {/* Below `md`, the sidebar (and its footer account menu) collapses
                  off-canvas behind the trigger, leaving no way to reach the
                  account/Settings/Sign-out menu without opening the nav sheet
                  (#1374). Surface the account menu here on mobile only — as its
                  COMPACT trigger (`account`), never the wide sidebar `footer`,
                  which would overflow a phone header. On `md+` the sidebar footer
                  owns it and this copy is hidden. */}
              {account ? <div className="flex items-center md:hidden">{account}</div> : null}
              {headerEnd}
            </div>
          </header>
          {/* The SOLE content scroller (the document does not scroll — see the
              inner-scroll contract in SidebarProvider). `overscroll-contain`
              stops a nested scroller (e.g. the agenda grid) from chaining out
              and yanking the shell. */}
          <div data-slot="app-scroll" className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {children}
          </div>
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
