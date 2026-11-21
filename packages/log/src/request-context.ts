import { AsyncLocalStorage } from 'node:async_hooks'
import { randomUUID } from 'node:crypto'

/**
 * Per-request context. Every string field is attached to each log line emitted
 * inside the scope.
 */
export type RequestContext = { readonly correlationId: string } & Readonly<
  Record<string, string | undefined>
>

type MutableContext = { correlationId: string } & Record<string, string | undefined>

const store = new AsyncLocalStorage<MutableContext>()

/**
 * Runs `fn` inside a request scope. The context is copied, so later
 * {@link setRequestContextField} calls never mutate the object passed in.
 *
 * @returns Whatever `fn` returns (a promise stays a promise).
 */
export function runWithRequestContext<T>(ctx: RequestContext, fn: () => T): T {
  return store.run({ ...ctx }, fn)
}

/**
 * Reads the active request context.
 *
 * @returns The context, or `undefined` outside any scope.
 */
export function getRequestContext(): RequestContext | undefined {
  return store.getStore()
}

/**
 * Sets (or, with `undefined`, clears) an extra field on the active context, e.g.
 * the tenant id once the request is authenticated. No-op outside a scope.
 *
 * @throws {Error} When `key` is `correlationId`, which is fixed for the scope.
 */
export function setRequestContextField(key: string, value: string | undefined): void {
  if (key === 'correlationId') throw new Error('correlationId cannot be changed inside a scope')
  const ctx = store.getStore()
  if (ctx) ctx[key] = value
}

function segment(value: string | null, separator: string, index: number): string | undefined {
  const part = value?.split(separator)[index]
  return part === '' ? undefined : part
}

function nonEmpty(value: string | null): string | undefined {
  return value === null || value === '' ? undefined : value
}

/**
 * Derives a correlation id from incoming headers, in order: Google Cloud
 * `x-cloud-trace-context` trace id, W3C `traceparent` trace id, `x-request-id`,
 * `x-vercel-id`. Mints a random UUID when none is present.
 */
export function correlationIdFromHeaders(headers: Headers): string {
  return (
    segment(headers.get('x-cloud-trace-context'), '/', 0) ??
    segment(headers.get('traceparent'), '-', 1) ??
    nonEmpty(headers.get('x-request-id')) ??
    nonEmpty(headers.get('x-vercel-id')) ??
    randomUUID()
  )
}

/**
 * Wraps a route handler so it runs inside a request scope whose correlation id
 * comes from the request headers (see {@link correlationIdFromHeaders}). When
 * the first argument is not a `Request`, a fresh id is minted. Arguments and
 * return value pass through untouched.
 */
export function withRequestContext<Args extends unknown[], R>(
  handler: (...args: Args) => R,
): (...args: Args) => R {
  return (...args: Args): R => {
    const req = args[0]
    const correlationId =
      req instanceof Request ? correlationIdFromHeaders(req.headers) : randomUUID()
    return runWithRequestContext({ correlationId }, () => handler(...args))
  }
}

/**
 * Wraps an async function that has no `Request` (a server action, a job, a
 * queue consumer) in a request scope. Nested calls reuse the outer context and
 * its correlation id; otherwise a fresh id is minted.
 */
export function withActionContext<Args extends unknown[], R>(
  body: (...args: Args) => Promise<R>,
): (...args: Args) => Promise<R> {
  return (...args: Args): Promise<R> => {
    const existing = store.getStore()
    const ctx: RequestContext = existing ?? { correlationId: randomUUID() }
    return runWithRequestContext(ctx, () => body(...args))
  }
}
