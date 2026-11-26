import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(join(import.meta.dirname, 'tokens.css'), 'utf8')

function block(selector: string): string {
  const start = css.indexOf(`\n${selector} {`)
  const end = css.indexOf('\n}', start + 1)
  return css.slice(start, end)
}

function token(scope: string, name: string): string | undefined {
  return new RegExp(`--${name}:\\s*([^;]+);`).exec(scope)?.[1]?.trim()
}

function lightness(scope: string, name: string): number {
  return Number(/oklch\(([\d.]+)/.exec(token(scope, name) ?? '')?.[1])
}

// Surface hierarchy contract: cards and popups must stand out from the page.
describe('surface tokens', () => {
  it('light: gray page and sidebar, white card and popover', () => {
    const light = block(':root')
    expect(token(light, 'background')).toBe('oklch(0.985 0 0)')
    expect(token(light, 'sidebar')).toBe('oklch(0.985 0 0)')
    expect(token(light, 'card')).toBe('oklch(1 0 0)')
    expect(token(light, 'popover')).toBe('oklch(1 0 0)')
  })

  // Hover/active fills must differ from the surface they sit on, or the
  // feedback disappears (sidebar hover was invisible when both were 0.97).
  it.each([':root', '.dark'])('%s: hover fills and cards differ from their surface', (sel) => {
    const scope = block(sel)
    expect(token(scope, 'sidebar')).not.toBe(token(scope, 'sidebar-accent'))
    expect(token(scope, 'background')).not.toBe(token(scope, 'accent'))
    expect(token(scope, 'background')).not.toBe(token(scope, 'card'))
  })

  it('dark: popover lighter than card, card lighter than page', () => {
    const dark = block('.dark')
    expect(lightness(dark, 'popover')).toBeGreaterThan(lightness(dark, 'card'))
    expect(lightness(dark, 'card')).toBeGreaterThan(lightness(dark, 'background'))
  })

  it('declares the popup elevation as a theme shadow', () => {
    expect(token(block('@theme'), 'shadow-popup')).toMatch(/rgb\(0 0 0/)
  })
})
