'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { Search } from 'lucide-react'
import { Slot } from 'radix-ui'
import * as React from 'react'

import { cn } from '../lib/cn'
import { EmptyState, type EmptyStateProps } from './empty-state'
import { InputGroup, InputGroupAddon, InputGroupInput } from './input-group'
import { Pagination, type PaginationProps } from './pagination'
import { Select, SelectContent, SelectItem, SelectTrigger } from './select'
import { Skeleton } from './skeleton'

// Generic listing component. The common listing shape across apps is a vertical
// stack of rows: a leading visual (avatar or icon) + content (title + optional
// status badge + description) + an optional middle meta column (date, category…)
// + an optional right-aligned value, and an overflow (⋯) actions menu. Consumers
// pass their data (`items`) and a per-item descriptor (`renderItem`) — they do
// NOT assemble rows by hand. Empty and loading states are built in. The
// low-level row primitives are exported too, for the rare surface that needs
// full control. Visual reference: shadcn "Recent transactions".

// ── Low-level primitives (escape hatch / internal building blocks) ──────────

const listVariants = cva('group/list flex flex-col', {
  variants: {
    // `bordered` (default) draws the card-like frame: a rounded border with
    // inset hairline separators between rows (the dividers don't touch the
    // frame — they breathe). `bordered={false}` is a plain spaced stack (e.g.
    // inside an existing Card).
    bordered: {
      true: 'overflow-hidden rounded-md border',
      false: 'gap-1',
    },
  },
  defaultVariants: {
    bordered: true,
  },
})

// Inset row divider for the bordered list: a bottom hairline that stops short of
// the frame on both sides (`inset-x-4`) so it never touches the rounded border.
// Hidden on the last row.
const BORDERED_ROW =
  'relative after:bg-border after:pointer-events-none after:absolute after:inset-x-4 after:bottom-0 after:h-px last:after:hidden'

// `min-h-16` (4rem / 64px) pins a uniform row height across every list so
// navigating between them doesn't flick. It's the nearest step on the spacing
// scale that clears a two-line row (leading size-9 + title + description, ~61px
// natural); a title-only row (e.g. customers) would otherwise render shorter.
// On-scale on purpose — no arbitrary `min-h-[…]`.
const listItemVariants = cva('flex min-h-16 items-center gap-3 px-4 py-3 text-sm', {
  variants: {
    // `interactive` rows respond to hover/focus and signal clickability — used
    // when a whole row is a link/button. Note: don't combine with the `actions`
    // slot (a ⋯ menu nested inside a row-level link is invalid).
    interactive: {
      true: 'hover:bg-accent/40 focus-visible:ring-ring/50 cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset',
      false: '',
    },
  },
  defaultVariants: {
    interactive: false,
  },
})

function ListItem({
  className,
  interactive = false,
  asChild = false,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof listItemVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'div'

  return (
    <Comp
      data-slot="list-item"
      data-interactive={interactive}
      className={cn(listItemVariants({ interactive }), className)}
      {...props}
    />
  )
}

// Squircle container for an icon-based leading visual (muted background, rounded
// square) — the shadcn "Recent transactions" look. Use for lists without photos
// (orders, plans, units…); for people, pass an `<Avatar>` via `leading` instead.
function ListItemMedia({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="list-item-media"
      className={cn(
        'bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4',
        className,
      )}
      {...props}
    />
  )
}

function ListItemLeading({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="list-item-leading"
      className={cn('flex shrink-0 items-center', className)}
      {...props}
    />
  )
}

function ListItemContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="list-item-content"
      // `min-w-0` lets the title/description truncate instead of overflowing the
      // row when the meta/value/actions compete for space.
      className={cn('flex min-w-0 flex-1 flex-col gap-0.5', className)}
      {...props}
    />
  )
}

function ListItemTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="list-item-title"
      className={cn('truncate text-sm leading-snug font-medium', className)}
      {...props}
    />
  )
}

function ListItemDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="list-item-description"
      className={cn('text-muted-foreground truncate text-xs', className)}
      {...props}
    />
  )
}

// Muted middle column — secondary metadata (date, category…). Hidden on narrow
// viewports to keep the row readable; the same info usually also lives in the
// description on mobile. Vertically centered (like the value/actions) so the
// whole right cluster aligns on one line.
function ListItemMeta({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="list-item-meta"
      className={cn('text-muted-foreground hidden shrink-0 text-xs sm:block', className)}
      {...props}
    />
  )
}

function ListItemTrailing({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="list-item-trailing"
      className={cn(
        'flex shrink-0 flex-col items-end text-sm font-semibold tabular-nums',
        className,
      )}
      {...props}
    />
  )
}

// The row's actions area. Holds the overflow (⋯) menu and, optionally, one or
// more EXPOSED quick-actions beside it (e.g. a WhatsApp shortcut) — the `gap`
// spaces them, so `actions` can be a single node or a fragment of several.
function ListItemActions({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="list-item-actions"
      className={cn('flex shrink-0 items-center gap-0.5', className)}
      {...props}
    />
  )
}

// ── Generic data-driven List (the API consumers use) ────────────────────────

/**
 * Per-item descriptor returned by `renderItem`. Every field except `title` is
 * optional, so the same component serves people lists (avatar) and object lists
 * (icon), with or without a trailing value.
 */
type ListItemDescriptor = {
  /** Raw leading visual — typically an `<Avatar>`. Takes precedence over `icon`. */
  leading?: React.ReactNode
  /** Icon rendered inside the muted squircle (`ListItemMedia`) — for object lists. */
  icon?: React.ReactNode
  /** Primary line. Required. */
  title: React.ReactNode
  /** Inline status pill shown next to the title (e.g. a `<Badge>`). */
  badge?: React.ReactNode
  /** Secondary muted line (contact, plan, item count…). */
  description?: React.ReactNode
  /** Muted middle column — secondary metadata such as a date. */
  meta?: React.ReactNode
  /** Right-aligned value (amount/price) — rendered bold + `tabular-nums`. */
  trailing?: React.ReactNode
  /** Small muted sub-line under the value (e.g. a discount). */
  trailingHint?: React.ReactNode
  /**
   * Row actions area — the overflow (⋯) menu and/or one or more exposed
   * quick-actions beside it. Pass a single node or a fragment of several; the
   * `ListItemActions` slot spaces them.
   */
  actions?: React.ReactNode
  /** Makes the whole row a link (only when there is no `actions` menu). */
  href?: string
  /** Makes the whole row a button (only when there is no `actions` menu). */
  onClick?: () => void
}

// Default sentinel value for a filter's "all / no filter" option.
const DEFAULT_FILTER_ALL_VALUE = 'all'
// Language-neutral default for the "all" option label; consumers localize it.
const DEFAULT_FILTER_ALL_LABEL = 'All'

/**
 * Search box config. Submit-on-Enter: the box keeps its own draft so typing is
 * instant, and only fires `onSearch` when the user presses Enter or clicks the
 * search icon — so a server-side consumer requeries once per search, not per
 * keystroke. `value` is the APPLIED query (e.g. read from a URL param); the
 * draft re-syncs to it whenever it changes from outside (navigation, clear).
 * Provide this config to opt into search; omit it for no search box.
 */
type ListSearchConfig = {
  /** The currently applied query (source of truth; seeds + re-syncs the draft). */
  value: string
  /** Fired with the trimmed draft on Enter / search-icon click. */
  onSearch: (value: string) => void
  /** Placeholder shown in the empty box. */
  placeholder?: string
  /** Accessible label (defaults to the placeholder, then "Search"). */
  ariaLabel?: string
}

/**
 * One filter dropdown (facet-filter pattern). Declarative + controlled: the List
 * renders a `<Select>` whose FIRST option is auto-generated from `label` and
 * means "all / no filter" (`allValue`) — so at rest the trigger reads as the
 * field name ("Horário") and selecting a value replaces it. The List does NOT
 * filter the data — the consumer applies the choice (server query, URL param…)
 * and passes back the already-filtered `items`.
 */
type ListFilterConfig = {
  /** Stable key (React key). */
  key: string
  /**
   * Field name. Doubles as the trigger's accessible name (`aria-label`) AND the
   * label of the auto-prepended "all" option shown at rest.
   */
  label: string
  /** Current selection — `allValue` when no filter is applied. */
  value: string
  /** Fired with the chosen option value (`allValue` for "all"). */
  onChange: (value: string) => void
  /**
   * The selectable values BEYOND "all" — the List prepends the "all" option
   * itself. Radix Select forbids an empty-string value, so use non-empty values.
   */
  options: readonly { value: string; label: string }[]
  /**
   * The value that means "no filter applied" (the prepended "all" option's
   * value, and the signal for filtered-empty vs truly empty). Defaults to `'all'`.
   */
  allValue?: string
  /**
   * Label of the prepended "all / no filter" option (e.g. "Todos"/"Todas"). It
   * is a real, distinct option — never the field name. Defaults to `'All'`
   * (consumers localize).
   */
  allLabel?: string
}

/** Pagination config — the controlled {@link Pagination} props, minus styling. */
type ListPaginationConfig = Omit<PaginationProps, 'className'>

/**
 * Empty-state content: the common `EmptyStateProps` (rendered as an
 * `<EmptyState>`) or a ready React element for a bespoke empty surface.
 */
type ListEmptyContent = EmptyStateProps | React.ReactElement

// An EmptyStateProps object isn't a valid element, so `isValidElement` cleanly
// tells the two union members apart.
function renderEmptyContent(content: ListEmptyContent, className?: string): React.ReactElement {
  if (React.isValidElement(content)) return content
  return <EmptyState {...content} className={className} />
}

type ListProps<T> = Omit<React.ComponentProps<'ul'>, 'children'> &
  VariantProps<typeof listVariants> & {
    /** The data to render. */
    items: readonly T[]
    /** Stable React key per item. */
    getKey: (item: T, index: number) => React.Key
    /** Maps an item to its visual descriptor. */
    renderItem: (item: T, index: number) => ListItemDescriptor
    /**
     * Element used to render rows that have an `href` (e.g. a router `<Link>`).
     * Receives `href`, `className` and `children`. Defaults to a plain `<a>`.
     */
    linkComponent?: React.ElementType
    /** When true, renders `loadingCount` skeleton rows instead of items. */
    loading?: boolean
    /** Number of skeleton rows while `loading`. Defaults to 3. */
    loadingCount?: number
    /** Whether skeleton rows include a leading square. Defaults to true. */
    loadingLeading?: boolean
    /**
     * Shown when `items` is empty and not loading. Either `EmptyStateProps` (the
     * common case → rendered as an `<EmptyState>`) or a ready React element for
     * surfaces whose empty state needs custom chrome (e.g. a server-action create
     * form). Omit to render nothing.
     */
    empty?: ListEmptyContent
    /**
     * Surface header (title + primary CTA). Rendered above the toolbar for the
     * populated, filtered-empty and loading states; hidden when truly empty so
     * the `empty` protagonist owns the screen.
     */
    header?: React.ReactNode
    /** Opt-in search box rendered in the toolbar above the list. */
    search?: ListSearchConfig
    /** Opt-in filter dropdowns rendered in the toolbar above the list. */
    filters?: readonly ListFilterConfig[]
    /** Opt-in pagination rendered below the list (self-hides for a single page). */
    pagination?: ListPaginationConfig
    /** Extra controls appended to the toolbar's filter cluster (escape hatch). */
    toolbarExtra?: React.ReactNode
    /**
     * Shown instead of `empty` when the list is empty WHILE a query is active
     * (search text or a non-default filter) — the toolbar stays so the user can
     * clear it. `EmptyStateProps` or a ready element. Defaults to a neutral "No
     * results" state. Ignored when no query is active (then `empty` wins).
     */
    filteredEmpty?: ListEmptyContent
    /**
     * Force the empty-vs-filtered-empty decision. By default the List infers an
     * active query from `search`/`filters` values; set this when the inference
     * is wrong (e.g. a default filter that already narrows the set).
     */
    isFiltered?: boolean
  }

function ListRowInner({
  leading,
  icon,
  title,
  badge,
  description,
  meta,
  trailing,
  trailingHint,
  actions,
}: ListItemDescriptor) {
  let leadingNode: React.ReactNode = null
  if (leading != null) leadingNode = <ListItemLeading>{leading}</ListItemLeading>
  else if (icon != null) leadingNode = <ListItemMedia>{icon}</ListItemMedia>

  return (
    <>
      {leadingNode}
      <ListItemContent>
        <ListItemTitle>{title}</ListItemTitle>
        {description != null ? <ListItemDescription>{description}</ListItemDescription> : null}
      </ListItemContent>
      {/* Status sits in the vertically-centered right cluster (with meta/value/
          actions), not on the title line — so everything to the right of the
          content aligns on one center line. */}
      {badge != null ? (
        <div data-slot="list-item-badge" className="flex shrink-0 items-center">
          {badge}
        </div>
      ) : null}
      {meta != null ? <ListItemMeta>{meta}</ListItemMeta> : null}
      {trailing != null ? (
        <ListItemTrailing>
          <span>{trailing}</span>
          {trailingHint != null ? (
            <span className="text-muted-foreground text-xs font-normal">{trailingHint}</span>
          ) : null}
        </ListItemTrailing>
      ) : null}
      {actions != null ? <ListItemActions>{actions}</ListItemActions> : null}
    </>
  )
}

function ListSkeletonRow({ leading, bordered }: { leading: boolean; bordered: boolean }) {
  return (
    <li
      aria-hidden
      className={cn(listItemVariants(), bordered && BORDERED_ROW)}
      data-slot="list-item"
    >
      {leading ? <Skeleton className="size-9 shrink-0 rounded-lg" /> : null}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="ml-auto h-3.5 w-12 shrink-0" />
    </li>
  )
}

// Search box with submit-on-Enter. Holds a local draft (instant typing) seeded
// from the applied `value` and re-synced whenever that changes from outside.
// The leading search icon is the submit button, so both Enter and a click apply
// the query.
function ListSearchBox({ value, onSearch, placeholder, ariaLabel }: ListSearchConfig) {
  const [draft, setDraft] = React.useState(value)
  React.useEffect(() => {
    setDraft(value)
  }, [value])

  const label = ariaLabel ?? placeholder ?? 'Search'

  return (
    <form
      role="search"
      className="w-full sm:max-w-xs"
      onSubmit={(event) => {
        event.preventDefault()
        onSearch(draft.trim())
      }}
    >
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <button type="submit" aria-label={label} className="flex items-center">
            <Search />
          </button>
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          aria-label={label}
        />
      </InputGroup>
    </form>
  )
}

// Toolbar above the list: an optional search box on the leading edge and an
// optional cluster of filter dropdowns (+ escape-hatch extras) on the trailing
// edge. Purely presentational and controlled — it forwards values up via the
// configs' callbacks and holds no state of its own (the search draft lives in
// ListSearchBox).
function ListToolbar({
  search,
  filters,
  toolbarExtra,
}: {
  search?: ListSearchConfig
  filters?: readonly ListFilterConfig[]
  toolbarExtra?: React.ReactNode
}) {
  const hasFilterCluster = (filters?.length ?? 0) > 0 || toolbarExtra != null

  return (
    <div
      data-slot="list-toolbar"
      className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
    >
      {search != null ? <ListSearchBox {...search} /> : null}

      {hasFilterCluster ? (
        <div className="flex shrink-0 items-center gap-2">
          {filters?.map((filter) => {
            const allValue = filter.allValue ?? DEFAULT_FILTER_ALL_VALUE
            const allLabel = filter.allLabel ?? DEFAULT_FILTER_ALL_LABEL
            const selected = filter.options.find((option) => option.value === filter.value)
            return (
              // Facet-filter pattern. The trigger reads as the FIELD NAME at rest
              // (it's a label, not a dropdown option) and as the chosen value once
              // picked. The "all / no filter" choice is a separate, explicit
              // option (`allLabel`) — never the field name, so it's never confused
              // for one. No stacked label, so every toolbar is one h-8 row that
              // aligns with the search box (no height flick between pages).
              // `aria-label` keeps the control named for assistive tech.
              <Select key={filter.key} value={filter.value} onValueChange={filter.onChange}>
                <SelectTrigger size="sm" aria-label={filter.label} className="min-w-36">
                  <span className="truncate">
                    {filter.value === allValue ? filter.label : (selected?.label ?? filter.label)}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={allValue}>{allLabel}</SelectItem>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          })}
          {toolbarExtra}
        </div>
      ) : null}
    </div>
  )
}

function List<T>({
  items,
  getKey,
  renderItem,
  linkComponent,
  loading = false,
  loadingCount = 3,
  loadingLeading = true,
  empty,
  header,
  search,
  filters,
  pagination,
  toolbarExtra,
  filteredEmpty,
  isFiltered,
  bordered = true,
  className,
  ...props
}: ListProps<T>) {
  const LinkComponent = linkComponent ?? 'a'
  // `bordered` is `boolean | null` via cva VariantProps; only an explicit
  // `false` opts out of the frame.
  const isBordered = bordered !== false

  const hasToolbar = search != null || (filters?.length ?? 0) > 0 || toolbarExtra != null
  const hasShell = hasToolbar || pagination != null || header != null

  const toolbar = hasToolbar ? (
    <ListToolbar search={search} filters={filters} toolbarExtra={toolbarExtra} />
  ) : null

  // Wraps toolbar + list + pagination into one stacked surface. Without any
  // shell control, the List stays a bare `<ul>` (or empty-state) as before, so
  // existing call-sites are untouched.
  const shell = (children: React.ReactNode): React.ReactNode =>
    hasShell ? (
      <div data-slot="list-root" className={cn('flex flex-col gap-4', className)}>
        {children}
      </div>
    ) : (
      children
    )

  const renderUl = (children: React.ReactNode): React.ReactNode => (
    <ul
      data-slot="list"
      data-bordered={isBordered}
      className={cn(listVariants({ bordered: isBordered }), !hasShell && className)}
      {...props}
    >
      {children}
    </ul>
  )

  if (loading) {
    const skeletons = Array.from({ length: loadingCount }, (_, i) => (
      <ListSkeletonRow key={i} leading={loadingLeading} bordered={isBordered} />
    ))
    return shell(
      <>
        <React.Fragment key="list-header">{header}</React.Fragment>
        {toolbar}
        {renderUl(skeletons)}
      </>,
    )
  }

  if (items.length === 0) {
    // A query is "active" when search has text or a filter differs from its
    // no-filter value — then an empty slice is `filtered-empty` (keep the
    // toolbar so the user can clear), not the create protagonist.
    const queryActive =
      isFiltered ??
      ((search?.value ?? '') !== '' ||
        (filters ?? []).some((f) => f.value !== (f.allValue ?? DEFAULT_FILTER_ALL_VALUE)))

    if (hasToolbar && queryActive) {
      return shell(
        <>
          <React.Fragment key="list-header">{header}</React.Fragment>
          {toolbar}
          {renderEmptyContent(filteredEmpty ?? { title: 'No results' })}
        </>,
      )
    }
    return empty != null ? renderEmptyContent(empty, cn(className)) : null
  }

  const rows = items.map((item, index) => {
    const descriptor = renderItem(item, index)
    const inner = <ListRowInner {...descriptor} />
    const interactiveClass = cn(listItemVariants({ interactive: true }))

    // `<li>` carries the listitem semantics; an interactive element nests
    // inside it (valid `ul > li > a`). A row with an `actions` menu stays
    // static — nesting the ⋯ button inside a row-level link is invalid.
    let row: React.ReactNode
    if (descriptor.actions == null && descriptor.href != null) {
      row = (
        <LinkComponent
          href={descriptor.href}
          data-slot="list-item"
          data-interactive
          className={interactiveClass}
        >
          {inner}
        </LinkComponent>
      )
    } else if (descriptor.actions == null && descriptor.onClick != null) {
      row = (
        <button
          type="button"
          onClick={descriptor.onClick}
          data-slot="list-item"
          data-interactive
          // A <button> sizes to its content and centers its text; the row must
          // span the <li> and read left-aligned like the link and static rows.
          className={cn(interactiveClass, 'w-full text-left')}
        >
          {inner}
        </button>
      )
    } else {
      row = (
        <div data-slot="list-item" className={cn(listItemVariants())}>
          {inner}
        </div>
      )
    }

    return (
      <li key={getKey(item, index)} className={cn(isBordered && BORDERED_ROW)}>
        {row}
      </li>
    )
  })

  return shell(
    <>
      <React.Fragment key="list-header">{header}</React.Fragment>
      {toolbar}
      {renderUl(rows)}
      {pagination != null ? <Pagination {...pagination} /> : null}
    </>,
  )
}

export {
  List,
  ListItem,
  ListItemActions,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemMedia,
  ListItemMeta,
  ListItemTitle,
  ListItemTrailing,
  listItemVariants,
  listVariants,
  type ListEmptyContent,
  type ListFilterConfig,
  type ListItemDescriptor,
  type ListPaginationConfig,
  type ListProps,
  type ListSearchConfig,
}
