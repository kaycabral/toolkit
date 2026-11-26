const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const brlRounded = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

/**
 * Format an amount in reais as BRL with two decimals: `R$ 1.234,56`.
 *
 * The separator after `R$` is a non-breaking space (`\u00a0`), as produced by
 * `Intl.NumberFormat`.
 */
export function formatBRL(reais: number): string {
  return brl.format(reais)
}

/**
 * Format an integer amount of cents as BRL with two decimals: `123456` →
 * `R$ 1.234,56`. Store money as integer cents to avoid floating-point drift.
 */
export function formatBRLFromCents(cents: number): string {
  return brl.format(cents / 100)
}

/**
 * Format an integer amount of cents as BRL rounded to whole reais: `123456` →
 * `R$ 1.235`. Handy in compact cards.
 */
export function formatBRLFromCentsRounded(cents: number): string {
  return brlRounded.format(cents / 100)
}

const decimal = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/**
 * Like {@link formatBRLFromCents} with an explicit `+` on positive amounts
 * (`1000` → `+R$ 10,00`, `-1000` → `-R$ 10,00`, `0` → `R$ 0,00`). The minus is
 * the ASCII hyphen-minus that `Intl.NumberFormat` emits, so formatted values
 * stay copy-paste friendly and parseable by {@link parseSignedBRLInput}.
 */
export function formatSignedBRLFromCents(cents: number): string {
  const text = brl.format(cents / 100)
  return cents > 0 ? `+${text}` : text
}

/**
 * Integer cents without the currency symbol, for dense grids and inputs:
 * `1094761` → `10.947,61`, `-26050` → `-260,50`.
 */
export function formatAmountFromCents(cents: number): string {
  return decimal.format(cents / 100)
}

/** Like {@link formatAmountFromCents} with an explicit `+` on positive amounts: `+10.947,61`. */
export function formatSignedAmountFromCents(cents: number): string {
  const text = decimal.format(cents / 100)
  return cents > 0 ? `+${text}` : text
}

/**
 * A pt-BR money input → integer cents, or `null` when it is not a
 * non-negative amount. Accepts `1234,56`, `1.234,56`, `1234.56`, `1.234`
 * (thousands), `1234` and an optional `R$` prefix.
 */
export function parseBRLInput(raw: string): number | null {
  const text = raw.trim().replace(/\s|R\$/g, '')
  if (text === '') return null
  let normalized = text
  if (text.includes(',')) {
    normalized = text.replace(/\./g, '').replace(',', '.')
  } else if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
    normalized = text.replace(/\./g, '')
  }
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null
  return Math.round(Number(normalized) * 100)
}

/** Like {@link parseBRLInput}, accepting a leading `-` (or `−`, U+2212) for negative amounts. */
export function parseSignedBRLInput(raw: string): number | null {
  const text = raw.trim()
  const negative = text.startsWith('-') || text.startsWith('−')
  const cents = parseBRLInput(negative ? text.slice(1) : text)
  if (cents === null) return null
  return negative && cents !== 0 ? -cents : cents
}

/** Typed digits beyond this (R$ 99 bilhões) are dropped so cents stay a safe integer. */
const MASK_MAX_DIGITS = 13

/**
 * Progressive money mask for inputs: every digit shifts in from the cents
 * side, like a bank app (`5` → `0,05`, `1234` → `12,34`, `123456` →
 * `1.234,56`). Non-digits are ignored and zero is empty, so erasing digit by
 * digit clears the field. Read the value back with {@link parseBRLInput}.
 */
export function maskBRLInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').replace(/^0+/, '').slice(0, MASK_MAX_DIGITS)
  return digits === '' ? '' : decimal.format(Number(digits) / 100)
}
