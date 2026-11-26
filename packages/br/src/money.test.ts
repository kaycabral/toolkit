import { describe, expect, it } from 'vitest'
import {
  formatAmountFromCents,
  formatBRL,
  formatBRLFromCents,
  formatBRLFromCentsRounded,
  formatSignedAmountFromCents,
  formatSignedBRLFromCents,
  maskBRLInput,
  parseBRLInput,
  parseSignedBRLInput,
} from './money'

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

describe('formatSignedBRLFromCents', () => {
  it('adds + to positives and keeps - on negatives', () => {
    expect(formatSignedBRLFromCents(1000)).toBe(`+R$${nbsp}10,00`)
    expect(formatSignedBRLFromCents(-1000)).toBe(`-R$${nbsp}10,00`)
    expect(formatSignedBRLFromCents(0)).toBe(`R$${nbsp}0,00`)
  })
})

describe('formatAmountFromCents', () => {
  it('formats without the symbol, keeping cents', () => {
    expect(formatAmountFromCents(1094761)).toBe('10.947,61')
    expect(formatAmountFromCents(-26050)).toBe('-260,50')
    expect(formatAmountFromCents(10)).toBe('0,10')
  })

  it('signed variant', () => {
    expect(formatSignedAmountFromCents(1094761)).toBe('+10.947,61')
    expect(formatSignedAmountFromCents(-26050)).toBe('-260,50')
    expect(formatSignedAmountFromCents(0)).toBe('0,00')
  })
})

describe('parseBRLInput', () => {
  it('reads pt-BR and dotted inputs as cents', () => {
    expect(parseBRLInput('1234,56')).toBe(123456)
    expect(parseBRLInput('1.234,56')).toBe(123456)
    expect(parseBRLInput('1234.56')).toBe(123456)
    expect(parseBRLInput('1.234')).toBe(123400)
    expect(parseBRLInput(`R$${nbsp}50`)).toBe(5000)
    expect(parseBRLInput('0,1')).toBe(10)
  })

  it('rejects empty, garbage and negatives', () => {
    expect(parseBRLInput('')).toBeNull()
    expect(parseBRLInput('abc')).toBeNull()
    expect(parseBRLInput('-10')).toBeNull()
  })

  it('signed variant accepts - and −', () => {
    expect(parseSignedBRLInput('-10,50')).toBe(-1050)
    expect(parseSignedBRLInput('−10,50')).toBe(-1050)
    expect(parseSignedBRLInput('10')).toBe(1000)
    expect(parseSignedBRLInput('-0')).toBe(0)
    expect(parseSignedBRLInput('-x')).toBeNull()
    expect(parseSignedBRLInput(formatSignedBRLFromCents(-123456))).toBe(-123456)
  })
})

describe('maskBRLInput', () => {
  it('shifts digits in from the cents side', () => {
    expect(maskBRLInput('5')).toBe('0,05')
    expect(maskBRLInput('1234')).toBe('12,34')
    expect(maskBRLInput('123456')).toBe('1.234,56')
    expect(maskBRLInput('1.234,567')).toBe('12.345,67')
  })

  it('empties on zero and reads back as cents', () => {
    expect(maskBRLInput('')).toBe('')
    expect(maskBRLInput('R$ abc')).toBe('')
    expect(maskBRLInput('0,0')).toBe('')
    expect(parseBRLInput(maskBRLInput('123456'))).toBe(123456)
  })

  it('drops digits past R$ 99 bilhões', () => {
    expect(maskBRLInput('99999999999999999')).toBe('99.999.999.999,99')
  })
})
