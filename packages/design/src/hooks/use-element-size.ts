'use client'

import * as React from 'react'

export interface ElementSize {
  width: number
  height: number
}

/**
 * Measures an element's content box and follows it on resize (`{0, 0}` until
 * measured). Returns a React 19 cleanup ref: attach it to the element; the
 * observer is disconnected when the element unmounts.
 *
 *     const [ref, { width }] = useElementSize<HTMLDivElement>()
 *     return <div ref={ref}>{width > 480 ? <Wide /> : <Narrow />}</div>
 */
export function useElementSize<T extends Element = HTMLDivElement>(): [
  (element: T) => () => void,
  ElementSize,
] {
  const [size, setSize] = React.useState<ElementSize>({ width: 0, height: 0 })
  const ref = React.useCallback((element: T) => {
    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? 0
      const height = entry?.contentRect.height ?? 0
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return [ref, size]
}
