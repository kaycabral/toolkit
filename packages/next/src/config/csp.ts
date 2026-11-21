/** CSP directive names with editor autocompletion; any other directive name is accepted too. */
export type CspDirectiveName =
  | 'default-src'
  | 'script-src'
  | 'style-src'
  | 'img-src'
  | 'font-src'
  | 'connect-src'
  | 'media-src'
  | 'worker-src'
  | 'manifest-src'
  | 'frame-src'
  | 'frame-ancestors'
  | 'object-src'
  | 'base-uri'
  | 'form-action'
  | 'upgrade-insecure-requests'
  | 'report-uri'
  | 'report-to'
  | (string & {})

/**
 * A CSP as a map of directive name to source list. An empty list emits the bare
 * directive (for value-less directives such as `upgrade-insecure-requests`).
 */
export type CspDirectives = Partial<Record<CspDirectiveName, readonly string[]>>

/**
 * The shared baseline: same-origin by default, no framing by other sites, no
 * plugins, no `<base>` hijacking, forms post same-origin. Inline scripts/styles
 * stay allowed because Next.js App Router injects inline bootstrap code.
 */
const BASELINE: Readonly<Record<string, readonly string[]>> = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:', 'blob:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'"],
  'worker-src': ["'self'", 'blob:'],
  'frame-src': ["'none'"],
  'frame-ancestors': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
}

const NONE = "'none'"

function unique(values: readonly string[]): string[] {
  return [...new Set(values)]
}

/**
 * Serialize directives into a CSP header value. Sources are de-duplicated and
 * directives keep insertion order.
 *
 * @example buildCsp({ 'default-src': ["'self'"] }) // "default-src 'self'"
 */
export function buildCsp(directives: CspDirectives): string {
  return Object.entries(directives)
    .flatMap(([name, sources]) => {
      if (sources === undefined) return []
      const list = unique(sources)
      return [list.length === 0 ? name : `${name} ${list.join(' ')}`]
    })
    .join('; ')
}

/**
 * The shared baseline CSP merged with app-specific sources. Additions are
 * appended to the baseline list of the same directive; adding to a directive
 * whose baseline is `'none'` (e.g. `frame-src`) replaces the `'none'`.
 * Directives not in the baseline are added as given; an empty list leaves a
 * baseline directive untouched.
 *
 * @example
 * cspDirectives({
 *   'connect-src': ['https://abc.supabase.co'],
 *   'frame-src': ['https://challenges.cloudflare.com'],
 * })
 */
export function cspDirectives(additions: CspDirectives = {}): CspDirectives {
  const merged: Record<string, readonly string[]> = { ...BASELINE }
  for (const [name, sources] of Object.entries(additions)) {
    const base = merged[name]
    if (sources === undefined || (base !== undefined && sources.length === 0)) continue
    merged[name] = unique([...(base ?? []).filter((source) => source !== NONE), ...sources])
  }
  return merged
}
