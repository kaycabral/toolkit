'use client'

import * as React from 'react'

import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu'

// Up-to-two-letter initials from the best available identity string (name →
// secondary → "?"). Exported so consumers can reuse the exact same derivation
// elsewhere (e.g. a profile header) instead of re-implementing it.
export function userMenuInitials(name: string | null, secondary: string | null): string {
  const source = name?.trim() || secondary?.trim() || ''
  if (!source) return '?'
  const parts = source.split(/[\s@.]+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const second = parts[1]?.[0] ?? ''
  return (first + second).toUpperCase() || '?'
}

export type UserMenuProps = {
  /** Primary identity line (display name). */
  name: string | null
  /** Secondary identity line (email / handle). */
  secondary?: string | null
  /** Avatar image; falls back to initials when absent. */
  avatarUrl?: string | null
  /** Accessible label for the avatar trigger (localize per app). */
  triggerLabel?: string
  /** Dropdown alignment relative to the trigger. */
  align?: React.ComponentProps<typeof DropdownMenuContent>['align']
  /** Account actions (`DropdownMenuItem`…) under the identity header. Sign-out
   * and any links are wired by the consumer — this component is presentation. */
  children: React.ReactNode
}

// Account menu: a compact avatar button anchored at the header's right edge
// (Google-style) that opens a dropdown with the identity header + the consumer's
// account actions. Presentation only — auth/routing wiring stays in the app and
// is injected as `children`. The avatar is the design's `default` size (32px —
// the same size Google and most apps use for the account avatar) inside a
// slightly larger ghost target (`icon-lg`, 36px) for a subtle hover ring, both
// on-scale tokens. Mirrors `AppShell`: shared chrome, injected behavior.
export function UserMenu({
  name,
  secondary = null,
  avatarUrl = null,
  triggerLabel = 'Account',
  align = 'end',
  children,
}: UserMenuProps) {
  return (
    // Non-modal: a user menu must not lock body scroll (Radix's modal default
    // applies react-remove-scroll, which under a document-scroll layout made the
    // sticky header vanish). Harmless belt-and-suspenders now that the shell is
    // viewport-locked, and correct UX regardless.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="rounded-full" aria-label={triggerLabel}>
          <Avatar size="default">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={name ?? secondary ?? ''} /> : null}
            <AvatarFallback>{userMenuInitials(name, secondary)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-56">
        {name || secondary ? (
          <>
            <DropdownMenuLabel className="flex flex-col gap-1 font-normal">
              {name ? <span className="text-sm font-medium">{name}</span> : null}
              {secondary ? (
                <span className="text-muted-foreground truncate text-xs">{secondary}</span>
              ) : null}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        ) : null}
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
