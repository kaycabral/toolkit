import { describe, expect, it } from 'vitest'

import { brDateToIso, dateToIso, isoToBrDate, isoToDate, maskBrDate } from './date'

describe('isoToBrDate', () => {
  it('formats a valid ISO date to dd/mm/aaaa', () => {
    expect(isoToBrDate('1988-05-20')).toBe('20/05/1988')
  })
  it('returns "" for malformed or impossible dates', () => {
    expect(isoToBrDate('')).toBe('')
    expect(isoToBrDate('1988-5-20')).toBe('')
    // Impossible dates: day overflow, short month, month overflow, month 0.
    expect(isoToBrDate('2023-02-31')).toBe('')
    expect(isoToBrDate('2023-04-31')).toBe('')
    expect(isoToBrDate('2023-13-01')).toBe('')
    expect(isoToBrDate('2023-00-10')).toBe('')
  })
})

describe('brDateToIso', () => {
  it('parses a complete valid dd/mm/aaaa to ISO', () => {
    expect(brDateToIso('20/05/1988')).toBe('1988-05-20')
  })
  it('returns "" while incomplete or invalid', () => {
    expect(brDateToIso('20/05')).toBe('')
    expect(brDateToIso('31/02/2023')).toBe('')
    expect(brDateToIso('')).toBe('')
  })
})

describe('maskBrDate', () => {
  it('inserts slashes progressively, digits only, capped at 8', () => {
    expect(maskBrDate('2')).toBe('2')
    expect(maskBrDate('2005')).toBe('20/05')
    expect(maskBrDate('20051988')).toBe('20/05/1988')
    expect(maskBrDate('20/05/1988')).toBe('20/05/1988')
    expect(maskBrDate('abc20051988999')).toBe('20/05/1988')
  })
})

describe('dateToIso / isoToDate', () => {
  it('round-trips a local date without shifting across timezones', () => {
    const iso = '1988-05-20'
    const date = isoToDate(iso)
    if (!date) throw new Error('expected a Date')
    expect(dateToIso(date)).toBe(iso)
  })
  it('isoToDate returns undefined for invalid input', () => {
    expect(isoToDate('nope')).toBeUndefined()
    expect(isoToDate('2023-02-31')).toBeUndefined()
  })
})
