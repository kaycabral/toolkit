import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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

import { cloudSqlIam } from './cloud-sql'

const iam = cloudSqlIam({
  enabledEnvVar: 'TEST_USE_IAM_AUTH',
  instanceEnvVar: 'TEST_CLOUDSQL_INSTANCE',
  userEnvVar: 'TEST_IAM_DB_USER',
})

beforeEach(() => {
  getOptions.mockClear()
  connectorClose.mockClear()
  process.env.TEST_CLOUDSQL_INSTANCE = 'proj:region:inst'
  process.env.TEST_IAM_DB_USER = 'sa@proj.iam'
})

afterEach(() => {
  delete process.env.TEST_CLOUDSQL_INSTANCE
  delete process.env.TEST_IAM_DB_USER
})

describe('cloudSqlIam', () => {
  it('exposes the env var that enables it', () => {
    expect(iam.enabledEnvVar).toBe('TEST_USE_IAM_AUTH')
  })

  it('dials the private IP with IAM auth and sets the IAM user', async () => {
    const { options, close } = await iam.connect('testdb')
    expect(getOptions).toHaveBeenCalledWith({
      instanceConnectionName: 'proj:region:inst',
      authType: 'IAM',
      ipType: 'PRIVATE',
    })
    expect(options).toEqual({ host: '/sock', ssl: false, user: 'sa@proj.iam' })
    close()
    expect(connectorClose).toHaveBeenCalledOnce()
  })

  it('fails fast when the instance env var is missing', async () => {
    delete process.env.TEST_CLOUDSQL_INSTANCE
    await expect(iam.connect('testdb')).rejects.toThrow(/TEST_CLOUDSQL_INSTANCE/)
    expect(getOptions).not.toHaveBeenCalled()
  })

  it('fails fast when the IAM user env var is missing', async () => {
    delete process.env.TEST_IAM_DB_USER
    await expect(iam.connect('testdb')).rejects.toThrow(/TEST_IAM_DB_USER/)
  })
})
