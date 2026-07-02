import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the heavy I/O deps so the factory's BRANCHING logic is unit-tested with no
// socket / network: `pg.Pool` records its config, the connector records its call.
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

const getOptions = vi.fn(() => Promise.resolve({ host: '/sock', ssl: false }))
const connectorClose = vi.fn()
vi.mock('@google-cloud/cloud-sql-connector', () => ({
  AuthTypes: { IAM: 'IAM' },
  IpAddressTypes: { PRIVATE: 'PRIVATE' },
  Connector: class {
    getOptions = getOptions
    close = connectorClose
  },
}))

import {
  closeManagedPool,
  createManagedPool,
  createManagedPoolSync,
  getOrCreateManagedPoolSync,
  initManagedPool,
  type PoolEnvConfig,
} from './index'

const CFG: PoolEnvConfig = {
  connectionStringEnvVar: 'TEST_DATABASE_URL',
  iamAuthEnvVar: 'TEST_USE_IAM_AUTH',
  instanceEnvVar: 'TEST_CLOUDSQL_INSTANCE',
  iamUserEnvVar: 'TEST_IAM_DB_USER',
  database: 'testdb',
}

beforeEach(() => {
  poolCtor.mockClear()
  poolEnd.mockClear()
  poolOn.mockClear()
  getOptions.mockClear()
  connectorClose.mockClear()
  delete process.env.TEST_USE_IAM_AUTH
  process.env.TEST_DATABASE_URL = 'postgres://u:p@localhost:5432/testdb'
  process.env.TEST_CLOUDSQL_INSTANCE = 'proj:region:inst'
  process.env.TEST_IAM_DB_USER = 'sa@proj.iam'
})

afterEach(() => {
  delete process.env.TEST_DATABASE_URL
  delete process.env.TEST_CLOUDSQL_INSTANCE
  delete process.env.TEST_IAM_DB_USER
  delete process.env.TEST_USE_IAM_AUTH
})

describe('createManagedPoolSync (password mode)', () => {
  it('builds a pool from the connection string', () => {
    const { pool } = createManagedPoolSync(CFG)
    expect(pool).toBeDefined()
    expect(poolCtor).toHaveBeenCalledWith(
      expect.objectContaining({ connectionString: 'postgres://u:p@localhost:5432/testdb' }),
    )
    expect(getOptions).not.toHaveBeenCalled()
  })

  it('close() ends the pool', async () => {
    const { close } = createManagedPoolSync(CFG)
    await close()
    expect(poolEnd).toHaveBeenCalledOnce()
  })

  // Regression: without a Pool 'error' listener, a dropped IDLE client (Cloud SQL
  // recycling a connection, ephemeral test Postgres torn down — 57P01) escalates
  // to an uncaughtException that KILLS the process. The factory must always attach
  // the swallow-and-log handler. See attachPoolErrorHandler.
  it('attaches an idle-client error handler that logs and SWALLOWS (never rethrows, or it re-escalates to uncaughtException)', () => {
    createManagedPoolSync(CFG)
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

  it('throws in IAM mode (the connector is async — use createManagedPool)', () => {
    process.env.TEST_USE_IAM_AUTH = 'true'
    expect(() => createManagedPoolSync(CFG)).toThrow(/requires async init/)
  })

  it('throws when the connection-string env var is missing', () => {
    delete process.env.TEST_DATABASE_URL
    expect(() => createManagedPoolSync(CFG)).toThrow()
  })
})

describe('createManagedPool (async)', () => {
  it('password mode resolves to a connection-string pool', async () => {
    const { pool } = await createManagedPool(CFG)
    expect(pool).toBeDefined()
    expect(getOptions).not.toHaveBeenCalled()
    expect(poolCtor).toHaveBeenCalledWith(
      expect.objectContaining({ connectionString: 'postgres://u:p@localhost:5432/testdb' }),
    )
  })

  it('IAM mode uses the connector + the IAM user, no connection string', async () => {
    process.env.TEST_USE_IAM_AUTH = 'true'
    const { close } = await createManagedPool(CFG)
    expect(getOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        instanceConnectionName: 'proj:region:inst',
        authType: 'IAM',
        ipType: 'PRIVATE',
      }),
    )
    expect(poolCtor).toHaveBeenCalledWith(
      expect.objectContaining({ user: 'sa@proj.iam', database: 'testdb' }),
    )
    const cfgArg = poolCtor.mock.calls[0]?.[0]
    expect(cfgArg).not.toHaveProperty('connectionString')
    // close() ends the pool AND closes the connector.
    await close()
    expect(poolEnd).toHaveBeenCalledOnce()
    expect(connectorClose).toHaveBeenCalledOnce()
  })

  it('IAM mode throws when the instance env var is missing', async () => {
    process.env.TEST_USE_IAM_AUTH = 'true'
    delete process.env.TEST_CLOUDSQL_INSTANCE
    await expect(createManagedPool(CFG)).rejects.toThrow()
  })
})

// The prod signup-500 regression. Under the Next standalone build Turbopack
// duplicates the consumer's `pool.ts` across the instrumentation entry and the
// route entries, so a module-level `let managed` splits: boot fills one copy,
// requests read the other (undefined) and fall through to the sync builder —
// which THROWS under IAM. The registry lives on `globalThis` (one per process),
// so the boot-opened pool is visible to every copy. These tests exercise that
// contract directly (module duplication reduces to: does the getter read what
// init wrote, via shared global state).
describe('managed-pool registry (globalThis singleton — signup-500 fix)', () => {
  afterEach(async () => {
    // Drop the registered pool so each test starts clean (the registry is
    // process-global by design).
    await closeManagedPool(CFG).catch(() => undefined)
    delete process.env.TEST_USE_IAM_AUTH
  })

  it('under IAM, initManagedPool() at boot lets the sync getter return WITHOUT throwing', async () => {
    process.env.TEST_USE_IAM_AUTH = 'true'
    // Sanity: without boot init, the sync getter throws (the exact prod symptom).
    expect(() => getOrCreateManagedPoolSync(CFG)).toThrow(/requires async init/)
    // Boot init opens the pool via the async connector and registers it.
    await initManagedPool(CFG)
    // Now the sync getter — as called from a request handler, even a duplicated
    // module copy — reads the registry and never reaches the throw.
    const first = getOrCreateManagedPoolSync(CFG)
    expect(first.pool).toBeDefined()
    // Idempotent + identity-stable: same pool instance every time.
    expect(getOrCreateManagedPoolSync(CFG)).toBe(first)
  })

  it('initManagedPool() is idempotent (a second boot call is a no-op)', async () => {
    await initManagedPool(CFG)
    const p1 = getOrCreateManagedPoolSync(CFG)
    await initManagedPool(CFG)
    expect(getOrCreateManagedPoolSync(CFG)).toBe(p1)
  })

  it('password mode: sync getter lazily builds and registers the pool (no boot needed)', () => {
    const p = getOrCreateManagedPoolSync(CFG)
    expect(p.pool).toBeDefined()
    expect(getOrCreateManagedPoolSync(CFG)).toBe(p)
  })

  it('closeManagedPool() removes it so the next get rebuilds', async () => {
    const p1 = getOrCreateManagedPoolSync(CFG)
    await closeManagedPool(CFG)
    expect(poolEnd).toHaveBeenCalled()
    const p2 = getOrCreateManagedPoolSync(CFG)
    expect(p2).not.toBe(p1)
  })

  it('closeManagedPool() is a no-op when nothing is registered', async () => {
    await expect(closeManagedPool(CFG)).resolves.toBeUndefined()
    expect(poolEnd).not.toHaveBeenCalled()
  })

  it('reuses the same registry across separate calls (globalThis is not re-created)', () => {
    // Second registry access must hit the `??=` already-present branch, not a
    // fresh Map — else pools opened at boot would vanish between calls.
    const p1 = getOrCreateManagedPoolSync(CFG)
    const p2 = getOrCreateManagedPoolSync(CFG)
    expect(p2).toBe(p1)
  })
})
