import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock `pg` so the factory's policy is unit-tested with no socket: `pg.Pool`
// records its config.
const poolCtor = vi.fn<(config: unknown) => void>()
const poolEnd = vi.fn(() => Promise.resolve())
const poolOn = vi.fn<(event: string, listener: (err: Error) => void) => void>()
vi.mock('pg', () => ({
  Pool: class {
    constructor(config: unknown) {
      poolCtor(config)
    }
    end = poolEnd
    on = poolOn
  },
}))

import {
  closeManagedPool,
  createManagedPool,
  getOrCreateManagedPool,
  type PoolEnvConfig,
} from './pool'

const CFG: PoolEnvConfig = {
  connectionStringEnvVar: 'TEST_DATABASE_URL',
  database: 'testdb',
}

beforeEach(() => {
  poolCtor.mockClear()
  poolEnd.mockClear()
  poolOn.mockClear()
  process.env.TEST_DATABASE_URL = 'postgres://u:p@localhost:5432/testdb'
})

afterEach(() => {
  delete process.env.TEST_DATABASE_URL
})

describe('createManagedPool', () => {
  it('builds a pool from the connection string', () => {
    const { pool } = createManagedPool(CFG)
    expect(pool).toBeDefined()
    expect(poolCtor).toHaveBeenCalledWith(
      expect.objectContaining({ connectionString: 'postgres://u:p@localhost:5432/testdb' }),
    )
  })

  it('passes no ssl option unless the ssl resolver returns one', () => {
    createManagedPool({ ...CFG, ssl: () => undefined })
    expect(poolCtor.mock.calls[0]?.[0]).not.toHaveProperty('ssl')
  })

  it('applies the ssl policy resolved from the connection string', () => {
    const resolver = vi.fn((url: string) => (url.includes('localhost') ? { ca: 'PEM' } : undefined))
    createManagedPool({ ...CFG, ssl: resolver })
    expect(resolver).toHaveBeenCalledWith('postgres://u:p@localhost:5432/testdb')
    expect(poolCtor).toHaveBeenCalledWith(expect.objectContaining({ ssl: { ca: 'PEM' } }))
  })

  it('strips URL ssl params when the resolver owns TLS, so they cannot override it', () => {
    process.env.TEST_DATABASE_URL = 'postgres://u:p@localhost:5432/testdb?sslmode=require&x=1'
    createManagedPool({ ...CFG, ssl: () => ({ ca: 'PEM' }) })
    expect(poolCtor).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionString: 'postgres://u:p@localhost:5432/testdb?x=1',
        ssl: { ca: 'PEM' },
      }),
    )
  })

  it('keeps URL ssl params when no resolver applies', () => {
    process.env.TEST_DATABASE_URL = 'postgres://u:p@localhost:5432/testdb?sslmode=disable'
    createManagedPool(CFG)
    expect(poolCtor).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionString: 'postgres://u:p@localhost:5432/testdb?sslmode=disable',
      }),
    )
  })

  it('close() ends the pool', async () => {
    const { close } = createManagedPool(CFG)
    await close()
    expect(poolEnd).toHaveBeenCalledOnce()
  })

  // Regression (CI flake): a pool with NO defensive timeouts never reclaims a
  // stalled connection (a `57P01` half-open socket, a query blocked under load),
  // and with `max: 5` a few zombies exhaust the pool and freeze every subsequent
  // write — the "passes locally, flakes in CI" 30s dead window that timed out four
  // unrelated write-path E2E specs at once. The factory must bound every failure
  // mode so a wedged connection fails fast and self-heals. See POOL_TUNING.
  it('applies defensive timeouts so a stalled connection cannot wedge the pool', () => {
    createManagedPool(CFG)
    expect(poolCtor).toHaveBeenCalledWith(
      expect.objectContaining({
        max: 5,
        connectionTimeoutMillis: 10_000,
        statement_timeout: 30_000,
        query_timeout: 30_000,
        idle_in_transaction_session_timeout: 15_000,
        keepAlive: true,
      }),
    )
  })

  // Regression: without a Pool 'error' listener, a dropped IDLE client (the
  // provider recycling a connection, ephemeral test Postgres torn down — 57P01)
  // escalates to an uncaughtException that KILLS the process. The factory must
  // always attach the swallow-and-log handler. See attachPoolErrorHandler.
  it('attaches an idle-client error handler that logs and SWALLOWS (never rethrows, or it re-escalates to uncaughtException)', () => {
    createManagedPool(CFG)
    expect(poolOn).toHaveBeenCalledWith('error', expect.any(Function))
    const errorCall = poolOn.mock.calls.find(([evt]) => evt === 'error')
    const handler = errorCall?.[1]
    expect(typeof handler).toBe('function')
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const dropped = Object.assign(
      new Error('terminating connection due to administrator command'),
      {
        code: '57P01',
      },
    )
    expect(() => handler?.(dropped)).not.toThrow()
    expect(errorSpy).toHaveBeenCalledOnce()
    expect(errorSpy.mock.calls[0]?.[0]).toContain('pg_pool_idle_client_error')
    expect(errorSpy.mock.calls[0]?.[0]).toContain('57P01')

    // A plain Error with no SQLSTATE `code` must still be tolerated (code omitted,
    // never crash) — exercises the guard's absent-code branch.
    expect(() => handler?.(new Error('socket hang up'))).not.toThrow()
    expect(errorSpy.mock.calls[1]?.[0]).toContain('socket hang up')

    errorSpy.mockRestore()
  })

  it('throws when the connection-string env var is missing', () => {
    delete process.env.TEST_DATABASE_URL
    expect(() => createManagedPool(CFG)).toThrow(/TEST_DATABASE_URL/)
  })
})

// Under the Next standalone build Turbopack duplicates the consumer's `pool.ts`
// across the instrumentation entry and the route entries, so a module-level
// `let managed` splits: boot fills one copy, requests read the other. The
// registry lives on `globalThis` (one per process), so the boot-opened pool is
// visible to every copy.
describe('managed-pool registry (globalThis singleton)', () => {
  afterEach(async () => {
    await closeManagedPool(CFG)
  })

  it('lazily builds and registers the pool, then returns the same instance', () => {
    const p = getOrCreateManagedPool(CFG)
    expect(p.pool).toBeDefined()
    expect(getOrCreateManagedPool(CFG)).toBe(p)
    expect(poolCtor).toHaveBeenCalledOnce()
  })

  it('shares the pool through globalThis, not module state', () => {
    const p = getOrCreateManagedPool(CFG)
    const reg: unknown = Reflect.get(globalThis, Symbol.for('@cbrl/pg.managedPools'))
    expect(reg).toBeInstanceOf(Map)
    expect(reg instanceof Map ? reg.get('testdb') : undefined).toBe(p)
  })

  it('closeManagedPool() removes it so the next get rebuilds', async () => {
    const p1 = getOrCreateManagedPool(CFG)
    await closeManagedPool(CFG)
    expect(poolEnd).toHaveBeenCalled()
    const p2 = getOrCreateManagedPool(CFG)
    expect(p2).not.toBe(p1)
  })

  it('closeManagedPool() is a no-op when nothing is registered', async () => {
    await closeManagedPool(CFG)
    poolEnd.mockClear()
    await expect(closeManagedPool(CFG)).resolves.toBeUndefined()
    expect(poolEnd).not.toHaveBeenCalled()
  })
})
