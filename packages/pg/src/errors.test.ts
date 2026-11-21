import { describe, expect, it } from 'vitest'
import { isForeignKeyViolation, isUniqueViolation, PG_ERROR, pgErrorOf } from './errors'

function pgError(code: string, constraint?: string): Error {
  return Object.assign(new Error('pg'), constraint === undefined ? { code } : { code, constraint })
}

const PARKED = Symbol.for('test/parked')

describe('PG_ERROR', () => {
  it('maps the integrity-constraint SQLSTATEs', () => {
    expect(PG_ERROR).toEqual({
      NOT_NULL_VIOLATION: '23502',
      FOREIGN_KEY_VIOLATION: '23503',
      UNIQUE_VIOLATION: '23505',
      CHECK_VIOLATION: '23514',
      EXCLUSION_VIOLATION: '23P01',
    })
  })
})

describe('pgErrorOf', () => {
  it('reads code and constraint from the error itself', () => {
    expect(pgErrorOf(pgError('23505', 'users_email_key'))).toEqual({
      code: '23505',
      constraint: 'users_email_key',
    })
  })

  it('omits a missing or non-string constraint', () => {
    expect(pgErrorOf(pgError('23502'))).toEqual({ code: '23502' })
    expect(pgErrorOf({ code: '23502', constraint: 42 })).toEqual({ code: '23502' })
  })

  it('walks the cause chain (Drizzle wraps the pg error)', () => {
    const wrapped = new Error('Failed query', {
      cause: new Error('mid', { cause: pgError('23503') }),
    })
    expect(pgErrorOf(wrapped)).toEqual({ code: '23503' })
  })

  it('skips codes that are not SQLSTATEs', () => {
    const err = Object.assign(new Error('conn'), { code: 'ECONNREFUSED', cause: pgError('23514') })
    expect(pgErrorOf(err)).toEqual({ code: '23514' })
    expect(pgErrorOf({ code: 23505 })).toEqual({})
  })

  it('returns {} for non-objects and chains without a Postgres error', () => {
    expect(pgErrorOf(undefined)).toEqual({})
    expect(pgErrorOf('23505')).toEqual({})
    expect(pgErrorOf(new Error('plain', { cause: 'text' }))).toEqual({})
  })

  it('stops on a cause cycle', () => {
    const a: { cause?: unknown } = {}
    const b = { cause: a }
    a.cause = b
    expect(pgErrorOf(a)).toEqual({})
  })

  it('follows what the unwrap hook returns, falling back to cause', () => {
    const unwrap = (value: object): unknown => Reflect.get(value, PARKED)
    const fiberFailure = { [PARKED]: pgError('23505', 'k') }
    expect(pgErrorOf(new Error('outer', { cause: fiberFailure }), { unwrap })).toEqual({
      code: '23505',
      constraint: 'k',
    })
    expect(pgErrorOf(fiberFailure)).toEqual({})
  })

  it('does not call unwrap on the node that carries the SQLSTATE', () => {
    const unwrap = (): unknown => {
      throw new Error('unexpected')
    }
    expect(pgErrorOf(pgError('23505'), { unwrap })).toEqual({ code: '23505' })
  })
})

describe('isUniqueViolation', () => {
  const err = new Error('wrap', { cause: pgError('23505', 'users_mobile_unique') })

  it('matches any unique violation without a constraint', () => {
    expect(isUniqueViolation(err)).toBe(true)
  })

  it('matches only the given constraint', () => {
    expect(isUniqueViolation(err, 'users_mobile_unique')).toBe(true)
    expect(isUniqueViolation(err, 'other')).toBe(false)
  })

  it('rejects other codes', () => {
    expect(isUniqueViolation(pgError('23503'))).toBe(false)
  })

  it('accepts the unwrap hook', () => {
    const unwrap = (value: object): unknown => Reflect.get(value, PARKED)
    expect(isUniqueViolation({ [PARKED]: pgError('23505') }, undefined, { unwrap })).toBe(true)
  })
})

describe('isForeignKeyViolation', () => {
  it('matches foreign-key violations, optionally by constraint', () => {
    const err = pgError('23503', 'orders_customer_fk')
    expect(isForeignKeyViolation(err)).toBe(true)
    expect(isForeignKeyViolation(err, 'orders_customer_fk')).toBe(true)
    expect(isForeignKeyViolation(err, 'other')).toBe(false)
    expect(isForeignKeyViolation(pgError('23505'))).toBe(false)
  })
})
