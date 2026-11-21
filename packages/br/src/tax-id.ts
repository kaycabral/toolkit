import { onlyDigits } from './digits'

/** Which Brazilian tax id a value is: CPF (individual) or CNPJ (company). */
export type TaxIdKind = 'cpf' | 'cnpj'

/** A validated tax id, as digits only. */
export type TaxId = { kind: TaxIdKind; value: string }

function checkDigit(digits: string, maxWeight: number): number {
  let sum = 0
  let weight = 2
  for (let i = digits.length - 1; i >= 0; i--) {
    sum += Number(digits[i]) * weight
    weight = weight === maxWeight ? 2 : weight + 1
  }
  const rest = sum % 11
  return rest < 2 ? 0 : 11 - rest
}

function hasValidCheckDigits(digits: string, length: number, maxWeight: number): boolean {
  if (digits.length !== length || /^(\d)\1+$/.test(digits)) return false
  const first = checkDigit(digits.slice(0, length - 2), maxWeight)
  const second = checkDigit(digits.slice(0, length - 1), maxWeight)
  return digits.endsWith(`${first}${second}`)
}

/**
 * Whether `raw` (formatted or not) is a valid CPF: 11 digits with correct check
 * digits. Sequences of a single repeated digit are rejected.
 */
export function isValidCpf(raw: string): boolean {
  return hasValidCheckDigits(onlyDigits(raw), 11, 11)
}

/**
 * Whether `raw` (formatted or not) is a valid numeric CNPJ: 14 digits with
 * correct check digits. Sequences of a single repeated digit are rejected.
 */
export function isValidCnpj(raw: string): boolean {
  return hasValidCheckDigits(onlyDigits(raw), 14, 9)
}

/** Digits of a valid CPF, or `null` when `raw` is not one. */
export function normalizeCpf(raw: string): string | null {
  const digits = onlyDigits(raw)
  return isValidCpf(digits) ? digits : null
}

/** Digits of a valid CNPJ, or `null` when `raw` is not one. */
export function normalizeCnpj(raw: string): string | null {
  const digits = onlyDigits(raw)
  return isValidCnpj(digits) ? digits : null
}

/**
 * Classify and normalize a value that may be either a CPF or a CNPJ, e.g. a
 * single "CPF/CNPJ" form field. Returns `null` when it is neither.
 */
export function parseTaxId(raw: string): TaxId | null {
  const cpf = normalizeCpf(raw)
  if (cpf !== null) return { kind: 'cpf', value: cpf }
  const cnpj = normalizeCnpj(raw)
  if (cnpj !== null) return { kind: 'cnpj', value: cnpj }
  return null
}

/**
 * Progressive input mask for a CPF: `123.456.789-09`. Formats partial input as
 * the user types; extra digits are dropped.
 */
export function maskCpf(value: string): string {
  const d = onlyDigits(value).slice(0, 11)
  let out = d.slice(0, 3)
  if (d.length > 3) out += `.${d.slice(3, 6)}`
  if (d.length > 6) out += `.${d.slice(6, 9)}`
  if (d.length > 9) out += `-${d.slice(9)}`
  return out
}

/**
 * Progressive input mask for a CNPJ: `12.345.678/0001-95`. Formats partial
 * input as the user types; extra digits are dropped.
 */
export function maskCnpj(value: string): string {
  const d = onlyDigits(value).slice(0, 14)
  let out = d.slice(0, 2)
  if (d.length > 2) out += `.${d.slice(2, 5)}`
  if (d.length > 5) out += `.${d.slice(5, 8)}`
  if (d.length > 8) out += `/${d.slice(8, 12)}`
  if (d.length > 12) out += `-${d.slice(12)}`
  return out
}

/**
 * Format a complete CPF (11 digits) for display. Other input is returned
 * unchanged. Check digits are not verified; use {@link isValidCpf} for that.
 */
export function formatCpf(raw: string): string {
  const digits = onlyDigits(raw)
  return digits.length === 11 ? maskCpf(digits) : raw
}

/**
 * Format a complete CNPJ (14 digits) for display. Other input is returned
 * unchanged. Check digits are not verified; use {@link isValidCnpj} for that.
 */
export function formatCnpj(raw: string): string {
  const digits = onlyDigits(raw)
  return digits.length === 14 ? maskCnpj(digits) : raw
}
