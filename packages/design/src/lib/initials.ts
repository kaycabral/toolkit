/**
 * Up-to-two-letter uppercase initials for an avatar fallback, from the first
 * non-blank of `primary` (display name) and `fallback` (email, handle…). Two
 * or more words give the first letter of the first two (`'Ada Lovelace'` →
 * `'AL'`); a single word gives its first two characters (`'ada@example.com'`
 * → `'AD'`). Returns `'?'` when both are blank.
 */
export function initials(primary: string | null | undefined, fallback?: string | null): string {
  const source = primary?.trim() || fallback?.trim() || ''
  if (!source) return '?'
  const words = source.split(/\s+/).map((word) => Array.from(word))
  const [first, second] = words
  const letters = first && second ? [first[0], second[0]] : Array.from(source).slice(0, 2)
  return letters.join('').toUpperCase()
}
