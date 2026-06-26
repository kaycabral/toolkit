import { describe, expect, it } from 'vitest'

import { coverageBase } from './index'

describe('coverageBase', () => {
  it('returns the shared v8 coverage config the apps spread', () => {
    const base = coverageBase()
    expect(base.provider).toBe('v8')
    expect(base.include).toEqual(['src/**/*.{ts,tsx}'])
    // Test/spec/d.ts/__mocks__ never count as source.
    expect(base.exclude).toContain('src/**/*.{test,spec}.{ts,tsx}')
    expect(base.exclude).toContain('src/**/*.d.ts')
    // json-summary feeds the quality snapshot.
    expect(base.reporter).toEqual(['text-summary', 'json-summary'])
    expect(base.reportsDirectory).toBe('./coverage')
  })
})
