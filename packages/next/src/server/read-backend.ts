import { logger as defaultLogger, type Logger } from '@cbrl/log'

/** Default time a read may take before it counts as unavailable. */
export const BACKEND_READ_TIMEOUT_MS = 4_000

/** Outcome of {@link readBackend}: the data, or a signal to render the degraded state. */
export type BackendRead<T> = { ok: true; data: T } | { ok: false }

/** Options for {@link readBackend}. */
export interface ReadBackendOptions {
  /** Names the read in the error log, e.g. `'dashboard'`. Never put personal data here. */
  label: string
  /** Milliseconds before a hanging read counts as unavailable. Defaults to {@link BACKEND_READ_TIMEOUT_MS}. */
  timeoutMs?: number
  /** Logger for the failure. Defaults to the `@cbrl/log` logger. */
  logger?: Pick<Logger, 'error'>
}

/**
 * Runs a server-side backend read (database, auth) so that an unavailable
 * backend degrades the page instead of crashing it.
 *
 * Covers the three ways a read fails when the backend is not there:
 *   - throws synchronously (missing env)
 *   - rejects (bad credentials, permission, network)
 *   - hangs (the database does not answer within `timeoutMs`)
 *
 * Failures are logged as `backend read unavailable` with the label and the
 * error; the caller decides what the degraded UI looks like from `ok: false`.
 */
export async function readBackend<T>(
  read: () => Promise<T>,
  { label, timeoutMs = BACKEND_READ_TIMEOUT_MS, logger = defaultLogger }: ReadBackendOptions,
): Promise<BackendRead<T>> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`timed out after ${String(timeoutMs)}ms`))
      }, timeoutMs)
    })
    const data = await Promise.race([read(), timeout])
    return { ok: true, data }
  } catch (error) {
    logger.error('backend read unavailable', { read: label, err: error })
    return { ok: false }
  } finally {
    clearTimeout(timer)
  }
}
