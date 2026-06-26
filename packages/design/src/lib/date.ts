// Pure helpers for the pt-BR date field: convert between the ISO storage format
// (`yyyy-mm-dd`) and the Brazilian display format (`dd/mm/aaaa`), and mask
// keystrokes progressively. No timezone math — these operate on calendar dates
// as plain strings, so they never shift a day across timezones.

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/
const BR_RE = /^\d{2}\/\d{2}\/\d{4}$/

// Real calendar date? `new Date` normalizes overflow (31/04 → 01/05, 00 → prev
// month), so when the resulting year AND month still match the input, the day
// was necessarily in range — no separate day check needed.
function isValidYmd(year: number, month: number, day: number): boolean {
  const dt = new Date(year, month - 1, day)
  return dt.getFullYear() === year && dt.getMonth() === month - 1
}

// `yyyy-mm-dd` → `dd/mm/aaaa` (empty string when not a valid date).
export function isoToBrDate(iso: string): string {
  if (!ISO_RE.test(iso)) return ''
  const year = iso.slice(0, 4)
  const month = iso.slice(5, 7)
  const day = iso.slice(8, 10)
  return isValidYmd(+year, +month, +day) ? `${day}/${month}/${year}` : ''
}

// `dd/mm/aaaa` → `yyyy-mm-dd` (empty string when incomplete or not a real date).
export function brDateToIso(br: string): string {
  if (!BR_RE.test(br)) return ''
  const day = br.slice(0, 2)
  const month = br.slice(3, 5)
  const year = br.slice(6, 10)
  return isValidYmd(+year, +month, +day) ? `${year}-${month}-${day}` : ''
}

// Progressive mask as the user types: digits only, capped at 8 (ddmmyyyy),
// inserting the slashes so the field reads `dd/mm/aaaa`.
export function maskBrDate(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

// Format a `Date` (calendar selection) to ISO `yyyy-mm-dd` using its LOCAL
// components — never `toISOString()`, which would shift to UTC and can land on
// the previous day.
export function dateToIso(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Parse ISO `yyyy-mm-dd` to a LOCAL `Date` (midday, to stay clear of DST edges),
// or `undefined` when not a valid date — for seeding the calendar selection.
export function isoToDate(iso: string): Date | undefined {
  if (!ISO_RE.test(iso)) return undefined
  const year = +iso.slice(0, 4)
  const month = +iso.slice(5, 7)
  const day = +iso.slice(8, 10)
  return isValidYmd(year, month, day) ? new Date(year, month - 1, day, 12) : undefined
}
