import { getRequestContext } from './request-context'

/** Log level, mapped to a Cloud Logging `severity`. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/** Structured fields attached to a log line. */
export type LogMeta = Readonly<Record<string, unknown>>

/** A logger: one method per level, each taking a message and optional fields. */
export type Logger = Readonly<Record<LogLevel, (message: string, meta?: LogMeta) => void>>

/** Options for {@link createLogger}. */
export type LoggerOptions = {
  /** Extra keys to redact, added to {@link DEFAULT_PII_KEYS}. Matched case-insensitively. */
  readonly piiKeys?: Iterable<string>
}

/**
 * Keys whose values are always replaced by `[redacted]`, at any depth.
 * Matched case-insensitively against the exact key name.
 */
export const DEFAULT_PII_KEYS: readonly string[] = Object.freeze([
  'email',
  'phone',
  'mobile',
  'whatsapp',
  'document',
  'cpf',
  'cnpj',
  'password',
  'secret',
  'token',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'apikey',
  'api_key',
  'authorization',
  'cookie',
  'set-cookie',
  'ip',
  'x-forwarded-for',
])

const REDACTED = '[redacted]'
const CIRCULAR = '[circular]'

const SEVERITY: Record<LogLevel, string> = {
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARNING',
  error: 'ERROR',
}

const DEV_COLOR: Record<LogLevel, string> = {
  debug: '\x1b[90m',
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
}
const RESET = '\x1b[0m'

function normalizeError(err: Error): Record<string, unknown> {
  const out: Record<string, unknown> = { name: err.name, message: err.message }
  if (err.stack) out.stack = err.stack
  const code: unknown = Reflect.get(err, 'code')
  if (typeof code === 'string') out.code = code
  return out
}

function createSanitizer(piiKeys: ReadonlySet<string>) {
  const isPii = (key: string): boolean => piiKeys.has(key.toLowerCase())

  function sanitizeEntries(value: object, seen: WeakSet<object>): Record<string, unknown> {
    const out: Record<string, unknown> = {}
    for (const [key, entry] of Object.entries(value)) {
      out[key] = sanitize(entry, isPii(key), seen)
    }
    return out
  }

  function sanitize(value: unknown, keyIsPii: boolean, seen: WeakSet<object>): unknown {
    if (keyIsPii && value != null) return REDACTED
    if (typeof value === 'bigint') return value.toString()
    if (value === null || typeof value !== 'object') return value
    if (value instanceof Date) return value
    if (seen.has(value)) return CIRCULAR
    seen.add(value)
    if (value instanceof Error) return sanitizeEntries(normalizeError(value), seen)
    if (Array.isArray(value)) return value.map((item: unknown) => sanitize(item, false, seen))
    return sanitizeEntries(value, seen)
  }

  return (value: object): Record<string, unknown> => sanitizeEntries(value, new WeakSet())
}

function contextFields(): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(getRequestContext() ?? {})) {
    if (typeof value === 'string') out[key] = value
  }
  return out
}

function jsonOutput(): boolean {
  const env = process.env.NODE_ENV
  return env === 'production' || env === 'test'
}

function formatPretty(level: LogLevel, message: string, ts: string, fields: object): string {
  const time = ts.slice(11, 19)
  const tail = Object.keys(fields).length > 0 ? ` ${JSON.stringify(fields)}` : ''
  return `${DEV_COLOR[level]}${time} ${SEVERITY[level]}${RESET} ${message}${tail}`
}

/**
 * Creates a logger. Output is one JSON line per call (with Cloud Logging
 * `severity`, `level`, `message`, `ts`, the active request context and the
 * sanitized meta) when `NODE_ENV` is `production` or `test`, and a colored
 * one-line summary otherwise. `warn`/`error` go to stderr, the rest to stdout.
 *
 * Values under PII keys are replaced by `[redacted]` at any depth, and `Error`
 * values are reduced to `name`, `message`, `stack` and a string `code` (extra
 * properties such as a driver's `detail` may carry personal data and are dropped).
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  const piiKeys = new Set(
    [...DEFAULT_PII_KEYS, ...(options.piiKeys ?? [])].map((key) => key.toLowerCase()),
  )
  const sanitize = createSanitizer(piiKeys)

  function emit(level: LogLevel, message: string, meta?: LogMeta): void {
    const ts = new Date().toISOString()
    const fields = sanitize({ ...contextFields(), ...meta })
    const write = level === 'error' || level === 'warn' ? console.error : console.log
    if (jsonOutput()) {
      const head = { severity: SEVERITY[level], level, message, ts }
      write(JSON.stringify({ ...head, ...fields, ...head }))
    } else {
      write(formatPretty(level, message, ts, fields))
    }
  }

  return Object.freeze({
    debug: (message: string, meta?: LogMeta) => emit('debug', message, meta),
    info: (message: string, meta?: LogMeta) => emit('info', message, meta),
    warn: (message: string, meta?: LogMeta) => emit('warn', message, meta),
    error: (message: string, meta?: LogMeta) => emit('error', message, meta),
  })
}

/** Default logger, redacting {@link DEFAULT_PII_KEYS}. */
export const logger: Logger = createLogger()
