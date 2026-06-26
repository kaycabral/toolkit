import '@testing-library/jest-dom/vitest'

// jsdom lacks the layout/observer APIs that Radix popper components (Tooltip,
// Popover, Select…) and sonner rely on. Polyfill them once here so any component
// test can render those primitives without per-file boilerplate.
const matchMediaStub = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
})
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: matchMediaStub,
})
Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  configurable: true,
  value: matchMediaStub,
})

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

// jsdom implements neither scrollIntoView nor the Pointer Capture API, both of
// which Radix listbox/menu primitives (Select, DropdownMenu) call when opening.
// Stub them so open-state can be asserted in unit tests.
if (typeof Element.prototype.scrollIntoView !== 'function') {
  Element.prototype.scrollIntoView = () => {}
}
if (typeof Element.prototype.hasPointerCapture !== 'function') {
  Element.prototype.hasPointerCapture = () => false
}
if (typeof Element.prototype.setPointerCapture !== 'function') {
  Element.prototype.setPointerCapture = () => {}
}
if (typeof Element.prototype.releasePointerCapture !== 'function') {
  Element.prototype.releasePointerCapture = () => {}
}
