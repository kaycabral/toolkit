'use client'

import * as React from 'react'

import { initials } from '../lib/initials'

import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu'

/**
 * @deprecated Use {@link initials}; this alias will be removed in the next minor.
 */
export function userMenuInitials(name: string | null, secondary: string | null): string {
  return initials(name, secondary)
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
  /** Custom trigger. When given, it replaces the default compact avatar button
   * (e.g. a wide sidebar-footer button showing avatar + name + email + chevron).
   * It is wrapped in `DropdownMenuTrigger asChild`, so it must forward props and
   * ref to a single focusable element. Defaults to the compact avatar button. */
  trigger?: React.ReactNode
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
  trigger,
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
        {trigger ?? (
          <Button variant="ghost" size="icon-lg" className="rounded-full" aria-label={triggerLabel}>
            <Avatar size="default">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={name ?? secondary ?? ''} /> : null}
              <AvatarFallback>{initials(name, secondary)}</AvatarFallback>
            </Avatar>
          </Button>
        )}
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
