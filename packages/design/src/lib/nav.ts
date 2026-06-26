import type { LucideIcon } from 'lucide-react'

export type NavMatch = 'exact' | 'prefix'

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  match: NavMatch
  children?: NavItem[]
}

export type NavSection = {
  label: string
  items: NavItem[]
}

export function isActive(item: NavItem, pathname: string): boolean {
  // A nav href may carry a query (e.g. a pre-filtered link like
  // `/orders?status=open`); active-matching is purely about the path, so the
  // item stays highlighted on any query (or none) of that route.
  const queryIndex = item.href.indexOf('?')
  const path = queryIndex === -1 ? item.href : item.href.slice(0, queryIndex)
  if (item.match === 'exact') return pathname === path
  return pathname === path || pathname.startsWith(`${path}/`)
}

export function hasActiveChild(item: NavItem, pathname: string): boolean {
  return item.children?.some((c) => isActive(c, pathname)) ?? false
}
