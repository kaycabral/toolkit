import { afterEach, describe, expect, it, vi } from 'vitest'

import { BACKEND_READ_TIMEOUT_MS, readBackend } from './read-backend'

function spyLogger() {
  return { error: vi.fn() }
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('readBackend', () => {
  it('returns the data when the read resolves', async () => {
    const logger = spyLogger()
    await expect(readBackend(() => Promise.resolve(42), { label: 'x', logger })).resolves.toEqual({
      ok: true,
      data: 42,
    })
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('degrades and logs when the read rejects', async () => {
    const logger = spyLogger()
    const err = new Error('denied')
    await expect(
      readBackend(() => Promise.reject(err), { label: 'dashboard', logger }),
    ).resolves.toEqual({ ok: false })
    expect(logger.error).toHaveBeenCalledWith('backend read unavailable', {
      read: 'dashboard',
      err,
    })
  })

  it('degrades when the read throws synchronously', async () => {
    const logger = spyLogger()
    const read = (): Promise<number> => {
      throw new Error('missing env')
    }
    await expect(readBackend(read, { label: 'env', logger })).resolves.toEqual({ ok: false })
    expect(logger.error).toHaveBeenCalledOnce()
  })

  it('degrades when the read hangs past the default timeout', async () => {
    vi.useFakeTimers()
    const logger = spyLogger()
    const result = readBackend(() => new Promise<never>(() => undefined), { label: 'hang', logger })
    await vi.advanceTimersByTimeAsync(BACKEND_READ_TIMEOUT_MS)
    await expect(result).resolves.toEqual({ ok: false })
    expect(logger.error).toHaveBeenCalledWith('backend read unavailable', {
      read: 'hang',
      err: new Error(`timed out after ${String(BACKEND_READ_TIMEOUT_MS)}ms`),
    })
  })

  it('honours a custom timeout and leaves no timer behind', async () => {
    vi.useFakeTimers()
    const logger = spyLogger()
    const result = readBackend(() => new Promise<never>(() => undefined), {
      label: 'short',
      timeoutMs: 10,
      logger,
    })
    await vi.advanceTimersByTimeAsync(10)
    await expect(result).resolves.toEqual({ ok: false })
    await readBackend(() => Promise.resolve(1), { label: 'ok', logger })
    expect(vi.getTimerCount()).toBe(0)
  })

  it('logs through @cbrl/log by default', async () => {
    const stderr = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await expect(
      readBackend(() => Promise.reject(new Error('x')), { label: 'default' }),
    ).resolves.toEqual({ ok: false })
    const written = stderr.mock.calls.map((c) => String(c[0])).join('')
    expect(written).toContain('backend read unavailable')
  })
})
