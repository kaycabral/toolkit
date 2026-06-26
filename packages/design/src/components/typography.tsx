import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '../lib/cn'

// Centralized typography (shadcn recipes). Everything that renders text styled
// as a heading/lead/muted/etc. goes through here, so a redesign changes one
// place. `variant` picks the visual style; `as` picks the semantic element
// (defaults to a sensible tag per variant).
const typographyVariants = cva('', {
  variants: {
    variant: {
      h1: 'scroll-m-20 text-4xl font-extrabold tracking-tight text-balance',
      h2: 'scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0',
      h3: 'scroll-m-20 text-2xl font-semibold tracking-tight',
      h4: 'scroll-m-20 text-xl font-semibold tracking-tight',
      // Page title — the app convention (smaller than shadcn's h1).
      pageTitle: 'text-2xl font-semibold tracking-tight',
      p: 'leading-7 [&:not(:first-child)]:mt-6',
      blockquote: 'mt-6 border-l-2 pl-6 italic',
      lead: 'text-muted-foreground text-xl',
      large: 'text-lg font-semibold',
      small: 'text-sm leading-none font-medium',
      muted: 'text-muted-foreground text-sm',
      code: 'bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold',
    },
  },
  defaultVariants: { variant: 'p' },
})

const DEFAULT_TAG: Record<
  NonNullable<VariantProps<typeof typographyVariants>['variant']>,
  React.ElementType
> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  pageTitle: 'h1',
  p: 'p',
  blockquote: 'blockquote',
  lead: 'p',
  large: 'div',
  small: 'small',
  muted: 'p',
  code: 'code',
}

function Typography({
  variant,
  as,
  className,
  ...props
}: VariantProps<typeof typographyVariants> & {
  as?: React.ElementType
} & React.HTMLAttributes<HTMLElement>) {
  const Comp = as ?? DEFAULT_TAG[variant ?? 'p']
  return (
    <Comp
      data-slot="typography"
      className={cn(typographyVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Typography, typographyVariants }
