import { describe, expect, it } from 'vitest'
import { formatBRL, formatBRLFromCents, formatBRLFromCentsRounded } from './money'

const nbsp = '\u00a0'

describe('formatBRL', () => {
  it('formats reais with two decimals and thousands separators', () => {
    expect(formatBRL(1234.5)).toBe(`R$${nbsp}1.234,50`)
    expect(formatBRL(0)).toBe(`R$${nbsp}0,00`)
  })

  it('formats negative amounts', () => {
    expect(formatBRL(-10)).toBe(`-R$${nbsp}10,00`)
  })
})

describe('formatBRLFromCents', () => {
  it('converts integer cents to reais', () => {
    expect(formatBRLFromCents(123456)).toBe(`R$${nbsp}1.234,56`)
    expect(formatBRLFromCents(5)).toBe(`R$${nbsp}0,05`)
    expect(formatBRLFromCents(100000000)).toBe(`R$${nbsp}1.000.000,00`)
  })
})

describe('formatBRLFromCentsRounded', () => {
  it('rounds to whole reais', () => {
    expect(formatBRLFromCentsRounded(123456)).toBe(`R$${nbsp}1.235`)
    expect(formatBRLFromCentsRounded(123449)).toBe(`R$${nbsp}1.234`)
    expect(formatBRLFromCentsRounded(0)).toBe(`R$${nbsp}0`)
  })
})
