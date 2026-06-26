/**
 * Canonical environment-variable helpers for the cbrl monorepo.
 *
 * Principle: fail-fast over silent default. A missing or empty *required* env
 * var should crash loudly at startup instead of running with a trivial value
 * that masks misconfiguration. These helpers are the sanctioned way to read
 * required config — the `cbrl/no-env-value-fallback` ESLint rule bans the
 * `process.env.X ?? 'literal'` anti-pattern in favour of them.
 *
 * Replaces the per-product copies that previously lived in
 * `@<product>/lib` (gabar, scheduling, tekoa, focusely, cbrl.dev, sports).
 */

/** Read a required env var. Throws if it is unset or empty. */
export function requireEnv(name: string): string {
  const value = process.env[name]
  if (value == null || value === '') {
    throw new Error(`Missing required env: ${name}`)
  }
  return value
}

/**
 * Read the first of `names` that is set and non-empty. Throws listing all of
 * them if none is — for config that several env vars can supply (e.g. a project
 * id from `FIREBASE_ADMIN_PROJECT_ID` / `GCLOUD_PROJECT` / …). The chain of
 * `process.env.A ?? process.env.B` is allowed by `no-env-value-fallback`; this
 * just centralises the "none set → fail loud" tail.
 */
export function requireEnvOneOf(...names: readonly string[]): string {
  for (const name of names) {
    const value = process.env[name]
    if (value != null && value !== '') return value
  }
  throw new Error(`Missing required env: set one of ${names.join(', ')}`)
}

/**
 * Read a required env var coerced to a number. Throws if unset, empty, or not
 * a finite number greater than zero — so a malformed value fails loud instead
 * of silently becoming `NaN`/`0`.
 */
export function requireEnvNumber(name: string): number {
  const raw = requireEnv(name)
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`Invalid env ${name}=${raw}: expected a positive number`)
  }
  return n
}
