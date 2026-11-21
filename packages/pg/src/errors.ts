/** SQLSTATE codes of the integrity-constraint violations apps branch on. */
export const PG_ERROR = {
  NOT_NULL_VIOLATION: '23502',
  FOREIGN_KEY_VIOLATION: '23503',
  UNIQUE_VIOLATION: '23505',
  CHECK_VIOLATION: '23514',
  EXCLUSION_VIOLATION: '23P01',
} as const

/** The Postgres fields read from an error chain. */
export type PgErrorShape = {
  /** Five-character SQLSTATE, e.g. `'23505'`. */
  readonly code?: string
  /** Name of the violated constraint, when Postgres reports one. */
  readonly constraint?: string
}

export type PgErrorOfOptions = {
  /**
   * Called on each node of the chain that carries no SQLSTATE. Return the value
   * to continue with (e.g. the error a runtime wrapper parks under a symbol), or
   * `undefined` to follow `.cause` as usual.
   */
  readonly unwrap?: (value: object) => unknown
}

const SQLSTATE = /^[0-9A-Z]{5}$/

function stringField(value: object, key: 'code' | 'constraint'): string | undefined {
  const field: unknown = Reflect.get(value, key)
  return typeof field === 'string' ? field : undefined
}

/**
 * Find the Postgres error in `err`, walking `.cause` chains (Drizzle wraps the
 * `pg` error in `cause`) and any wrapper `options.unwrap` understands. Only a
 * five-character SQLSTATE counts as a `code`, so Node errors such as
 * `ECONNREFUSED` are skipped. Cycles are detected. Returns `{}` when no
 * Postgres error is found.
 */
export function pgErrorOf(err: unknown, options: PgErrorOfOptions = {}): PgErrorShape {
  const seen = new Set<object>()
  let current: unknown = err
  while (typeof current === 'object' && current !== null && !seen.has(current)) {
    seen.add(current)
    const code = stringField(current, 'code')
    if (code !== undefined && SQLSTATE.test(code)) {
      const constraint = stringField(current, 'constraint')
      return constraint === undefined ? { code } : { code, constraint }
    }
    const unwrapped = options.unwrap?.(current)
    current = unwrapped === undefined ? Reflect.get(current, 'cause') : unwrapped
  }
  return {}
}

function isViolation(
  code: string,
  err: unknown,
  constraint: string | undefined,
  options: PgErrorOfOptions | undefined,
): boolean {
  const pg = pgErrorOf(err, options)
  return pg.code === code && (constraint === undefined || pg.constraint === constraint)
}

/**
 * True when `err` carries a unique violation (`23505`), optionally on a
 * specific constraint.
 */
export function isUniqueViolation(
  err: unknown,
  constraint?: string,
  options?: PgErrorOfOptions,
): boolean {
  return isViolation(PG_ERROR.UNIQUE_VIOLATION, err, constraint, options)
}

/**
 * True when `err` carries a foreign-key violation (`23503`), optionally on a
 * specific constraint.
 */
export function isForeignKeyViolation(
  err: unknown,
  constraint?: string,
  options?: PgErrorOfOptions,
): boolean {
  return isViolation(PG_ERROR.FOREIGN_KEY_VIOLATION, err, constraint, options)
}
