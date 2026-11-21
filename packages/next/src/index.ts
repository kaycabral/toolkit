/**
 * Isomorphic helpers, safe to import from Client Components.
 */

function hasControlChar(value: string): boolean {
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index)
    if (code < 0x20 || code === 0x7f) return true
  }
  return false
}

/**
 * Whether `raw` is a same-origin path: a string starting with a single `/`.
 * Rejects absolute URLs, protocol-relative `//host`, `/\host` (browsers treat
 * `\` as `/`) and control characters (browsers strip tabs/newlines, so
 * `/\t/host` would become `//host`).
 */
export function isSafeInternalPath(raw: unknown): raw is string {
  return (
    typeof raw === 'string' &&
    raw.startsWith('/') &&
    !raw.startsWith('//') &&
    !raw.startsWith('/\\') &&
    !hasControlChar(raw)
  )
}

/**
 * The redirect target from an untrusted `next` param when it is a same-origin
 * path, otherwise `fallback` — so a crafted link cannot bounce the user
 * off-site after sign-in.
 *
 * @example safeNext(searchParams.get('next'), '/dashboard')
 * @example safeNext(searchParams.get('next'), null) // null when unsafe
 */
export function safeNext<const F extends string | null>(raw: unknown, fallback: F): string | F {
  return isSafeInternalPath(raw) ? raw : fallback
}
