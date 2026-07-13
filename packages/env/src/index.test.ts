import { afterEach, describe, expect, it } from 'vitest'

import { readEnvFlag, requireEnv, requireEnvNumber, requireEnvOneOf } from './index'

const KEY = 'CBRL_ENV_TEST_VAR'
const KEY_A = 'CBRL_ENV_TEST_A'
const KEY_B = 'CBRL_ENV_TEST_B'

afterEach(() => {
  delete process.env[KEY]
  delete process.env[KEY_A]
  delete process.env[KEY_B]
})

describe('requireEnv', () => {
  it('returns the value when set', () => {
    process.env[KEY] = 'hello'
    expect(requireEnv(KEY)).toBe('hello')
  })

  it('throws when unset', () => {
    expect(() => requireEnv(KEY)).toThrow(`Missing required env: ${KEY}`)
  })

  it('throws when empty', () => {
    process.env[KEY] = ''
    expect(() => requireEnv(KEY)).toThrow(`Missing required env: ${KEY}`)
  })
})

describe('requireEnvOneOf', () => {
  it('returns the first set value', () => {
    process.env[KEY_B] = 'from-b'
    expect(requireEnvOneOf(KEY_A, KEY_B)).toBe('from-b')
  })

  it('prefers earlier names', () => {
    process.env[KEY_A] = 'from-a'
    process.env[KEY_B] = 'from-b'
    expect(requireEnvOneOf(KEY_A, KEY_B)).toBe('from-a')
  })

  it('throws listing all names when none is set', () => {
    expect(() => requireEnvOneOf(KEY_A, KEY_B)).toThrow(`set one of ${KEY_A}, ${KEY_B}`)
  })
})

describe('requireEnvNumber', () => {
  it('coerces a positive number', () => {
    process.env[KEY] = '42'
    expect(requireEnvNumber(KEY)).toBe(42)
  })

  it('throws when unset', () => {
    expect(() => requireEnvNumber(KEY)).toThrow(`Missing required env: ${KEY}`)
  })

  it('throws on a non-numeric value', () => {
    process.env[KEY] = 'abc'
    expect(() => requireEnvNumber(KEY)).toThrow(/expected a positive number/)
  })

  it('throws on zero and negatives', () => {
    process.env[KEY] = '0'
    expect(() => requireEnvNumber(KEY)).toThrow(/expected a positive number/)
    process.env[KEY] = '-3'
    expect(() => requireEnvNumber(KEY)).toThrow(/expected a positive number/)
  })
})

describe('readEnvFlag', () => {
  it('is off when unset (fail-safe default hides)', () => {
    expect(readEnvFlag(KEY)).toBe(false)
  })

  it('is off when empty', () => {
    process.env[KEY] = ''
    expect(readEnvFlag(KEY)).toBe(false)
  })

  it('is on for "true" and "1"', () => {
    process.env[KEY] = 'true'
    expect(readEnvFlag(KEY)).toBe(true)
    process.env[KEY] = '1'
    expect(readEnvFlag(KEY)).toBe(true)
  })

  it('is case- and whitespace-insensitive', () => {
    process.env[KEY] = '  TRUE '
    expect(readEnvFlag(KEY)).toBe(true)
  })

  it('is off for any other value, including typos', () => {
    for (const raw of ['false', '0', 'yes', 'on', 'ON', 'truthy']) {
      process.env[KEY] = raw
      expect(readEnvFlag(KEY)).toBe(false)
    }
  })
})
