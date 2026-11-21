import { describe, expect, it } from 'vitest'
import * as br from './index'

describe('root barrel', () => {
  it('re-exports every module', () => {
    expect(Object.keys(br).sort()).toEqual([
      'BRAZIL_MOBILE_E164_REGEX',
      'formatBRL',
      'formatBRLFromCents',
      'formatBRLFromCentsRounded',
      'formatBrazilPhone',
      'formatCnpj',
      'formatCpf',
      'formatPostalCode',
      'isValidCnpj',
      'isValidCpf',
      'lookupPostalCode',
      'maskBrazilPhone',
      'maskCnpj',
      'maskCpf',
      'maskPostalCode',
      'normalizeBrazilMobile',
      'normalizeBrazilPhone',
      'normalizeCnpj',
      'normalizeCpf',
      'normalizePostalCode',
      'parseTaxId',
      'whatsappShareUrl',
      'whatsappUrl',
    ])
  })
})
