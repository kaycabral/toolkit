import { describe, expect, it } from 'vitest'
import {
  BRAZIL_MOBILE_E164_REGEX,
  formatBrazilPhone,
  maskBrazilPhone,
  normalizeBrazilMobile,
  normalizeBrazilPhone,
  whatsappShareUrl,
  whatsappUrl,
} from './phone'

describe('normalizeBrazilPhone', () => {
  it('prepends 55 to an 11-digit mobile, stripping formatting', () => {
    expect(normalizeBrazilPhone('(11) 91234-5678')).toBe('5511912345678')
  })

  it('prepends 55 to a 10-digit landline', () => {
    expect(normalizeBrazilPhone('1133334444')).toBe('551133334444')
  })

  it('keeps numbers that already carry the 55 country code', () => {
    expect(normalizeBrazilPhone('+55 11 91234-5678')).toBe('5511912345678')
    expect(normalizeBrazilPhone('551133334444')).toBe('551133334444')
  })

  it('keeps foreign E.164 numbers up to 15 digits', () => {
    expect(normalizeBrazilPhone('+44 7911 123456')).toBe('447911123456')
    expect(normalizeBrazilPhone('123456789012345')).toBe('123456789012345')
  })

  it('returns null for empty, too short or too long input', () => {
    expect(normalizeBrazilPhone('')).toBeNull()
    expect(normalizeBrazilPhone('---')).toBeNull()
    expect(normalizeBrazilPhone('912345678')).toBeNull()
    expect(normalizeBrazilPhone('1234567890123456')).toBeNull()
  })
})

describe('normalizeBrazilMobile', () => {
  it('accepts an 11-digit mobile with or without the 55 prefix', () => {
    expect(normalizeBrazilMobile('(11) 91234-5678')).toBe('5511912345678')
    expect(normalizeBrazilMobile('+55 (11) 91234-5678')).toBe('5511912345678')
  })

  it('rejects landlines and numbers missing the 9th digit', () => {
    expect(normalizeBrazilMobile('1133334444')).toBeNull()
    expect(normalizeBrazilMobile('551133334444')).toBeNull()
    expect(normalizeBrazilMobile('11812345678')).toBeNull()
  })

  it('rejects empty, short and foreign input', () => {
    expect(normalizeBrazilMobile('')).toBeNull()
    expect(normalizeBrazilMobile('91234567')).toBeNull()
    expect(normalizeBrazilMobile('447911123456')).toBeNull()
  })

  it('exposes the E.164 mobile regex', () => {
    expect(BRAZIL_MOBILE_E164_REGEX.test('5511912345678')).toBe(true)
    expect(BRAZIL_MOBILE_E164_REGEX.test('551181234567')).toBe(false)
  })
})

describe('formatBrazilPhone', () => {
  it('formats mobiles and landlines', () => {
    expect(formatBrazilPhone('11912345678')).toBe('(11) 91234-5678')
    expect(formatBrazilPhone('1133334444')).toBe('(11) 3333-4444')
  })

  it('drops a leading 55 country code', () => {
    expect(formatBrazilPhone('5511912345678')).toBe('(11) 91234-5678')
    expect(formatBrazilPhone('+55 11 3333-4444')).toBe('(11) 3333-4444')
  })

  it('does not strip 55 when it is the area code of a domestic number', () => {
    expect(formatBrazilPhone('55912345678')).toBe('(55) 91234-5678')
  })

  it('returns input it cannot format unchanged', () => {
    expect(formatBrazilPhone('123')).toBe('123')
    expect(formatBrazilPhone('+44 7911 123456')).toBe('+44 7911 123456')
  })
})

describe('maskBrazilPhone', () => {
  it.each([
    ['', ''],
    ['1', '(1'],
    ['11', '(11'],
    ['119', '(11) 9'],
    ['113333', '(11) 3333'],
    ['1133334', '(11) 3333-4'],
    ['1133334444', '(11) 3333-4444'],
    ['11912345678', '(11) 91234-5678'],
  ])('masks partial input %j as %j', (input, expected) => {
    expect(maskBrazilPhone(input)).toBe(expected)
  })

  it('ignores non-digits and caps at 11 digits', () => {
    expect(maskBrazilPhone('(11) 91234-5678 ramal 9')).toBe('(11) 91234-5678')
  })

  it('is idempotent on its own output', () => {
    expect(maskBrazilPhone(maskBrazilPhone('1133334'))).toBe('(11) 3333-4')
  })
})

describe('whatsappUrl', () => {
  it('builds a click-to-chat link with the normalized number', () => {
    expect(whatsappUrl('(11) 91234-5678')).toBe('https://wa.me/5511912345678')
  })

  it('prefills an encoded message', () => {
    expect(whatsappUrl('11912345678', 'Olá, tudo bem? 50% & mais')).toBe(
      'https://wa.me/5511912345678?text=Ol%C3%A1%2C%20tudo%20bem%3F%2050%25%20%26%20mais',
    )
  })

  it('omits an empty message', () => {
    expect(whatsappUrl('11912345678', '')).toBe('https://wa.me/5511912345678')
  })

  it('returns null for a number that cannot be normalized', () => {
    expect(whatsappUrl('123', 'hi')).toBeNull()
  })
})

describe('whatsappShareUrl', () => {
  it('builds a share link with an encoded message', () => {
    expect(whatsappShareUrl('Veja isto:\n\nhttps://example.com/a?b=1')).toBe(
      'https://wa.me/?text=Veja%20isto%3A%0A%0Ahttps%3A%2F%2Fexample.com%2Fa%3Fb%3D1',
    )
  })
})
