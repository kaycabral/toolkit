import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const poolCtor = vi.fn<(config: unknown) => void>()
const poolEnd = vi.fn(() => Promise.resolve())
const poolQuery = vi.fn((_sql: string) => Promise.resolve({ rows: [] }))
vi.mock('pg', () => ({
  Pool: class {
    constructor(config: unknown) {
      poolCtor(config)
    }
    end = poolEnd
    on = vi.fn()
    query = poolQuery
  },
}))

const drizzleFn = vi.fn((client: unknown, config: unknown) => ({ client, config }))
vi.mock('drizzle-orm/node-postgres', () => ({ drizzle: drizzleFn }))

const migrateFn = vi.fn((_db: unknown, _config: unknown) => Promise.resolve())
vi.mock('drizzle-orm/node-postgres/migrator', () => ({ migrate: migrateFn }))

const { createDrizzleDatabase, drizzleKitCredentials } = await import('./drizzle')
const { SUPABASE_ROOT_CA_2021, supabaseSsl } = await import('./supabase')

const schema = { users: { name: 'users' } }

const database = createDrizzleDatabase({
  connectionStringEnvVar: 'TEST_DRIZZLE_URL',
  database: 'drizzletest',
  schema,
  migrationsFolder: '/app/drizzle',
})

beforeEach(() => {
  vi.clearAllMocks()
  process.env.TEST_DRIZZLE_URL = 'postgres://u:p@localhost:5432/app'
})

afterEach(async () => {
  await database.close()
  delete process.env.TEST_DRIZZLE_URL
})

describe('createDrizzleDatabase', () => {
  it('opens nothing until first use', () => {
    createDrizzleDatabase({
      connectionStringEnvVar: 'UNSET_ENV_VAR',
      database: 'never',
      schema,
      migrationsFolder: '/x',
    })
    expect(poolCtor).not.toHaveBeenCalled()
  })

  it('pool() returns the registered pool', () => {
    const pool = database.pool()
    expect(database.pool()).toBe(pool)
    expect(poolCtor).toHaveBeenCalledOnce()
  })

  it('db() binds Drizzle to the pool with the schema, cached per pool', () => {
    const db = database.db()
    expect(drizzleFn).toHaveBeenCalledWith(database.pool(), { schema })
    expect(database.db()).toBe(db)
    expect(drizzleFn).toHaveBeenCalledOnce()
  })

  it('db() rebuilds after close() opens a new pool', async () => {
    const first = database.db()
    await database.close()
    expect(poolEnd).toHaveBeenCalledOnce()
    expect(database.db()).not.toBe(first)
  })

  it('ping() runs select 1', async () => {
    await database.ping()
    expect(poolQuery).toHaveBeenCalledWith('select 1')
  })

  it('migrate() runs the migrator on the registered pool', async () => {
    await database.migrate()
    expect(migrateFn).toHaveBeenCalledWith(database.db(), { migrationsFolder: '/app/drizzle' })
  })

  it('migrate() accepts a file URL folder and a custom journal table', async () => {
    const product = createDrizzleDatabase({
      connectionStringEnvVar: 'TEST_DRIZZLE_URL',
      database: 'drizzletest',
      schema,
      migrationsFolder: new URL('file:///app/product/drizzle'),
      migrationsTable: '__drizzle_migrations_product',
    })
    await product.migrate()
    expect(migrateFn).toHaveBeenCalledWith(expect.anything(), {
      migrationsFolder: '/app/product/drizzle',
      migrationsTable: '__drizzle_migrations_product',
    })
  })

  it('migrate({ connectionString }) uses a dedicated pool with the same TLS policy and closes it', async () => {
    const supabase = createDrizzleDatabase({
      connectionStringEnvVar: 'TEST_DRIZZLE_URL',
      database: 'drizzletest',
      ssl: supabaseSsl,
      schema,
      migrationsFolder: '/app/drizzle',
    })
    await supabase.migrate({
      connectionString: 'postgres://owner:p@db.abc.supabase.co:5432/postgres?sslmode=require',
    })
    expect(poolCtor).toHaveBeenCalledOnce()
    expect(poolCtor).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionString: 'postgres://owner:p@db.abc.supabase.co:5432/postgres',
        ssl: { ca: SUPABASE_ROOT_CA_2021 },
      }),
    )
    expect(migrateFn).toHaveBeenCalledOnce()
    expect(poolEnd).toHaveBeenCalledOnce()
  })

  it('migrate({ connectionString }) closes the dedicated pool when the migrator fails', async () => {
    migrateFn.mockRejectedValueOnce(new Error('lock timeout'))
    await expect(
      database.migrate({ connectionString: 'postgres://u:p@localhost:5432/other' }),
    ).rejects.toThrow('lock timeout')
    expect(poolEnd).toHaveBeenCalledOnce()
  })
})

describe('drizzleKitCredentials', () => {
  afterEach(() => {
    delete process.env.TEST_NON_POOLING
    delete process.env.TEST_POOLED
  })

  it('prefers the first env var that is set', () => {
    process.env.TEST_NON_POOLING = 'postgres://u:p@localhost:5432/direct'
    process.env.TEST_POOLED = 'postgres://u:p@localhost:6543/pooled'
    expect(drizzleKitCredentials('TEST_NON_POOLING', 'TEST_POOLED')).toEqual({
      url: 'postgres://u:p@localhost:5432/direct',
    })
  })

  it('falls back to the next env var', () => {
    process.env.TEST_POOLED = 'postgres://u:p@localhost:6543/pooled?sslmode=disable'
    expect(drizzleKitCredentials('TEST_NON_POOLING', 'TEST_POOLED')).toEqual({
      url: 'postgres://u:p@localhost:6543/pooled?sslmode=disable',
    })
  })

  it('pins the Supabase CA and strips URL ssl params', () => {
    process.env.TEST_POOLED =
      'postgres://u:p@aws-0-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require'
    expect(drizzleKitCredentials('TEST_POOLED')).toEqual({
      url: 'postgres://u:p@aws-0-sa-east-1.pooler.supabase.com:5432/postgres',
      ssl: { ca: SUPABASE_ROOT_CA_2021 },
    })
  })

  it('throws listing the env vars when none is set', () => {
    expect(() => drizzleKitCredentials('TEST_NON_POOLING', 'TEST_POOLED')).toThrow(
      /TEST_NON_POOLING, TEST_POOLED/,
    )
  })
})
