import { afterEach, describe, expect, it } from 'vitest'

import { installJsdomPolyfills } from './jsdom'

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'ResizeObserver')
  Reflect.deleteProperty(globalThis, 'matchMedia')
})

describe('installJsdomPolyfills outside a DOM', () => {
  it('installs the global stubs and skips Element', () => {
    expect(typeof Element).toBe('undefined')
    installJsdomPolyfills()
    expect(typeof globalThis.ResizeObserver).toBe('function')
    expect(typeof globalThis.matchMedia).toBe('function')
  })
})
