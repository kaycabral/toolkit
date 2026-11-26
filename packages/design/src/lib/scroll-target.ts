/** Geometry of a horizontally scrolling strip and one of its items, in px. */
export interface StripGeometry {
  /** Visible width of the strip (`clientWidth`). */
  viewport: number
  /** Full content width (`scrollWidth`). */
  content: number
  /** The item's left edge relative to the content start. */
  itemStart: number
  itemWidth: number
  /** Position of the item among its siblings and how many there are. */
  index: number
  count: number
}

/**
 * Where to scroll a strip so the item is fully visible: the first item aligns
 * the strip to its start, the last to its end, and the ones in between are
 * centered (so both neighbors peek in), clamped to the scrollable range.
 */
export function scrollTargetFor(g: StripGeometry): number {
  const max = Math.max(0, g.content - g.viewport)
  if (g.index <= 0) return 0
  if (g.index >= g.count - 1) return max
  const centered = g.itemStart + g.itemWidth / 2 - g.viewport / 2
  return Math.min(max, Math.max(0, Math.round(centered)))
}

/** Which sides of a strip hide content (1px slack for subpixel layouts). */
export function hiddenEdges(scrollLeft: number, viewport: number, content: number) {
  return { start: scrollLeft > 1, end: scrollLeft + viewport < content - 1 }
}

/** CSS mask fading only the sides that hide content; `undefined` when none does. */
export function fadeMask({ start, end }: { start: boolean; end: boolean }): string | undefined {
  if (!start && !end) return undefined
  const from = start ? 'transparent 0, black 1.5rem' : 'black 0'
  const to = end ? 'black calc(100% - 1.5rem), transparent 100%' : 'black 100%'
  return `linear-gradient(to right, ${from}, ${to})`
}
