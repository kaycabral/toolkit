import { Circle } from 'lucide-react'
import { describe, expect, it } from 'vitest'

import { hasActiveChild, isActive, type NavItem, type NavMatch } from './nav'

// The icon is irrelevant to the matching logic; a real lucide icon satisfies
// the NavItem type without a cast.
const icon = Circle

function item(href: string, match: NavMatch, children?: NavItem[]): NavItem {
  return { href, label: href, icon, match, children }
}

describe('isActive', () => {
  describe("match: 'exact'", () => {
    it('matches only the identical pathname', () => {
      expect(isActive(item('/clients', 'exact'), '/clients')).toBe(true)
    })

    it('does not match a deeper path', () => {
      expect(isActive(item('/clients', 'exact'), '/clients/42')).toBe(false)
    })

    it('does not match a different path', () => {
      expect(isActive(item('/clients', 'exact'), '/units')).toBe(false)
    })
  })

  describe("match: 'prefix'", () => {
    it('matches the identical pathname', () => {
      expect(isActive(item('/clients', 'prefix'), '/clients')).toBe(true)
    })

    it('matches a nested path under the href', () => {
      expect(isActive(item('/clients', 'prefix'), '/clients/42/edit')).toBe(true)
    })

    it('does not match a sibling that merely shares the prefix string', () => {
      // '/clients-archived' starts with '/clients' but is not under it.
      expect(isActive(item('/clients', 'prefix'), '/clients-archived')).toBe(false)
    })

    it('does not match an unrelated path', () => {
      expect(isActive(item('/clients', 'prefix'), '/units')).toBe(false)
    })

    it('ignores a query string on the href when matching the path', () => {
      // A pre-filtered link like `/orders?status=open` stays active on the route
      // regardless of the current (or absent) query.
      expect(isActive(item('/orders?status=open', 'prefix'), '/orders')).toBe(true)
      expect(isActive(item('/orders?status=open', 'prefix'), '/orders/42')).toBe(true)
      expect(isActive(item('/orders?status=open', 'prefix'), '/order')).toBe(false)
    })
  })
})

describe('hasActiveChild', () => {
  it('returns false when the item has no children', () => {
    expect(hasActiveChild(item('/settings', 'prefix'), '/settings/team')).toBe(false)
  })

  it('returns false when children is an empty array', () => {
    expect(hasActiveChild(item('/settings', 'prefix', []), '/settings')).toBe(false)
  })

  it('returns true when at least one child is active', () => {
    const parent = item('/settings', 'prefix', [
      item('/settings/billing', 'exact'),
      item('/settings/team', 'exact'),
    ])
    expect(hasActiveChild(parent, '/settings/team')).toBe(true)
  })

  it('returns false when no child matches', () => {
    const parent = item('/settings', 'prefix', [
      item('/settings/billing', 'exact'),
      item('/settings/team', 'exact'),
    ])
    expect(hasActiveChild(parent, '/settings/security')).toBe(false)
  })

  it('honours each child own match mode', () => {
    const parent = item('/settings', 'prefix', [item('/settings/team', 'prefix')])
    expect(hasActiveChild(parent, '/settings/team/invite')).toBe(true)
  })
})
