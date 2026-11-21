import { describe, expect, it } from 'vitest'
import * as pg from './index'

describe('@cbrl/pg entry', () => {
  it('exposes the pool, error and Supabase helpers only', () => {
    expect(Object.keys(pg).sort()).toEqual([
      'PG_ERROR',
      'SUPABASE_ROOT_CA_2021',
      'closeManagedPool',
      'createManagedPool',
      'getOrCreateManagedPool',
      'isForeignKeyViolation',
      'isUniqueViolation',
      'pgErrorOf',
      'stripSslParams',
      'supabaseSsl',
    ])
  })
})
