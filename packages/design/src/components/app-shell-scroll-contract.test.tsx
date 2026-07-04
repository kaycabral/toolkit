import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

// CONTRACT TEST — the app shell must stay INNER-SCROLL, never document-scroll.
//
// A `fixed` sidebar over a DOCUMENT scroller chains fling/momentum gestures into
// the page (dragging the sidebar scrolls the main content), and `svh`-sized
// chrome renders "short" when the mobile URL bar hides. Both are structural, not
// tunable — the only robust, cross-browser fix is: the shell is pinned to the
// DYNAMIC viewport (`h-dvh`) and clips overflow, a SINGLE inner element owns the
// scroll, and the sidebar rail tracks the dynamic viewport too. This asserts the
// source keeps those invariants so a refactor can't silently reintroduce the bug
// (which no runtime/jsdom test can observe — the chaining lives in the native
// compositor). Reading source is deliberate: the guarantee is the CSS topology.

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')

const sidebarCore = read('./sidebar-core.tsx')
const appShell = read('./app-shell.tsx')

describe('AppShell inner-scroll contract', () => {
  it('locks the shell wrapper to the dynamic viewport and clips overflow', () => {
    const wrapper = sidebarCore.match(/group\/sidebar-wrapper[^'`]*/)?.[0] ?? ''
    expect(wrapper).toContain('h-dvh')
    expect(wrapper).toContain('overflow-hidden')
  })

  it('never lets the shell become a growing document scroller', () => {
    // `min-h-svh` (or any `min-h-*` viewport) on the wrapper = document-scroll.
    expect(sidebarCore).not.toMatch(/group\/sidebar-wrapper[^'`]*min-h-svh/)
  })

  it('sizes the fixed sidebar rail with the dynamic viewport, not svh', () => {
    const rail = sidebarCore.match(/fixed inset-y-0[^'`]*/)?.[0] ?? ''
    expect(rail).toContain('h-dvh')
    expect(rail).not.toContain('h-svh')
  })

  it('exposes a single content scroll container that contains its own overscroll', () => {
    expect(appShell).toContain('data-slot="app-scroll"')
    const scroller = appShell.match(/data-slot="app-scroll"[\s\S]*?className="([^"]*)"/)?.[1] ?? ''
    expect(scroller).toContain('overflow-y-auto')
    expect(scroller).toContain('overscroll-contain')
  })
})
