import { describe, expect, it } from 'vitest'
import {
  formatCnpj,
  formatCpf,
  isValidCnpj,
  isValidCpf,
  maskCnpj,
  maskCpf,
  normalizeCnpj,
  normalizeCpf,
  parseTaxId,
} from './tax-id'

const CPF = '52998224725'
const CPF_ZERO_FIRST_DIGIT = '12345678909'
const CNPJ = '11222333000181'
const CNPJ_OTHER = '11444777000161'

describe('isValidCpf', () => {
  it('accepts valid CPFs, formatted or raw', () => {
    expect(isValidCpf(CPF)).toBe(true)
    expect(isValidCpf('529.982.247-25')).toBe(true)
    expect(isValidCpf(CPF_ZERO_FIRST_DIGIT)).toBe(true)
  })

  it('rejects wrong check digits', () => {
    expect(isValidCpf('52998224724')).toBe(false)
    expect(isValidCpf('52998224715')).toBe(false)
  })

  it('rejects wrong lengths and repeated digits', () => {
    expect(isValidCpf('5299822472')).toBe(false)
    expect(isValidCpf('529982247250')).toBe(false)
    expect(isValidCpf('')).toBe(false)
    expect(isValidCpf('111.111.111-11')).toBe(false)
    expect(isValidCpf('00000000000')).toBe(false)
  })

  it('rejects a valid CNPJ', () => {
    expect(isValidCpf(CNPJ)).toBe(false)
  })
})

describe('isValidCnpj', () => {
  it('accepts valid CNPJs, formatted or raw', () => {
    expect(isValidCnpj(CNPJ)).toBe(true)
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true)
    expect(isValidCnpj(CNPJ_OTHER)).toBe(true)
  })

  it('rejects wrong check digits', () => {
    expect(isValidCnpj('11222333000182')).toBe(false)
    expect(isValidCnpj('11222333000191')).toBe(false)
  })

  it('rejects wrong lengths, repeated digits and CPFs', () => {
    expect(isValidCnpj('1122233300018')).toBe(false)
    expect(isValidCnpj('00000000000000')).toBe(false)
    expect(isValidCnpj(CPF)).toBe(false)
  })
})

describe('normalizeCpf / normalizeCnpj', () => {
  it('returns the digits of a valid id', () => {
    expect(normalizeCpf(' 529.982.247-25 ')).toBe(CPF)
    expect(normalizeCnpj('11.222.333/0001-81')).toBe(CNPJ)
  })

  it('returns null for an invalid id', () => {
    expect(normalizeCpf('529.982.247-26')).toBeNull()
    expect(normalizeCnpj('11.222.333/0001-80')).toBeNull()
  })
})

describe('parseTaxId', () => {
  it('classifies CPF and CNPJ', () => {
    expect(parseTaxId('529.982.247-25')).toEqual({ kind: 'cpf', value: CPF })
    expect(parseTaxId('11.222.333/0001-81')).toEqual({ kind: 'cnpj', value: CNPJ })
  })

  it('returns null for anything else', () => {
    expect(parseTaxId('52998224726')).toBeNull()
    expect(parseTaxId('123')).toBeNull()
  })
})

describe('maskCpf', () => {
  it.each([
    ['', ''],
    ['529', '529'],
    ['5299', '529.9'],
    ['529982', '529.982'],
    ['5299822', '529.982.2'],
    ['529982247', '529.982.247'],
    ['5299822472', '529.982.247-2'],
    [CPF, '529.982.247-25'],
    ['529982247251234', '529.982.247-25'],
    ['abc', ''],
  ])('masks %j as %j', (input, expected) => {
    expect(maskCpf(input)).toBe(expected)
  })
})

describe('maskCnpj', () => {
  it.each([
    ['', ''],
    ['11', '11'],
    ['112', '11.2'],
    ['11222', '11.222'],
    ['112223', '11.222.3'],
    ['11222333', '11.222.333'],
    ['112223330', '11.222.333/0'],
    ['112223330001', '11.222.333/0001'],
    ['1122233300018', '11.222.333/0001-8'],
    [CNPJ, '11.222.333/0001-81'],
    ['1122233300018199', '11.222.333/0001-81'],
  ])('masks %j as %j', (input, expected) => {
    expect(maskCnpj(input)).toBe(expected)
  })
})

describe('formatCpf / formatCnpj', () => {
  it('formats complete ids', () => {
    expect(formatCpf(CPF)).toBe('529.982.247-25')
    expect(formatCnpj(CNPJ)).toBe('11.222.333/0001-81')
  })

  it('returns incomplete input unchanged', () => {
    expect(formatCpf('5299')).toBe('5299')
    expect(formatCnpj('11.222')).toBe('11.222')
  })
})
