import { describe, expect, it } from 'vitest'
import { safeNextPath } from './safe-next'

describe('safeNextPath', () => {
  it.each([
    ['/painel', '/painel'],
    ['/imoveis?deal=sale#map', '/imoveis?deal=sale#map'],
    ['/a/../b', '/b'],
  ])('keeps the same-origin path %j', (raw, expected) => {
    expect(safeNextPath(raw, '/home')).toBe(expected)
  })

  it.each([
    null,
    undefined,
    '',
    'painel',
    'https://evil.example.com',
    '//evil.example.com',
    '/\\evil.example.com',
    '/\t/evil.example.com',
    '/\t/',
  ])('falls back for %j', (raw) => {
    expect(safeNextPath(raw, '/home')).toBe('/home')
  })
})
