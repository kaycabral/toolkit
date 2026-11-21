import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const connection = vi.hoisted(() => vi.fn(() => Promise.resolve()))
vi.mock('next/server.js', () => ({ connection }))

const { healthRoute } = await import('./health')

describe('healthRoute', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_COMMIT_SHA', '')
    vi.stubEnv('VERCEL_GIT_COMMIT_SHA', '')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.useRealTimers()
  })

  it('answers 200 when the database answers, uncached, after connection()', async () => {
    vi.stubEnv('NEXT_PUBLIC_COMMIT_SHA', 'abc')
    const response = await healthRoute({ ping: () => Promise.resolve() })()
    expect(connection).toHaveBeenCalled()
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.json()).toEqual({ status: 'ok', commit: 'abc', database: 'ok' })
  })

  it('falls back to VERCEL_GIT_COMMIT_SHA, then null', async () => {
    vi.stubEnv('VERCEL_GIT_COMMIT_SHA', 'def')
    const GET = healthRoute({ ping: () => Promise.resolve() })
    expect(await (await GET()).json()).toMatchObject({ commit: 'def' })
    vi.stubEnv('VERCEL_GIT_COMMIT_SHA', '')
    expect(await (await GET()).json()).toMatchObject({ commit: null })
  })

  it('answers 503 and reports the error when ping rejects or throws', async () => {
    const onError = vi.fn()
    const failure = new Error('down')
    const rejected = await healthRoute({ ping: () => Promise.reject(failure), onError })()
    expect(rejected.status).toBe(503)
    expect(await rejected.json()).toEqual({
      status: 'error',
      commit: null,
      database: 'unreachable',
    })
    expect(onError).toHaveBeenCalledWith(failure)

    const thrown = await healthRoute({
      ping: () => {
        throw failure
      },
    })()
    expect(thrown.status).toBe(503)
  })

  it('answers 503 when ping exceeds the timeout', async () => {
    vi.useFakeTimers()
    const onError = vi.fn()
    const pending = healthRoute({ ping: () => new Promise(() => {}), timeoutMs: 50, onError })()
    await vi.advanceTimersByTimeAsync(50)
    const response = await pending
    expect(response.status).toBe(503)
    expect(onError).toHaveBeenCalledWith(new Error('Ping timed out after 50ms'))
  })
})
