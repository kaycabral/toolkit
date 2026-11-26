import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { useElementSize } from '../hooks/use-element-size'
import { useScrollStrip } from '../hooks/use-scroll-strip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

function renderTabs(variant: 'default' | 'line' = 'line') {
  const ref = vi.fn()
  const view = render(
    <Tabs defaultValue="a">
      <TabsList variant={variant} ref={ref}>
        {['a', 'b', 'c', 'd'].map((v) => (
          <TabsTrigger key={v} value={v}>
            Aba {v}
          </TabsTrigger>
        ))}
      </TabsList>
      {['a', 'b', 'c', 'd'].map((v) => (
        <TabsContent key={v} value={v}>
          Painel {v}
        </TabsContent>
      ))}
    </Tabs>,
  )
  const list = screen.getByRole('tablist')
  // jsdom has no layout: a 250px strip over 400px of tabs.
  Object.defineProperty(list, 'clientWidth', { configurable: true, value: 250 })
  Object.defineProperty(list, 'scrollWidth', { configurable: true, value: 400 })
  const scrollTo = vi.fn((options: ScrollToOptions) => {
    list.scrollLeft = options.left ?? 0
    fireEvent.scroll(list)
  })
  Object.defineProperty(list, 'scrollTo', { configurable: true, value: scrollTo })
  return { list, scrollTo, ref, container: view.container }
}

describe('TabsList · scrollable', () => {
  it('fades only the edges that hide tabs', () => {
    const { list } = renderTabs()
    fireEvent.scroll(list)
    expect(list).toHaveAttribute('data-fade-end')
    expect(list).not.toHaveAttribute('data-fade-start')
    expect(list.style.maskImage).toContain('transparent 100%')
    list.scrollLeft = 70
    fireEvent.scroll(list)
    expect(list).toHaveAttribute('data-fade-start')
    expect(list).toHaveAttribute('data-fade-end')
    list.scrollLeft = 150
    fireEvent.scroll(list)
    expect(list).toHaveAttribute('data-fade-start')
    expect(list).not.toHaveAttribute('data-fade-end')
  })

  it('scrolls the activated last tab to the end (pill variant too)', async () => {
    const { list, scrollTo, ref } = renderTabs('default')
    expect(ref).toHaveBeenCalledWith(list)
    await userEvent.click(screen.getByRole('tab', { name: 'Aba d' }))
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ left: 150 }))
    expect(list.scrollLeft).toBe(150)
  })

  it('scrolls without animation when the user prefers reduced motion', async () => {
    const media = vi.spyOn(window, 'matchMedia').mockReturnValue({
      ...window.matchMedia('(min-width: 0)'),
      matches: true,
    })
    const { scrollTo } = renderTabs()
    await userEvent.click(screen.getByRole('tab', { name: 'Aba d' }))
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 150, behavior: 'auto' })
    media.mockRestore()
  })

  it('reveals the active tab again when the strip resizes', () => {
    const callbacks: ResizeObserverCallback[] = []
    const Original = window.ResizeObserver
    window.ResizeObserver = class {
      constructor(callback: ResizeObserverCallback) {
        callbacks.push(callback)
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    const { list } = renderTabs()
    list.scrollLeft = 150
    for (const callback of callbacks) callback([], new Original(() => {}))
    // The first tab is active: back to the start.
    expect(list.scrollLeft).toBe(0)
    window.ResizeObserver = Original
  })

  it('opts out with scrollable={false}', () => {
    const ref = { current: null as HTMLDivElement | null }
    render(
      <Tabs defaultValue="a">
        <TabsList scrollable={false} ref={ref} style={{ color: 'red' }}>
          <TabsTrigger value="a">A</TabsTrigger>
        </TabsList>
      </Tabs>,
    )
    const list = screen.getByRole('tablist')
    expect(ref.current).toBe(list)
    expect(list).not.toHaveAttribute('data-scrollable')
    expect(list.className).not.toContain('overflow-x-auto')
    expect(list.style.maskImage).toBe('')
  })

  it('has no accessibility violations', async () => {
    const { container } = renderTabs()
    await expectNoA11yViolations(container)
  })

  it('useScrollStrip does nothing without a strip', () => {
    const { result } = renderHook(() => useScrollStrip({ current: null }, '[data-state]'))
    expect(result.current).toEqual({ start: false, end: false })
  })
})

describe('useElementSize', () => {
  it('reports the observed size and disconnects on unmount', () => {
    let callback: ResizeObserverCallback = () => {}
    const disconnect = vi.fn()
    const Original = window.ResizeObserver
    window.ResizeObserver = class {
      constructor(cb: ResizeObserverCallback) {
        callback = cb
      }
      observe() {}
      unobserve() {}
      disconnect = disconnect
    }
    const { result } = renderHook(() => useElementSize())
    expect(result.current[1]).toEqual({ width: 0, height: 0 })
    const cleanup = result.current[0](document.createElement('div'))
    const target = document.createElement('div')
    const entry: ResizeObserverEntry = {
      target,
      contentRect: {
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: 320,
        bottom: 40,
        width: 320,
        height: 40,
        toJSON: () => ({}),
      },
      borderBoxSize: [],
      contentBoxSize: [],
      devicePixelContentBoxSize: [],
    }
    act(() => callback([entry], new Original(() => {})))
    expect(result.current[1]).toEqual({ width: 320, height: 40 })
    const same = result.current[1]
    act(() => callback([entry], new Original(() => {})))
    expect(result.current[1]).toBe(same)
    act(() => callback([], new Original(() => {})))
    expect(result.current[1]).toEqual({ width: 0, height: 0 })
    cleanup()
    expect(disconnect).toHaveBeenCalled()
    window.ResizeObserver = Original
  })
})
