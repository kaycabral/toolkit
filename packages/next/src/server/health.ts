import { connection } from 'next/server'

/** Options for {@link healthRoute}. */
export interface HealthRouteOptions {
  /** Resolves when the database answers (e.g. `SELECT 1`); rejects or throws otherwise. */
  ping: () => Promise<unknown>
  /** How long to wait for `ping` before reporting the database unreachable. Defaults to 4000 ms. */
  timeoutMs?: number
  /** Receives the ping failure (rejection, throw or timeout), e.g. to log it. */
  onError?: (error: unknown) => void
}

/** JSON body served by {@link healthRoute}. */
export interface HealthBody {
  status: 'ok' | 'error'
  commit: string | null
  database: 'ok' | 'unreachable'
}

async function pingWithin(ping: () => Promise<unknown>, timeoutMs: number): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Ping timed out after ${timeoutMs}ms`)), timeoutMs)
  })
  try {
    await Promise.race([Promise.resolve().then(ping), timeout])
  } finally {
    clearTimeout(timer)
  }
}

/**
 * A `GET` handler for `/api/health`: reports the serving commit
 * (`NEXT_PUBLIC_COMMIT_SHA`, else `VERCEL_GIT_COMMIT_SHA`) and whether the
 * database answers — 200 when it does, 503 when it fails or times out. Never
 * cached: it awaits `connection()` (keeps it out of the Cache Components
 * prerender) and sends `Cache-Control: no-store`.
 *
 * @example export const GET = healthRoute({ ping: () => pool.query('SELECT 1') })
 */
export function healthRoute(options: HealthRouteOptions): () => Promise<Response> {
  const { ping, timeoutMs = 4000, onError } = options
  return async function GET() {
    await connection()
    const commit = process.env.NEXT_PUBLIC_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || null
    let reachable = true
    try {
      await pingWithin(ping, timeoutMs)
    } catch (error) {
      reachable = false
      onError?.(error)
    }
    const body: HealthBody = reachable
      ? { status: 'ok', commit, database: 'ok' }
      : { status: 'error', commit, database: 'unreachable' }
    return Response.json(body, {
      status: reachable ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    })
  }
}
