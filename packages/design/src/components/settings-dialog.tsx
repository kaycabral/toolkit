'use client'

import * as React from 'react'

import { useScrollStrip } from '../hooks/use-scroll-strip'
import { cn } from '../lib/cn'
import { fadeMask } from '../lib/scroll-target'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog'
import { ScrollArea } from './scroll-area'

export type SettingsDialogSection<K extends string = string> = {
  key: K
  label: string
  /** Decorative icon shown before the label (e.g. a lucide icon). */
  icon?: React.ComponentType<{ className?: string }>
  /** Shown under the title in the header while this section is active. */
  description?: React.ReactNode
}

export type SettingsDialogProps<K extends string = string> = {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  sections: readonly SettingsDialogSection<K>[]
  /** Active section (controlled). Pair with `onValueChange`. */
  value?: K
  /** Initial section when uncontrolled. Defaults to the first section. */
  defaultValue?: K
  onValueChange?: (key: K) => void
  /** Accessible name of the section nav. */
  navLabel?: string
  /** Overrides the header title (defaults to the active section's label). */
  title?: React.ReactNode
  /** Content of the active section; apps switch on the value. */
  children?: React.ReactNode
  className?: string
}

/**
 * Settings modal shell: section nav (a column from `sm`, a sideways-scrolling
 * strip on phones that keeps the active section in view), a header with the
 * active section's label/description, and a scrolling content area. Which
 * sections a user may see and how each loads its data stay in the app.
 */
export function SettingsDialog<K extends string>({
  open,
  defaultOpen,
  onOpenChange,
  sections,
  value,
  defaultValue,
  onValueChange,
  navLabel = 'Settings sections',
  title,
  children,
  className,
}: SettingsDialogProps<K>) {
  const [inner, setInner] = React.useState<K | undefined>(defaultValue)
  const current = value ?? inner ?? sections[0]?.key
  const active = sections.find((s) => s.key === current)

  const select = (key: K) => {
    if (value === undefined) setInner(key)
    onValueChange?.(key)
  }

  return (
    <Dialog open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <DialogContent
        data-slot="settings-dialog"
        className={cn(
          'grid h-[min(85vh,40rem)] max-w-3xl grid-rows-[auto_1fr] gap-0 overflow-hidden p-0 sm:max-w-3xl sm:grid-cols-[12rem_minmax(0,1fr)] sm:grid-rows-1',
          className,
        )}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <SettingsDialogNav
          label={navLabel}
          sections={sections}
          current={current}
          onSelect={select}
        />
        <div className="flex min-h-0 min-w-0 flex-col">
          <DialogHeader className="gap-1 border-b p-6 pr-14">
            <DialogTitle>{title ?? active?.label}</DialogTitle>
            {active?.description ? (
              <DialogDescription>{active.description}</DialogDescription>
            ) : (
              <DialogDescription className="sr-only">{active?.label}</DialogDescription>
            )}
          </DialogHeader>
          <ScrollArea className="min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]>div]:!block">
            <div data-slot="settings-dialog-content" className="p-6">
              {children}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SettingsDialogNav<K extends string>({
  label,
  sections,
  current,
  onSelect,
}: {
  label: string
  sections: readonly SettingsDialogSection<K>[]
  current: K | undefined
  onSelect: (key: K) => void
}) {
  const ref = React.useRef<HTMLElement>(null)

  // Phones: the nav is a horizontal strip; keep the active section in view and
  // fade only the edges that hide sections. As a column (sm+) nothing
  // overflows sideways, so there is no mask.
  const edges = useScrollStrip(ref, '[aria-current="page"]')

  return (
    <nav
      ref={ref}
      aria-label={label}
      data-slot="settings-dialog-nav"
      data-fade-start={edges.start || undefined}
      data-fade-end={edges.end || undefined}
      style={{ maskImage: fadeMask(edges) }}
      className="bg-muted/40 flex [scrollbar-width:none] gap-0.5 overflow-x-auto border-b p-2 sm:flex-col sm:overflow-x-visible sm:border-r sm:border-b-0 [&::-webkit-scrollbar]:hidden"
    >
      {sections.map(({ key, label: itemLabel, icon: Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onSelect(key)}
          aria-current={key === current ? 'page' : undefined}
          className="text-muted-foreground hover:bg-background/60 aria-[current=page]:bg-background aria-[current=page]:text-foreground focus-visible:ring-ring/50 flex shrink-0 cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-normal whitespace-nowrap transition-colors outline-none focus-visible:ring-3 aria-[current=page]:font-medium"
        >
          {Icon ? (
            <span aria-hidden className="flex shrink-0">
              <Icon className="size-4" />
            </span>
          ) : null}
          {itemLabel}
        </button>
      ))}
    </nav>
  )
}
