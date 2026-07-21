import * as React from 'react'

import { cn } from '../lib/cn'

type AuthSplitScreenProps = React.ComponentProps<'div'> & {
  /**
   * Decorative panel rendered beside the entry column from `md` up. Purely
   * visual: it is `aria-hidden`, so it must never carry information needed to
   * complete the flow. Omit it to render a plain single column at every width.
   */
  visual?: React.ReactNode
}

/**
 * Full-screen authentication layout: an entry column (brand, copy, providers)
 * next to a decorative panel.
 *
 * The panel is gated by CSS (`hidden md:flex`), so `md` (768px) is where the
 * split turns ON — below it the entry column stands alone, centered on both
 * axes. Mind the direction: the breakpoint is the split's entry point, not its
 * exit. Reading it as "hide on mobile" invites `md:hidden`, which blanks the
 * panel at exactly the width it should appear. jsdom cannot evaluate media
 * queries, so that direction is proven by the E2E specs that drive real 390px
 * and 768px viewports — not by this package's unit tests.
 *
 * CSS rather than `useIsMobile()` on purpose. `app-shell` gates on the JS hook
 * because regression #1374 showed that at the 768px boundary `window.innerWidth`
 * and the CSS media query can disagree by a pixel — there, the mismatch could
 * leave a phone with no account menu at all. Here the only thing on that seam is
 * decoration, so the cheaper gate wins: no `'use client'`, no post-hydration
 * flash of a panel that renders server-side from the first paint.
 */
function AuthSplitScreen({ visual, children, className, ...props }: AuthSplitScreenProps) {
  return (
    <div
      data-slot="auth-split-screen"
      className={cn('flex min-h-dvh w-full', className)}
      {...props}
    >
      <main
        data-slot="auth-split-screen-content"
        className="flex min-h-dvh w-full flex-col items-center justify-center overflow-y-auto px-6 py-12 md:w-1/2"
      >
        <div className="w-full max-w-sm">{children}</div>
      </main>
      {visual ? (
        <div
          data-slot="auth-split-screen-visual"
          data-visible-from="md"
          aria-hidden="true"
          className="bg-muted hidden min-h-dvh w-1/2 overflow-hidden md:flex md:items-center md:justify-center"
        >
          {visual}
        </div>
      ) : null}
    </div>
  )
}

export { AuthSplitScreen, type AuthSplitScreenProps }
