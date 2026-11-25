'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { Tabs as TabsPrimitive } from 'radix-ui'
import * as React from 'react'

import { cn } from '../lib/cn'

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  )
}

/**
 * `default`: segmented pill on a muted track (few short options).
 * `line`: underlined tabs on a bottom border (shadcn line), full width and scrolling
 * sideways when they do not fit — for widgets and sections whose tabs carry
 * counts or longer labels.
 */
const tabsListVariants = cva('group/tabs-list text-muted-foreground inline-flex items-center', {
  variants: {
    variant: {
      default: 'bg-muted h-9 w-fit justify-center rounded-lg p-1',
      line: 'border-border h-9 w-full justify-start gap-4 overflow-x-auto overflow-y-hidden border-b [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
    },
  },
  defaultVariants: { variant: 'default' },
})

function TabsList({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center gap-1.5 text-sm font-medium whitespace-nowrap transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // default (pill): focus ring around the pill
        'group-data-[variant=default]/tabs-list:text-foreground group-data-[variant=default]/tabs-list:focus-visible:ring-ring/50 group-data-[variant=default]/tabs-list:data-[state=active]:bg-background group-data-[variant=default]/tabs-list:rounded-md group-data-[variant=default]/tabs-list:px-2 group-data-[variant=default]/tabs-list:py-1 group-data-[variant=default]/tabs-list:focus-visible:ring-[3px] group-data-[variant=default]/tabs-list:data-[state=active]:shadow',
        // line (as shadcn's): an underline that fades in on the active tab; focus
        // shows as a muted underline instead of a ring (a ring around an
        // underlined tab reads as a stray mark beside it).
        'after:bg-foreground group-data-[variant=line]/tabs-list:hover:text-foreground group-data-[variant=line]/tabs-list:focus-visible:text-foreground group-data-[variant=line]/tabs-list:data-[state=active]:text-foreground h-full after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:opacity-0 after:transition-opacity group-data-[variant=default]/tabs-list:after:hidden group-data-[variant=line]/tabs-list:focus-visible:after:opacity-40 group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100',
        className,
      )}
      {...props}
    />
  )
}

/**
 * Count beside a tab label (items in that tab). `tone="destructive"` flags
 * what needs attention (e.g. overdue). Plain text, so the tab reads as
 * "Atrasadas 2".
 */
const tabsCountVariants = cva(
  'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium tabular-nums',
  {
    variants: {
      tone: {
        default: 'bg-muted text-muted-foreground',
        destructive: 'bg-destructive/10 text-destructive',
      },
    },
    defaultVariants: { tone: 'default' },
  },
)

function TabsCount({
  className,
  tone = 'default',
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof tabsCountVariants>) {
  return (
    <span
      data-slot="tabs-count"
      className={cn(tabsCountVariants({ tone }), className)}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        'focus-visible:ring-ring/50 flex-1 outline-none focus-visible:ring-[3px]',
        className,
      )}
      {...props}
    />
  )
}

export { Tabs, TabsContent, TabsCount, TabsList, tabsListVariants, TabsTrigger }
