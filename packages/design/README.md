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

### Avatar group

`AvatarGroup` overlaps its avatars. Pass `max` to show the first N and collapse
the rest into a "+K" `AvatarGroupCount` (accessible name `"K more"`, override
with `overflowLabel`). Without `max` it renders every child, as before.

```tsx
<AvatarGroup max={3} overflowLabel={(n) => `mais ${n} pessoas`}>
  {members.map((m) => (
    <Avatar key={m.id}>
      <AvatarImage src={m.avatarUrl} alt={m.name} />
      <AvatarFallback>{initials(m.name)}</AvatarFallback>
    </Avatar>
  ))}
</AvatarGroup>
```


### Status

`StatusDot` is a small status indicator: `tone` (`success`, `warning`,
`destructive`, `info`, `muted`), `size` (`sm`, `default`, `lg`) and an optional
`pulse` ring (off under reduced motion). Give it a `label` when nothing next to
it says the status; without one it is decorative (`aria-hidden`).

```tsx
<span className="flex items-center gap-2">
  <StatusDot tone="success" pulse /> Sincronizado
</span>
<StatusDot tone="destructive" label="Falha na sincronização" />
```

`Badge` has the same tones as tinted variants for status text:
`<Badge variant="success">Ativo</Badge>` (`warning`, `info`, and the existing
`destructive`, `secondary` for neutral).


### Button group

`ButtonGroup` joins related buttons into one control (shadcn's button-group):
inner borders and radii collapse, the focused button rises above its
neighbors, and `orientation="vertical"` stacks them. `ButtonGroupSeparator`
draws a divider (useful between same-variant buttons) and `ButtonGroupText`
holds a label or addon. Nest groups to space them (`gap-2`).

Split button (main action + menu of related actions):

```tsx
import {
  Button,
  ButtonGroup,
  ButtonGroupSeparator,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@cbrl/design'
import { ChevronDown } from 'lucide-react'

;<ButtonGroup aria-label="Salvar">
  <Button onClick={save}>Salvar</Button>
  <ButtonGroupSeparator />
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button size="icon" aria-label="Mais opções de salvar">
        <ChevronDown />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onSelect={saveAsDraft}>Salvar como rascunho</DropdownMenuItem>
      <DropdownMenuItem onSelect={saveAndNew}>Salvar e criar outro</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</ButtonGroup>
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
