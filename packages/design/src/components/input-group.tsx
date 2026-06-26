import * as React from 'react'

import { cn } from '../lib/cn'
import { Input } from './input'

// Input with inline addons (icons/buttons), shadcn InputGroup. The group owns
// the border + focus ring; the inner input is borderless so an addon can sit
// flush inside on either side.
function InputGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        'group/input-group border-input relative flex w-full items-center gap-1.5 rounded-lg border bg-transparent px-2.5 transition-[color,box-shadow] outline-none',
        'has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-ring/50 has-[input:focus-visible]:ring-3',
        'has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-destructive/20 has-[[aria-invalid=true]]:ring-3',
        'dark:bg-input/30',
        className,
      )}
      {...props}
    />
  )
}

function InputGroupInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        // Fully transparent (override the base Input's own bg) so it doesn't
        // layer a second fill over the group — that double layer showed as faint
        // edges, most visible when empty.
        'h-8 flex-1 rounded-none border-0 bg-transparent px-0 shadow-none focus-visible:border-0 focus-visible:ring-0 disabled:bg-transparent dark:bg-transparent dark:disabled:bg-transparent',
        className,
      )}
      {...props}
    />
  )
}

function InputGroupAddon({
  className,
  align = 'inline-end',
  ...props
}: React.ComponentProps<'div'> & { align?: 'inline-start' | 'inline-end' }) {
  return (
    <div
      data-slot="input-group-addon"
      className={cn(
        'text-muted-foreground flex shrink-0 items-center [&_svg]:size-4 [&_svg]:shrink-0',
        align === 'inline-start' ? 'order-first' : 'order-last',
        className,
      )}
      {...props}
    />
  )
}

export { InputGroup, InputGroupAddon, InputGroupInput }
