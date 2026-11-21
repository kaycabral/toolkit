/** Strip every non-digit character. */
export function onlyDigits(raw: string): string {
  return raw.replace(/\D/g, '')
}
