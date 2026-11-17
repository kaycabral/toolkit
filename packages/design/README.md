# @cbrl/design

Design system unificado do monorepo. Tokens canônicos + componentes shadcn/Radix mínimos compartilhados.

## Quem usa

- `templates/web/` — todo app novo herda este design system (via `pnpm run new:app`).
- `apps/imovil/` — pilot real.
- `apps/saas-manager/` — adotante.
- `apps/oilio/` — adotante (Sidebar nav + tokens via `@cbrl/design/globals.css`).

## Quem **não** usa (identidade própria documentada)

- `apps/cbrl.dev/` — landing institucional em construção.
- `apps/focusely/` — vibe warm/sage própria.
- `apps/gabar/web/` — design já entregue, vai migrar caso a caso.

## Regras de uso (apps adotantes)

- **Antes de criar componente**: cheque `packages/design/src/components/` primeiro. Se já existe lá, use de lá (regra DRY).
- **Promover componente pro design system**: só quando 2+ apps adotantes precisam do mesmo. Componentes com domínio (formulários de feature, dashboards específicos) ficam no app.

## Override de accent por produto

Cada app adotante pode redefinir `--accent` / `--accent-foreground` no próprio `globals.css` sem tocar no design system:

```css
:root {
  --accent: oklch(0.48 0.092 208); /* teal/petróleo (imovil) */
  --accent-foreground: oklch(0.99 0.003 210);
}
```

## Layout canônico — app shell + sidebar nav

Apps autenticados montam o shell via o componente **`AppShell`** (do `@cbrl/design`): sidebar colapsável (brand + nav agrupada + footer) + header sticky + conteúdo. O componente é dono da casca compartilhada; cada superfície injeta só o que difere (seções, brand, footer, ações de header).

- NavItems via `NavSection[]` + `isNavItemActive(item, pathname)` — todos canônicos no design package.
- Largura/landmark de conteúdo via `Main` (ver § "Largura de conteúdo" abaixo) — o shell só monta a casca; cada página renderiza o seu `<main>`.
- Padrão completo com snippets em § "Layout pattern" abaixo.

## Como consumir

```css
/* apps/<x>/src/app/globals.css */
@import '@cbrl/design/globals.css';

/* Override apenas o que for específico do produto: */
:root {
  --accent: oklch(0.48 0.092 208); /* teal/petróleo (imovil) */
  --accent-foreground: oklch(0.99 0.003 210);
}
```

```tsx
// apps/<x>/src/app/page.tsx
import { Button, Card, CardContent, cn } from '@cbrl/design'
```

## Preset

Tokens e componentes derivados do shadcn preset **`b0`**:

- `style`: `radix-nova` (compact padding/margin, density-friendly)
- `baseColor`: `neutral` (oklch grayscale)
- `iconLibrary`: `lucide`
- `font`: `inter` (apps importam via Next font ou similar)

Decoded com `npx shadcn@latest preset decode b0`. Configuração formal em `components.json`.

## Componentes incluídos (baseline)

- `AlertDialog` (+ subcomponentes; confirmação destrutiva, sem dismiss-on-outside)
- `Avatar` (+ `AvatarImage`, `AvatarFallback`, `AvatarGroup`, `AvatarGroupCount`, `AvatarBadge`)
- `Badge` (+ `badgeVariants`)
- `Breadcrumb` (+ `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`, `BreadcrumbEllipsis`)
- `Button` (+ `buttonVariants`)
- `Card` (+ `CardHeader`, `CardContent`, `CardFooter`, `CardTitle`, `CardAction`, `CardDescription`)
- `Checkbox`
- `Collapsible` (+ `CollapsibleTrigger`, `CollapsibleContent`)
- `Dialog` (full Radix-based, sem `@base-ui/react`)
- `DropdownMenu` (+ todos os subcomponentes)
- `Field` (+ `FieldSet`, `FieldLegend`, `FieldGroup`, `FieldContent`, `FieldLabel`, `FieldTitle`, `FieldDescription`, `FieldSeparator`, `FieldError`)
- `Input`
- `InputGroup` (+ `InputGroupInput`, `InputGroupAddon`)
- `Label`
- `List` (data-driven; `items` + `renderItem` → linha com leading (`avatar`/`icon` no squircle `ListItemMedia`) + título/badge/descrição + `meta` + valor (`trailing`/`trailingHint`) + `actions` (⋯); container card-like por padrão (`bordered`); estados vazio/loading embutidos; primitivos `ListItem*` + `listVariants`/`listItemVariants` pro escape hatch)
- `Popover` (+ `PopoverTrigger`, `PopoverContent`)
- `Select` (+ todos os subcomponentes)
- `Separator`
- `Sheet`
- `Sidebar` (+ todo o conjunto: `SidebarProvider`, `SidebarHeader`, `SidebarContent`, `SidebarFooter`, `SidebarGroup`, `SidebarGroupLabel`, `SidebarGroupContent`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarMenuSub*`, `SidebarTrigger`, `SidebarRail`, `SidebarInset`, `useSidebar`)
- `AppShell` (casca composta: sidebar + header + conteúdo; ver § "Layout pattern")
- `UserMenu` (+ `userMenuInitials`) — menu de conta no topo à direita (avatar + dropdown de identidade); ações via children, wiring de logout no app
- `Skeleton`
- `Switch`
- `Table` (+ `TableHeader`, `TableBody`, `TableFooter`, `TableHead`, `TableRow`, `TableCell`, `TableCaption`)
- `Tabs` (+ `TabsList`, `TabsTrigger`, `TabsContent`)
- `Textarea`
- `Toaster` (sonner wrapper)
- `Tooltip` (+ `TooltipProvider`, `TooltipTrigger`, `TooltipContent`)
- `Typography` (+ `typographyVariants`; headings/lead/muted/code — usar no lugar de `<h1>` cru)
- `cn` helper (`twMerge(clsx(...))`)
- Nav helpers: `NavItem` / `NavSection` types + `isNavItemActive` / `hasActiveNavChild`

> A lista pública completa de exports é fixada por snapshot em `src/index.test.ts` — adição cresce o snapshot, remoção falha o teste.

## Layout pattern: app shell + sidebar nav (canônico)

Use o componente **`AppShell`**: ele monta toda a casca (TooltipProvider + SidebarProvider + Sidebar com header/content/footer/rail + SidebarInset com header sticky). O app vira um wrapper fino que injeta o que difere. **Routing fica fora do design** (o package não depende de `next`): o item de nav é renderizado pelo consumidor via `renderNavLink`, então `next/link` nunca vaza pra cá.

```tsx
// apps/<x>/src/app/(app)/_components/app-shell.tsx
'use client'

import { AppShell as BaseAppShell } from '@cbrl/design'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_SECTIONS } from './nav-items'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <BaseAppShell
      brand={<span className="text-base font-semibold">Minha marca</span>}
      sections={NAV_SECTIONS}
      pathname={pathname}
      renderNavLink={(item, { onNavigate, children: content }) => (
        <Link href={item.href} onClick={onNavigate}>
          {content}
        </Link>
      )}
      headerStart={/* context switcher (opcional) */ null}
      headerEnd={/* <UserMenu>, notifications, theme toggle — topo à direita */ null}
    >
      {/* SidebarInset é <div>; o `<main>` é da página, via `Main`. */}
      {children}
    </BaseAppShell>
  )
}
```

O `AppShell` resolve internamente: o landmark `<nav aria-label>`, o highlight ativo (`isNavItemActive`), o ícone+label de cada item, o fechamento do drawer mobile (`onNavigate`), e o tooltip no modo colapsado. O consumidor só fornece dados + como virar link.

```ts
// apps/<x>/src/app/(app)/_components/nav-items.ts
import type { NavSection } from '@cbrl/design'
import { LayoutDashboard, Users /* ... */ } from 'lucide-react'

export const NAV_SECTIONS: readonly NavSection[] = [
  {
    label: 'Operação',
    items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, match: 'prefix' }],
  },
  {
    label: 'Cadastros',
    items: [
      /* ... */
    ],
  },
  {
    label: 'Configuração',
    items: [
      /* ... */
    ],
  },
]
```

**Regras:**

- **Seções fixas** no app de tenant: `Operação`, `Cadastros`, `Configuração`. Outras superfícies (ex.: área do cliente `/me`) passam suas próprias seções. Seção com `label: ''` não renderiza heading de grupo.
- **`collapsible`** (default `icon`) — o sidebar colapsa mostrando só ícones; ajuste pela prop do `AppShell`.
- **Routing fora do design**: o link de cada item vem do `renderNavLink` do consumidor (o design não importa `next`). O landmark `<nav aria-label>`, o highlight ativo e o `setOpenMobile(false)` no clique já são do `AppShell` — não reimplemente.
- **Escape hatch**: para um shell fora do padrão, os primitivos (`Sidebar`, `SidebarProvider`, `SidebarMenu*`, `useSidebar`, …) continuam exportados; mas a casca canônica é o `AppShell`.

Adotantes hoje: `apps/oilio` — shell do app de tenant (`(app)/`) e shell do cliente (`/me`), ambos sobre o mesmo `AppShell`. Migrar `apps/imovil`/`apps/saas-manager` quando agendar.

### Largura de conteúdo — `Main`

`Main` é o **único `<main>`** da árvore (o shell só monta `<header>` + sidebar; a página renderiza o seu `Main`). Resolve o landmark semântico e centraliza a largura num conjunto fechado de variantes — páginas escolhem _que tipo_ de página são, nunca um `max-w-*` cru, então toda rota alinha:

```tsx
// página = casca-fina; escolhe a largura semântica
import { Main } from '@cbrl/design'

export default function Page() {
  return <Main width="narrow">{/* conteúdo */}</Main>
}
```

**Toda tela compartilha o mesmo frame externo — a largura das listas (`max-w-7xl`), centralizada.** Assim o left-edge do conteúdo coincide entre lista, form e detalhe: navegar de uma lista pra um form não desloca o início do conteúdo. A variante `width` controla apenas a **coluna de conteúdo** _dentro_ desse frame:

| `width`   | coluna      | Uso                                                                                                |
| --------- | ----------- | -------------------------------------------------------------------------------------------------- |
| `default` | preenche    | Listas, tabelas, dashboards, leitura geral (padrão)                                                |
| `narrow`  | `max-w-2xl` | Forms e conteúdo curto — coluna estreita **alinhada à esquerda** (nunca esticada nem centralizada) |
| `full`    | sem frame   | Telas full-bleed (sem cap, sem centralização)                                                      |

`narrow` **não encolhe nem centraliza o `<main>`** — o frame é idêntico ao `default`; só a coluna interna ganha o cap, ancorada à esquerda. Um field de form nunca estica até o fim da tela, e ainda assim começa na mesma margem de uma lista.

`Main` já aplica `p-6`, `flex-1`, `w-full` e o `mx-auto` do frame, e embrulha o conteúdo numa coluna (`data-slot="main-content"`) onde a `className` da página é aplicada. **Não** reintroduza `max-w-*`/`mx-auto` nas páginas — a variante é a única fonte da largura. Precisa de outro tier? Mude o `mainVariants`/`contentVariants` (1 lugar), nunca um `max-w-*` solto numa página.

## Adicionando componente novo

Regra: **2+ apps adotantes precisam usar** antes de promover. Componente novo nasce em `apps/<x>/src/components/ui/` e sobe pra cá quando uma 2ª adotante (ex.: novo app via template) precisar.

**Todo componente que entra leva teste na mesma MR.** O package roda um ratchet de cobertura (`vitest.config.ts`, `autoUpdate` só-sobe): adicionar componente sem teste dilui o pacote e derruba o floor. Cobrir ≠ inflar — segue os tiers abaixo.

## Testes

`pnpm --filter @cbrl/design test` (vitest + jsdom + Testing Library). Cobertura por **tier**, proporcional ao valor — não se persegue 100% cego em wrapper de Radix:

| Tier                      | O que é                                                                           | O que testar                                                                                          |
| ------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Lógica pura**           | `lib/nav.ts`, `lib/cn.ts`, `hooks/use-mobile.ts`                                  | Exaustivo, incluindo branches.                                                                        |
| **Comportamento próprio** | variantes (`cva`), estado, slots (`Typography`, `EmptyState`, `Sidebar`, `Field`) | Render + variantes + interação (`userEvent`).                                                         |
| **Wrapper fino de Radix** | re-export quase puro (`Separator`, `Select`, `AlertDialog`, `Checkbox`)           | Smoke render + `expectNoA11yViolations` — o comportamento já é coberto pelo Radix e por E2E nos apps. |

**Acessibilidade**: todo componente com árvore renderizável roda axe via `expectNoA11yViolations` de `@cbrl/testing/a11y` (helper compartilhado). Design system é onde a11y paga — uma violação aqui propaga pra todo app consumidor.

```tsx
import { expectNoA11yViolations } from '@cbrl/testing/a11y'

const { container } = render(<Button>Salvar</Button>)
await expectNoA11yViolations(container)
```

Estado de open-on-portal (Radix `Select`/`DropdownMenu` abertos) depende de APIs de ponteiro que o jsdom não implementa — esse caminho fica para o E2E de app, não para o unit aqui.

## Contrato de evolução (crescer sem quebrar)

Este package é interface pública pra todo app adotante. A regra é **aditivo por padrão, breaking só consciente** — nunca um break que escapa num PR de adição ou ajuste simples.

O que conta como **contrato** (mudar = breaking, exige decisão deliberada):

- **Exports do `index.ts`** — remover/renomear quebra imports. Guardado por `src/index.test.ts` (snapshot da superfície: adição cresce o snapshot via `-u`; remoção **falha o teste**). Types saem no runtime → guardados pelo `tsc` dos consumidores.
- **`data-slot="..."`** — é hook de estilo que apps usam pra override/rebrand no `globals.css` deles. Renomear é breaking silencioso.
- **`defaultVariants` do `cva`** — trocar o default re-estiliza todo mundo de uma vez. Variante nova é aditiva; mudar o default é breaking.
- **Props existentes** — não remover nem mudar semântica/tipo. Prop nova nasce **opcional com default** que preserva o comportamento atual.

Quando um break **vale a pena** (contrato melhor, resiliência, DRY real), a hora é fazer de uma vez, cross-package, atualizando todos os call-sites no mesmo PR — não deixar drift. O guard existe pra tornar o break visível, não pra proibi-lo.

## Não está no escopo

- Storybook ou catálogo visual (over-engineering pra estúdio solo).
- Componentes específicos de domínio (forms de imóvel, dashboards) — ficam no app.
- Animation lib custom (use `tw-animate-css` quando precisar).
- Sistema de ícones próprio (lucide-react é canônico).

## Stack

- Tailwind CSS v4 (`@theme` em CSS, não config JS)
- shadcn sobre `@radix-ui/react-*` (Base UI **proibido**)
- class-variance-authority + clsx + tailwind-merge
- lucide-react (ícones)
- sonner (toast)
