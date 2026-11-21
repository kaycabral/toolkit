import { describe, expect, it } from 'vitest'
import {
  correlationIdFromHeaders,
  getRequestContext,
  runWithRequestContext,
  setRequestContextField,
  withActionContext,
  withRequestContext,
} from './request-context'

describe('runWithRequestContext / getRequestContext', () => {
  it('exposes the context inside the scope and nothing outside', () => {
    expect(getRequestContext()).toBeUndefined()
    const seen = runWithRequestContext({ correlationId: 'c1', orgId: 'o1' }, () =>
      getRequestContext(),
    )
    expect(seen).toEqual({ correlationId: 'c1', orgId: 'o1' })
    expect(getRequestContext()).toBeUndefined()
  })

  it('isolates concurrent async scopes (no bleed between requests)', async () => {
    const results = await Promise.all([
      runWithRequestContext({ correlationId: 'a' }, async () => {
        await Promise.resolve()
        return getRequestContext()?.correlationId
      }),
      runWithRequestContext({ correlationId: 'b' }, async () => {
        await Promise.resolve()
        return getRequestContext()?.correlationId
      }),
    ])
    expect(results).toEqual(['a', 'b'])
  })
})

describe('setRequestContextField', () => {
  it('adds, overwrites and clears a field on the active scope', () => {
    const seen = runWithRequestContext({ correlationId: 'c' }, () => {
      setRequestContextField('orgId', 'org-1')
      const afterSet = getRequestContext()?.orgId
      setRequestContextField('orgId', 'org-2')
      const afterOverwrite = getRequestContext()?.orgId
      setRequestContextField('orgId', undefined)
      return [afterSet, afterOverwrite, getRequestContext()?.orgId]
    })
    expect(seen).toEqual(['org-1', 'org-2', undefined])
  })

  it('is visible after an await in the same scope', async () => {
    const seen = await runWithRequestContext({ correlationId: 'c' }, async () => {
      setRequestContextField('userId', 'u-1')
      await Promise.resolve()
      return getRequestContext()?.userId
    })
    expect(seen).toBe('u-1')
  })

  it('never mutates the object passed to runWithRequestContext', () => {
    const ctx = { correlationId: 'c' }
    runWithRequestContext(ctx, () => setRequestContextField('orgId', 'org-1'))
    expect(ctx).toEqual({ correlationId: 'c' })
  })

  it('is a no-op outside any scope', () => {
    setRequestContextField('orgId', 'org-1')
    expect(getRequestContext()).toBeUndefined()
  })

  it('refuses to change the correlation id', () => {
    runWithRequestContext({ correlationId: 'c' }, () => {
      expect(() => setRequestContextField('correlationId', 'other')).toThrow(/correlationId/)
      expect(getRequestContext()?.correlationId).toBe('c')
    })
  })
})

describe('correlationIdFromHeaders', () => {
  it('reuses the Cloud Run trace id (part before the slash)', () => {
    const h = new Headers({ 'x-cloud-trace-context': 'abc123def456/9876;o=1' })
    expect(correlationIdFromHeaders(h)).toBe('abc123def456')
  })

  it('falls back to the W3C traceparent trace id (2nd field)', () => {
    const h = new Headers({
      traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
    })
    expect(correlationIdFromHeaders(h)).toBe('4bf92f3577b34da6a3ce929d0e0e4736')
  })

  it('falls back to x-request-id', () => {
    expect(correlationIdFromHeaders(new Headers({ 'x-request-id': 'req-42' }))).toBe('req-42')
  })

  it('falls back to x-vercel-id', () => {
    const h = new Headers({ 'x-vercel-id': 'gru1::iad1::abc-123' })
    expect(correlationIdFromHeaders(h)).toBe('gru1::iad1::abc-123')
  })

  it('skips malformed or empty headers', () => {
    const h = new Headers({
      'x-cloud-trace-context': '/123',
      traceparent: 'garbage',
      'x-request-id': '',
      'x-vercel-id': 'vercel-1',
    })
    expect(correlationIdFromHeaders(h)).toBe('vercel-1')
  })

  it('mints a fresh UUID when no correlation header is present', () => {
    const a = correlationIdFromHeaders(new Headers())
    const b = correlationIdFromHeaders(new Headers())
    expect(a).toMatch(/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[\da-f]{4}-[\da-f]{12}$/)
    expect(a).not.toBe(b)
  })

  it('prefers cloud-trace over traceparent over x-request-id over x-vercel-id', () => {
    const h = new Headers({
      'x-cloud-trace-context': 'cloud/1',
      traceparent: '00-tp-sp-01',
      'x-request-id': 'rid',
      'x-vercel-id': 'vid',
    })
    expect(correlationIdFromHeaders(h)).toBe('cloud')
    h.delete('x-cloud-trace-context')
    expect(correlationIdFromHeaders(h)).toBe('tp')
    h.delete('traceparent')
    expect(correlationIdFromHeaders(h)).toBe('rid')
  })
})

describe('withRequestContext (route handlers)', () => {
  it('runs the handler inside a scope carrying the request header id', async () => {
    const handler = withRequestContext((_req: Request) =>
      Promise.resolve(new Response(getRequestContext()?.correlationId)),
    )
    const res = await handler(
      new Request('https://x.test', { headers: { 'x-request-id': 'rid-7' } }),
    )
    expect(await res.text()).toBe('rid-7')
  })

  it('mints an id when the request has no correlation header, preserving args', () => {
    const handler = withRequestContext(
      (_req: Request, extra: { params: string }) =>
        `${getRequestContext()?.correlationId ? 'has-id' : 'no-id'}:${extra.params}`,
    )
    expect(handler(new Request('https://x.test'), { params: 'p1' })).toBe('has-id:p1')
  })

  it('mints an id when the first arg is not a Request (no-arg handler)', () => {
    const handler = withRequestContext(() => getRequestContext()?.correlationId)
    expect(handler()).toBeTruthy()
  })

  it('leaves no context behind once the handler returns', () => {
    withRequestContext(() => undefined)()
    expect(getRequestContext()).toBeUndefined()
  })
})

describe('withActionContext (server actions, jobs)', () => {
  it('wraps the body in a scope with a fresh correlation id', async () => {
    const action = withActionContext(() => Promise.resolve(getRequestContext()?.correlationId))
    expect(await action()).toBeTruthy()
  })

  it('reuses the outer scope, its id and its fields when nested', async () => {
    const inner = withActionContext((suffix: string) =>
      Promise.resolve(
        `${getRequestContext()?.correlationId}/${getRequestContext()?.orgId}${suffix}`,
      ),
    )
    const out = await runWithRequestContext({ correlationId: 'outer', orgId: 'o' }, () =>
      inner('!'),
    )
    expect(out).toBe('outer/o!')
  })

  it('keeps fields set inside a nested action from leaking to the outer scope', async () => {
    const inner = withActionContext(() => {
      setRequestContextField('step', 'inner')
      return Promise.resolve()
    })
    const outerStep = await runWithRequestContext({ correlationId: 'outer' }, async () => {
      await inner()
      return getRequestContext()?.step
    })
    expect(outerStep).toBeUndefined()
  })
})
