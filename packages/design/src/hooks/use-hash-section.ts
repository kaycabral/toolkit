'use client'

import * as React from 'react'

export type HashSection<K extends string> = {
  /** Section in `#<prefix>/<section>`, or null when the hash doesn't address one. */
  section: K | null
  /** Points the hash at a section (replaceState: no history entry). */
  open: (section: K) => void
  /** Clears the hash, keeping path and query (replaceState). */
  close: () => void
}

function parse(hash: string, prefix: string, keys?: readonly string[]): string | null {
  const head = `#${prefix}/`
  if (!hash.startsWith(head)) return null
  const key = decodeURIComponent(hash.slice(head.length))
  if (!key) return null
  if (keys && !keys.includes(key)) return null
  return key
}

/**
 * Routes a modal (e.g. `SettingsDialog`) through the URL fragment
 * `#<prefix>/<section>`: links and menus set the hash, the modal opens on the
 * section, switching sections and closing rewrite the hash in place. Pass
 * `keys` to ignore unknown (or not allowed) sections. The fragment never
 * reaches the server.
 */
export function useHashSection(prefix: string): HashSection<string>
export function useHashSection<K extends string>(prefix: string, keys: readonly K[]): HashSection<K>
export function useHashSection(prefix: string, keys?: readonly string[]): HashSection<string> {
  const [section, setSection] = React.useState<string | null>(null)
  const keysId = keys?.join('\u0000')

  React.useEffect(() => {
    const allowed = keysId === undefined ? undefined : keysId.split('\u0000')
    const sync = () => setSection(parse(window.location.hash, prefix, allowed))
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [prefix, keysId])

  const open = React.useCallback(
    (next: string) => {
      window.history.replaceState(null, '', `#${prefix}/${encodeURIComponent(next)}`)
      setSection(next)
    },
    [prefix],
  )

  const close = React.useCallback(() => {
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
    setSection(null)
  }, [])

  return { section, open, close }
}
