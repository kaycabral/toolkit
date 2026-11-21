import { onlyDigits } from './digits'

/** Brazilian mobile in E.164 digits: `55` + 2-digit area code + `9` + 8 digits. */
export const BRAZIL_MOBILE_E164_REGEX = /^55\d{2}9\d{8}$/

/**
 * Normalize a phone number to E.164 digits (no `+`).
 *
 * - 10 digits (landline) or 11 digits (mobile) are domestic: `55` is prepended.
 * - 12 to 15 digits are assumed to already carry a country code and are kept,
 *   so foreign numbers survive.
 * - Anything else returns `null`.
 */
export function normalizeBrazilPhone(raw: string): string | null {
  const digits = onlyDigits(raw)
  if (digits.length === 10 || digits.length === 11) return `55${digits}`
  if (digits.length >= 12 && digits.length <= 15) return digits
  return null
}

/**
 * Normalize a Brazilian mobile number to E.164 digits (no `+`), or `null` when
 * it is not a mobile (landlines, missing 9th digit, foreign numbers).
 */
export function normalizeBrazilMobile(raw: string): string | null {
  const digits = onlyDigits(raw)
  const e164 = digits.length === 11 ? `55${digits}` : digits
  return BRAZIL_MOBILE_E164_REGEX.test(e164) ? e164 : null
}

/**
 * Format a complete phone number for display: `(11) 91234-5678` or
 * `(11) 3333-4444`. A leading `55` country code is dropped. Input that is not a
 * complete Brazilian number is returned unchanged.
 */
export function formatBrazilPhone(raw: string): string {
  const digits = onlyDigits(raw)
  const local =
    (digits.length === 12 || digits.length === 13) && digits.startsWith('55')
      ? digits.slice(2)
      : digits
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`
  return raw
}

/**
 * Progressive input mask for a domestic phone number: formats partial input as
 * the user types, up to 10 digits as a landline `(11) 3333-4444` and 11 digits
 * as a mobile `(11) 91234-5678`. Extra digits are dropped.
 */
export function maskBrazilPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/**
 * Build a `https://wa.me/<phone>` click-to-chat link, optionally prefilled with
 * `text`. The phone goes through {@link normalizeBrazilPhone}; returns `null`
 * when it cannot be normalized.
 */
export function whatsappUrl(phone: string, text?: string): string | null {
  const e164 = normalizeBrazilPhone(phone)
  if (e164 === null) return null
  return text ? `https://wa.me/${e164}?text=${encodeURIComponent(text)}` : `https://wa.me/${e164}`
}

/**
 * Build a `https://wa.me/?text=` share link: WhatsApp opens the contact picker
 * with `text` prefilled.
 */
export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}
