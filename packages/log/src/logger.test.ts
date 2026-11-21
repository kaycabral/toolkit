import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLogger, DEFAULT_PII_KEYS, logger, type LogLevel } from './logger'
import { runWithRequestContext, setRequestContextField } from './request-context'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function parseLine(arg: unknown): Readonly<Record<string, unknown>> {
  if (typeof arg !== 'string') throw new Error('log line is not a string')
  const parsed: unknown = JSON.parse(arg)
  if (!isRecord(parsed)) throw new Error('log line is not an object')
  return parsed
}

function spyStdout() {
  return vi.spyOn(console, 'log').mockImplementation(() => undefined)
}

function spyStderr() {
  return vi.spyOn(console, 'error').mockImplementation(() => undefined)
}

describe('logger output', () => {
  it('writes info/debug to stdout as a JSON line with level + message + ts', () => {
    const log = spyStdout()
    logger.info('hello', { orgId: 'org-1' })
    expect(log).toHaveBeenCalledTimes(1)
    const entry = parseLine(log.mock.calls[0]?.[0])
    expect(entry).toMatchObject({ level: 'info', message: 'hello', orgId: 'org-1' })
    expect(entry.ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)

    const level: LogLevel = 'debug'
    logger[level]('dbg')
    expect(parseLine(log.mock.calls[1]?.[0])).toMatchObject({ level: 'debug', message: 'dbg' })
  })

  it('routes warn + error to stderr', () => {
    const err = spyStderr()
    logger.warn('careful')
    logger.error('boom', { code: '500' })
    expect(err).toHaveBeenCalledTimes(2)
    expect(parseLine(err.mock.calls[0]?.[0])).toMatchObject({ level: 'warn', message: 'careful' })
    expect(parseLine(err.mock.calls[1]?.[0])).toMatchObject({
      level: 'error',
      message: 'boom',
      code: '500',
    })
  })

  it('emits the Cloud Logging `severity` field mapped from the level', () => {
    const log = spyStdout()
    const err = spyStderr()
    const levels: readonly LogLevel[] = ['debug', 'info', 'warn', 'error']
    for (const level of levels) logger[level](level)
    expect(parseLine(log.mock.calls[0]?.[0]).severity).toBe('DEBUG')
    expect(parseLine(log.mock.calls[1]?.[0]).severity).toBe('INFO')
    expect(parseLine(err.mock.calls[0]?.[0]).severity).toBe('WARNING')
    expect(parseLine(err.mock.calls[1]?.[0]).severity).toBe('ERROR')
  })

  it('also emits JSON in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const log = spyStdout()
    logger.info('prod')
    expect(parseLine(log.mock.calls[0]?.[0])).toMatchObject({ message: 'prod' })
  })

  it('never lets meta overwrite the reserved fields', () => {
    const log = spyStdout()
    logger.info('real', { message: 'fake', level: 'error', severity: 'ERROR', ts: 'x' })
    const entry = parseLine(log.mock.calls[0]?.[0])
    expect(entry).toMatchObject({ message: 'real', level: 'info', severity: 'INFO' })
    expect(entry.ts).not.toBe('x')
  })
})

describe('logger request context', () => {
  it('injects correlationId + extra fields from the active request context', () => {
    const err = spyStderr()
    runWithRequestContext({ correlationId: 'corr-123', orgId: 'org-9' }, () => {
      setRequestContextField('route', '/api/x')
      logger.error('inside scope')
    })
    expect(parseLine(err.mock.calls[0]?.[0])).toMatchObject({
      message: 'inside scope',
      correlationId: 'corr-123',
      orgId: 'org-9',
      route: '/api/x',
    })
  })

  it('skips context fields that are unset', () => {
    const log = spyStdout()
    runWithRequestContext({ correlationId: 'c', orgId: undefined }, () => logger.info('x'))
    expect(parseLine(log.mock.calls[0]?.[0])).not.toHaveProperty('orgId')
  })

  it('lets meta override a context field', () => {
    const log = spyStdout()
    runWithRequestContext({ correlationId: 'c', orgId: 'ctx' }, () => {
      logger.info('x', { orgId: 'meta' })
    })
    expect(parseLine(log.mock.calls[0]?.[0]).orgId).toBe('meta')
  })

  it('redacts PII keys that reach the context', () => {
    const log = spyStdout()
    runWithRequestContext({ correlationId: 'c', email: 'a@b.com' }, () => logger.info('x'))
    expect(parseLine(log.mock.calls[0]?.[0]).email).toBe('[redacted]')
  })

  it('degrades cleanly with no correlationId when outside any request scope', () => {
    const err = spyStderr()
    logger.error('no scope')
    const entry = parseLine(err.mock.calls[0]?.[0])
    expect(entry.message).toBe('no scope')
    expect(entry).not.toHaveProperty('correlationId')
    expect(entry).not.toHaveProperty('orgId')
  })
})

describe('logger errors', () => {
  it('serializes an Error in meta to name/message/stack instead of {}', () => {
    const err = spyStderr()
    const boom = new TypeError('duplicate key on org_links_pkey')
    logger.error('transaction defect', { scope: 'commitSaga', defect: boom })
    const defect = parseLine(err.mock.calls[0]?.[0]).defect
    if (!isRecord(defect)) throw new Error('defect should serialize to an object')
    expect(defect.message).toBe('duplicate key on org_links_pkey')
    expect(defect.name).toBe('TypeError')
    expect(typeof defect.stack).toBe('string')
  })

  it('surfaces a string code (pg SQLSTATE) but never the PII-bearing detail', () => {
    const err = spyStderr()
    const pgErr = Object.assign(new Error('unique violation'), {
      code: '23505',
      detail: 'Key (whatsapp)=(+5511999999999) already exists',
    })
    logger.error('write failed', { scope: 'x', err: pgErr })
    const entry = parseLine(err.mock.calls[0]?.[0])
    const serialized = entry.err
    if (!isRecord(serialized)) throw new Error('err should serialize to an object')
    expect(serialized.code).toBe('23505')
    expect(serialized).not.toHaveProperty('detail')
    expect(JSON.stringify(entry)).not.toContain('5511999999999')
  })

  it('drops a non-string code and a missing stack', () => {
    const err = spyStderr()
    const odd = Object.assign(new Error('odd'), { code: 42 })
    odd.stack = undefined
    logger.error('x', { err: odd })
    const serialized = parseLine(err.mock.calls[0]?.[0]).err
    expect(serialized).toEqual({ name: 'Error', message: 'odd' })
  })
})

describe('logger PII redaction', () => {
  it('redacts known PII keys in meta (defence in depth), recursively', () => {
    const err = spyStderr()
    logger.error('leak?', {
      whatsapp: '+5511999999999',
      mobile: '5511988887777',
      email: 'a@b.com',
      orgId: 'org-1',
      nested: { email: 'deep@b.com', ok: 'keep' },
    })
    const entry = parseLine(err.mock.calls[0]?.[0])
    expect(entry.whatsapp).toBe('[redacted]')
    expect(entry.mobile).toBe('[redacted]')
    expect(entry.email).toBe('[redacted]')
    const nested = entry.nested
    if (!isRecord(nested)) throw new Error('nested should be an object')
    expect(nested.email).toBe('[redacted]')
    expect(nested.ok).toBe('keep')
    expect(entry.orgId).toBe('org-1')
  })

  it('redacts every default key, case-insensitively', () => {
    const log = spyStdout()
    const meta = Object.fromEntries(DEFAULT_PII_KEYS.map((key) => [key.toUpperCase(), 'secret']))
    logger.info('x', meta)
    const entry = parseLine(log.mock.calls[0]?.[0])
    for (const key of DEFAULT_PII_KEYS) expect(entry[key.toUpperCase()]).toBe('[redacted]')
  })

  it('covers the baseline PII set', () => {
    expect(DEFAULT_PII_KEYS).toEqual(
      expect.arrayContaining([
        'email',
        'phone',
        'mobile',
        'whatsapp',
        'document',
        'cpf',
        'cnpj',
        'password',
        'token',
        'authorization',
        'cookie',
        'ip',
      ]),
    )
  })

  it('redacts whole objects and arrays under a PII key, but keeps null/undefined', () => {
    const log = spyStdout()
    logger.info('x', {
      document: { number: '123' },
      phone: ['1', '2'],
      cpf: null,
      email: undefined,
    })
    const entry = parseLine(log.mock.calls[0]?.[0])
    expect(entry.document).toBe('[redacted]')
    expect(entry.phone).toBe('[redacted]')
    expect(entry.cpf).toBeNull()
    expect(entry).not.toHaveProperty('email')
  })

  it('walks arrays of objects', () => {
    const log = spyStdout()
    logger.info('x', { users: [{ id: 'u1', email: 'a@b.com' }, 'plain'] })
    expect(parseLine(log.mock.calls[0]?.[0]).users).toEqual([
      { id: 'u1', email: '[redacted]' },
      'plain',
    ])
  })

  it('redacts PII inside an Error-valued key path', () => {
    const log = spyStdout()
    logger.info('x', { token: new Error('t') })
    expect(parseLine(log.mock.calls[0]?.[0]).token).toBe('[redacted]')
  })

  it('serializes dates, bigints and circular references without throwing', () => {
    const log = spyStdout()
    const loop: Record<string, unknown> = { id: 'a' }
    loop.self = loop
    const at = new Date('2026-01-02T03:04:05.000Z')
    logger.info('x', { at, big: 10n, loop })
    const entry = parseLine(log.mock.calls[0]?.[0])
    expect(entry.at).toBe('2026-01-02T03:04:05.000Z')
    expect(entry.big).toBe('10')
    expect(entry.loop).toEqual({ id: 'a', self: '[circular]' })
  })

  it('logs the same object twice when it is shared, not circular', () => {
    const log = spyStdout()
    const shared = { id: 's' }
    logger.info('x', { a: shared })
    logger.info('y', { b: shared })
    expect(parseLine(log.mock.calls[1]?.[0]).b).toEqual({ id: 's' })
  })
})

describe('createLogger', () => {
  it('extends the default PII keys, case-insensitively', () => {
    const log = spyStdout()
    const custom = createLogger({ piiKeys: ['FullName', 'birthDate'] })
    custom.info('x', { fullname: 'Ana', BIRTHDATE: '2000-01-01', email: 'a@b.com', id: '1' })
    expect(parseLine(log.mock.calls[0]?.[0])).toMatchObject({
      fullname: '[redacted]',
      BIRTHDATE: '[redacted]',
      email: '[redacted]',
      id: '1',
    })
  })

  it('accepts any iterable and leaves the default logger unaffected', () => {
    const log = spyStdout()
    createLogger({ piiKeys: new Set(['nickname']) }).info('x', { nickname: 'n' })
    logger.info('y', { nickname: 'n' })
    expect(parseLine(log.mock.calls[0]?.[0]).nickname).toBe('[redacted]')
    expect(parseLine(log.mock.calls[1]?.[0]).nickname).toBe('n')
  })
})

describe('pretty output (development)', () => {
  it('emits a single colored line (not JSON) with time, severity and message', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const err = spyStderr()
    logger.error('pretty me', { code: '42', email: 'a@b.com' })
    const line: unknown = err.mock.calls[0]?.[0]
    if (typeof line !== 'string') throw new Error('expected a string log line')
    expect(line.trimStart().startsWith('{')).toBe(false)
    expect(line).toMatch(/\d{2}:\d{2}:\d{2} ERROR/)
    expect(line).toContain('\x1b[31m')
    expect(line).toContain('pretty me {"code":"42","email":"[redacted]"}')
  })

  it('omits the trailing fields when there are none and writes info to stdout', () => {
    vi.stubEnv('NODE_ENV', undefined)
    const log = spyStdout()
    logger.info('bare')
    const line: unknown = log.mock.calls[0]?.[0]
    if (typeof line !== 'string') throw new Error('expected a string log line')
    expect(line.endsWith(' bare')).toBe(true)
  })
})
