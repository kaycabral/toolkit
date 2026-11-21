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
