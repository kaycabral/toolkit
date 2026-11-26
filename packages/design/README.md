# @cbrl/design

Design system for React apps on Radix primitives and Tailwind CSS v4:
shadcn-style components, an app shell with sidebar navigation, and design tokens
with an overridable brand.

```sh
pnpm add @cbrl/design next-themes react react-dom tailwindcss
```

## Setup

Import the stylesheet once, in the app's global CSS. It brings Tailwind, the
tokens, and an `@source` that makes Tailwind generate the classes used inside
this package.

```css
/* src/app/globals.css */
@import '@cbrl/design/globals.css';

/* Brand: redefine tokens, don't fork the package. */
:root {
  --primary: oklch(0.48 0.092 208);
  --primary-foreground: oklch(0.99 0.003 210);
}
```

Mount `ThemeProvider` (a client wrapper over `next-themes`, same props) and
`<Toaster />` in the root layout if you use dark mode or toasts. `next-themes`
is a peer dependency so the app and the toaster share one theme state.

```tsx
// src/app/layout.tsx
import { ThemeProvider, Toaster } from '@cbrl/design'

;<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
  {children}
  <Toaster />
</ThemeProvider>
```

## Usage

```tsx
import { Button, Input, Label } from '@cbrl/design'
```

Every client component ships with its `'use client'` directive, so the package
works from Server Components; the barrel itself is server-safe.

### Icons and helpers

`WhatsappIcon` (`currentColor`) and `GoogleIcon` (multicolor "G") are
decorative by default; pass `title` to give them an accessible name. Size them
with a class (`className="size-4"`).

`initials(primary, fallback?)` derives avatar-fallback initials: the first
letters of the first two words, or the first two characters of a single word,
or `'?'`.

```tsx
<AvatarFallback>{initials(user.name, user.email)}</AvatarFallback>
```

### App shell

`AppShell` renders the whole authenticated layout (collapsible sidebar with brand,
grouped navigation and footer, sticky header, content inset). Routing stays in
the app: you render each nav link, so the package never imports `next`.

```tsx
'use client'

import { AppShell as BaseAppShell, type NavSection } from '@cbrl/design'
import { LayoutDashboard } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const SECTIONS: readonly NavSection[] = [
  {
    label: 'Operations',
    items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, match: 'prefix' }],
  },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <BaseAppShell
      brand={<span className="text-base font-semibold">Acme</span>}
      sections={SECTIONS}
      pathname={usePathname()}
      renderNavLink={(item, { onNavigate, children: content }) => (
        <Link href={item.href} onClick={onNavigate}>
          {content}
        </Link>
      )}
    >
      {children}
    </BaseAppShell>
  )
}
```

The shell handles the `<nav aria-label>` landmark, the active item, closing the
mobile drawer and tooltips when collapsed. The sidebar primitives (`Sidebar`,
`SidebarProvider`, `SidebarMenu*`, `useSidebar`, …) are exported for custom shells.

### Settings dialog

`SettingsDialog` is the settings-modal shell: a section nav (a column from
`sm`, a sideways-scrolling strip on phones that keeps the active section in
view), a header with the active section's label and description, and a
scrolling content area. The app decides which sections a user sees and loads
each section's data; the dialog only renders `children` for the active one.
`useHashSection(prefix, keys?)` routes it through `#<prefix>/<section>`
(`hashchange` in, `history.replaceState` on switch and close):

```tsx
'use client'

import { SettingsDialog, useHashSection, type SettingsDialogSection } from '@cbrl/design'
import { CreditCard, User } from 'lucide-react'

type Key = 'profile' | 'billing'
const SECTIONS: readonly SettingsDialogSection<Key>[] = [
  { key: 'profile', label: 'Perfil', icon: User, description: 'Seu nome e foto.' },
  { key: 'billing', label: 'Cobrança', icon: CreditCard },
]

export function SettingsModal() {
  const { section, open, close } = useHashSection<Key>('settings', ['profile', 'billing'])
  return (
    <SettingsDialog
      open={section !== null}
      onOpenChange={(next) => !next && close()}
      sections={SECTIONS}
      value={section ?? 'profile'}
      onValueChange={open}
      navLabel="Seções de configuração"
    >
      {section === 'billing' ? <BillingPanel /> : <ProfilePanel />}
    </SettingsDialog>
  )
}
// Anywhere: <a href="#settings/billing">Cobrança</a>
```

Uncontrolled use: `defaultOpen`/`defaultValue`. Slots: `settings-dialog`,
`settings-dialog-nav`, `settings-dialog-content`.

## Compatibility contract

Breaking changes ship only as major versions (minor while `0.x`). The public
contract is:

- **Exports** of the package entry (guarded by a surface snapshot test).
- **`data-slot` attributes**: apps target them to restyle components.
- **`cva` default variants**: changing a default restyles every app.
- **Props**: new props are optional and default to the current behavior.

## Development

New components come from the shadcn CLI and must import Radix primitives from
`radix-ui`. Each component ships with a render test and an axe check
(`expectNoA11yViolations` from `@cbrl/testing/a11y`). `pnpm check:package` also
verifies that every `'use client'` module keeps its directive in `dist/`.

`src/shadcn.css` is vendored from shadcn (MIT) so consumers don't install the CLI.
