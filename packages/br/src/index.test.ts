import { describe, expect, it } from 'vitest'
import * as br from './index'

describe('root barrel', () => {
  it('re-exports every module', () => {
    expect(Object.keys(br).sort()).toEqual([
      'BRAZIL_MOBILE_E164_REGEX',
      'formatAmountFromCents',
      'formatBRL',
      'formatBRLFromCents',
      'formatBRLFromCentsRounded',
      'formatBrazilPhone',
      'formatCnpj',
      'formatCpf',
      'formatPostalCode',
      'formatSignedAmountFromCents',
      'formatSignedBRLFromCents',
      'isValidCnpj',
      'isValidCpf',
      'lookupPostalCode',
      'maskBRLInput',
      'maskBrazilPhone',
      'maskCnpj',
      'maskCpf',
      'maskPostalCode',
      'normalizeBrazilMobile',
      'normalizeBrazilPhone',
      'normalizeCnpj',
      'normalizeCpf',
      'normalizePostalCode',
      'parseBRLInput',
      'parseSignedBRLInput',
      'parseTaxId',
      'whatsappShareUrl',
      'whatsappUrl',
    ])
  })
})
