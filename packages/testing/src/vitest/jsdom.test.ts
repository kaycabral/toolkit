/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from 'vitest'

import { installJsdomPolyfills } from './jsdom'

const proto = Element.prototype

beforeEach(() => {
  Reflect.deleteProperty(globalThis, 'ResizeObserver')
  Reflect.deleteProperty(globalThis, 'matchMedia')
  Reflect.deleteProperty(proto, 'scrollIntoView')
  Reflect.deleteProperty(proto, 'hasPointerCapture')
  Reflect.deleteProperty(proto, 'setPointerCapture')
  Reflect.deleteProperty(proto, 'releasePointerCapture')
})

describe('installJsdomPolyfills', () => {
  it('stubs the APIs jsdom lacks', () => {
    installJsdomPolyfills()
    const observer = new ResizeObserver(() => {})
    observer.observe(document.body)
    observer.unobserve(document.body)
    observer.disconnect()

    const query = matchMedia('(prefers-color-scheme: dark)')
    expect(query).toMatchObject({ matches: false, media: '(prefers-color-scheme: dark)' })
    query.addEventListener('change', () => {})
    query.removeEventListener('change', () => {})
    query.addListener(() => {})
    query.removeListener(() => {})
    expect(query.dispatchEvent(new Event('change'))).toBe(false)

    const el = document.createElement('div')
    el.scrollIntoView()
    el.setPointerCapture(1)
    el.releasePointerCapture(1)
    expect(el.hasPointerCapture(1)).toBe(false)
  })

  it('keeps existing implementations', () => {
    const existing = () => true
    proto.hasPointerCapture = existing
    installJsdomPolyfills()
    const first = globalThis.matchMedia
    installJsdomPolyfills()
    expect(Reflect.get(proto, 'hasPointerCapture')).toBe(existing)
    expect(globalThis.matchMedia).toBe(first)
  })
})
