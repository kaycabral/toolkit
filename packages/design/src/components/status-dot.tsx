import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '../lib/cn'

// Tone colors match the Badge status variants (success/warning/info use the
// Tailwind palette, destructive the token), so a dot and a badge of the same
// tone read as one status.
const statusDotVariants = cva('relative inline-flex shrink-0 rounded-full', {
  variants: {
    tone: {
      success: 'bg-emerald-500 dark:bg-emerald-400',
      warning: 'bg-amber-500 dark:bg-amber-400',
      destructive: 'bg-destructive',
      info: 'bg-sky-500 dark:bg-sky-400',
      muted: 'bg-muted-foreground/50',
    },
    size: {
      sm: 'size-1.5',
      default: 'size-2',
      lg: 'size-2.5',
    },
  },
  defaultVariants: {
    tone: 'muted',
    size: 'default',
  },
})

type StatusDotProps = Omit<React.ComponentProps<'span'>, 'children'> &
  VariantProps<typeof statusDotVariants> & {
    /**
     * Accessible name ("Online", "Sync failed"). Without it the dot is
     * decorative (`aria-hidden`): pair it with visible text that says the same.
     */
    label?: string
    /** Draws attention with a ping ring; skipped under reduced motion. */
    pulse?: boolean
  }

function StatusDot({
  className,
  tone = 'muted',
  size = 'default',
  label,
  pulse = false,
  ...props
}: StatusDotProps) {
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true }
  return (
    <span
      data-slot="status-dot"
      data-tone={tone}
      className={cn(statusDotVariants({ tone, size }), className)}
      {...a11y}
      {...props}
    >
      {pulse ? (
        <span
          data-slot="status-dot-pulse"
          className="absolute inset-0 animate-ping rounded-full bg-inherit opacity-75 motion-reduce:hidden"
        />
      ) : null}
    </span>
  )
}

export { StatusDot, statusDotVariants, type StatusDotProps }
