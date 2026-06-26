import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '../lib/cn'

// Every screen shares ONE outer frame — the list width (`max-w-7xl`), centered —
// so the content's left edge lines up across every route (lists, forms, detail).
// The `width` variant only controls the *content column* inside that frame:
//   • `default` fills the frame (lists, tables, dashboards),
//   • `narrow`  constrains forms / short content to a readable column anchored
//     LEFT — never stretched across the screen, never centered away from lists,
//   • `full`    drops the cap for genuine full-bleed surfaces.
const frameVariants = cva('w-full flex-1 p-6', {
  variants: {
    width: {
      narrow: 'mx-auto max-w-7xl',
      default: 'mx-auto max-w-7xl',
      full: '',
    },
  },
  defaultVariants: {
    width: 'default',
  },
})

const contentVariants = cva('w-full', {
  variants: {
    width: {
      narrow: 'max-w-2xl',
      default: '',
      full: '',
    },
  },
  defaultVariants: {
    width: 'default',
  },
})

function Main({
  className,
  width = 'default',
  children,
  ...props
}: React.ComponentProps<'main'> & VariantProps<typeof frameVariants>) {
  return (
    <main data-slot="main" data-width={width} className={frameVariants({ width })} {...props}>
      {/* The caller's className styles the content column — width is the single
          source of its max-width, anchored left within the shared frame. */}
      <div data-slot="main-content" className={cn(contentVariants({ width }), className)}>
        {children}
      </div>
    </main>
  )
}

// Back-compat alias: the public knob is the same `width` variant, now split
// across frame + content. Consumers that read variants keep working.
const mainVariants = frameVariants

export { Main, mainVariants }
