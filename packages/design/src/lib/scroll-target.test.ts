import { describe, expect, it } from 'vitest'
import { fadeMask, hiddenEdges, scrollTargetFor } from './scroll-target'

// Four 100px tabs in a 250px strip: 150px of scroll.
const strip = { viewport: 250, content: 400, itemWidth: 100, count: 4 }

describe('scrollTargetFor', () => {
  it('aligns the first tab to the start', () => {
    expect(scrollTargetFor({ ...strip, itemStart: 0, index: 0 })).toBe(0)
  })

  it('aligns the last tab to the end', () => {
    expect(scrollTargetFor({ ...strip, itemStart: 300, index: 3 })).toBe(150)
  })

  it('centers a middle tab so its neighbors peek in', () => {
    // Tab 2 spans 200–300: centered = 250 - 125 = 125.
    expect(scrollTargetFor({ ...strip, itemStart: 200, index: 2 })).toBe(125)
    // Tab 1 spans 100–200: centered = 25.
    expect(scrollTargetFor({ ...strip, itemStart: 100, index: 1 })).toBe(25)
  })

  it('clamps the centered position to the scrollable range', () => {
    expect(scrollTargetFor({ ...strip, itemStart: 10, itemWidth: 20, index: 1 })).toBe(0)
    expect(scrollTargetFor({ ...strip, itemStart: 380, itemWidth: 10, index: 2 })).toBe(150)
  })

  it('never scrolls a strip that fits', () => {
    expect(scrollTargetFor({ ...strip, content: 200, itemStart: 100, index: 3 })).toBe(0)
  })
})

describe('hiddenEdges and fadeMask', () => {
  it('fades only the sides that hide content', () => {
    expect(hiddenEdges(0, 250, 250)).toEqual({ start: false, end: false })
    expect(fadeMask(hiddenEdges(0, 250, 250))).toBeUndefined()
    const atStart = hiddenEdges(0, 250, 400)
    expect(atStart).toEqual({ start: false, end: true })
    expect(fadeMask(atStart)).toBe(
      'linear-gradient(to right, black 0, black calc(100% - 1.5rem), transparent 100%)',
    )
    expect(fadeMask(hiddenEdges(150, 250, 400))).toBe(
      'linear-gradient(to right, transparent 0, black 1.5rem, black 100%)',
    )
    expect(hiddenEdges(70, 250, 400)).toEqual({ start: true, end: true })
  })
})
