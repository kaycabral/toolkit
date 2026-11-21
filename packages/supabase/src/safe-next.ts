const PROBE_ORIGIN = 'http://same-origin.invalid'

/**
 * Same-origin path (with query and hash) from an untrusted `next` value, or
 * `fallback`. Resolving against a probe origin rejects absolute,
 * protocol-relative and backslash/whitespace tricks the URL parser would turn
 * into another host.
 */
export function safeNextPath(raw: string | null | undefined, fallback: string): string {
  if (!raw?.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return fallback
  try {
    const url = new URL(raw, PROBE_ORIGIN)
    return url.origin === PROBE_ORIGIN ? `${url.pathname}${url.search}${url.hash}` : fallback
  } catch {
    return fallback
  }
}
