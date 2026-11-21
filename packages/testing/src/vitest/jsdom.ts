const noop = (): void => {}

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

function matchMediaStub(query: string): MediaQueryList {
  return {
    matches: false,
    media: query,
    onchange: null,
    addEventListener: noop,
    removeEventListener: noop,
    addListener: noop,
    removeListener: noop,
    dispatchEvent: () => false,
  }
}

/**
 * Stub the browser APIs jsdom lacks but Radix primitives, sonner and
 * next-themes call: `ResizeObserver`, `matchMedia` (never matches),
 * `Element#scrollIntoView` and the Pointer Capture API. Only missing APIs are
 * defined, so a real implementation or a test's own mock wins. Call it once
 * from the vitest `setupFiles` of a jsdom project.
 *
 * @example
 * ```ts
 * // vitest.setup.ts
 * import '@testing-library/jest-dom/vitest'
 * import { installJsdomPolyfills } from '@cbrl/testing/vitest/jsdom'
 *
 * installJsdomPolyfills()
 * ```
 */
export function installJsdomPolyfills(): void {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = ResizeObserverStub
  }
  if (typeof globalThis.matchMedia !== 'function') {
    globalThis.matchMedia = matchMediaStub
  }
  if (typeof Element === 'undefined') return
  const proto = Element.prototype
  if (typeof proto.scrollIntoView !== 'function') proto.scrollIntoView = noop
  if (typeof proto.hasPointerCapture !== 'function') proto.hasPointerCapture = () => false
  if (typeof proto.setPointerCapture !== 'function') proto.setPointerCapture = noop
  if (typeof proto.releasePointerCapture !== 'function') proto.releasePointerCapture = noop
}
