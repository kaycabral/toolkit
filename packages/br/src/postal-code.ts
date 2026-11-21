import { onlyDigits } from './digits'

/** Address returned by {@link lookupPostalCode}. Missing upstream fields are `''`. */
export type PostalCodeAddress = {
  /** CEP as 8 digits. */
  postalCode: string
  /** State abbreviation (UF), e.g. `SP`. */
  state: string
  city: string
  neighborhood: string
  street: string
}

/**
 * Outcome of {@link lookupPostalCode}:
 * - `invalid`: the CEP is not 8 digits (no request is made);
 * - `not-found`: BrasilAPI answered 404;
 * - `upstream`: network failure, any other non-2xx status or an unreadable body.
 */
export type PostalCodeLookupResult =
  | { ok: true; address: PostalCodeAddress }
  | { ok: false; reason: 'invalid' | 'not-found' | 'upstream' }

/** Minimal `fetch` signature used by {@link lookupPostalCode}. */
export type PostalCodeFetch = (input: string, init?: RequestInit) => Promise<Response>

/** Options for {@link lookupPostalCode}. */
export type LookupPostalCodeOptions = {
  /** `fetch` implementation. Defaults to the global `fetch`. */
  fetch?: PostalCodeFetch
  /** Abort signal; an abort rejects instead of resolving to `upstream`. */
  signal?: AbortSignal
  /**
   * Extra request options, e.g. Next.js caching:
   * `{ next: { revalidate: 604800 } }`. `signal` wins over `init.signal`.
   */
  init?: RequestInit
  /** BrasilAPI CEP v2 base URL. Defaults to `https://brasilapi.com.br/api/cep/v2`. */
  baseUrl?: string
}

const DEFAULT_BASE_URL = 'https://brasilapi.com.br/api/cep/v2'

/** The 8 digits of a CEP, or `null` when `raw` does not have exactly 8 digits. */
export function normalizePostalCode(raw: string): string | null {
  const digits = onlyDigits(raw)
  return digits.length === 8 ? digits : null
}

/** Format a complete CEP as `12345-678`. Other input is returned unchanged. */
export function formatPostalCode(raw: string): string {
  const cep = normalizePostalCode(raw)
  return cep === null ? raw : `${cep.slice(0, 5)}-${cep.slice(5)}`
}

/**
 * Progressive input mask for a CEP: `12345-678`. Formats partial input as the
 * user types; extra digits are dropped.
 */
export function maskPostalCode(value: string): string {
  const d = onlyDigits(value).slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringField(data: Record<string, unknown>, key: string): string {
  const value = data[key]
  return typeof value === 'string' ? value : ''
}

/**
 * Look a CEP up on BrasilAPI (v2). Never throws for upstream problems: every
 * failure is a `{ ok: false, reason }` result. Only an abort (through `signal`
 * or `init.signal`) rejects, with the error `fetch` raised.
 *
 * @example
 * ```ts
 * const result = await lookupPostalCode('01310-100', { init: { next: { revalidate: 604800 } } })
 * if (result.ok) console.log(result.address.city)
 * ```
 */
export async function lookupPostalCode(
  cep: string,
  options: LookupPostalCodeOptions = {},
): Promise<PostalCodeLookupResult> {
  const normalized = normalizePostalCode(cep)
  if (normalized === null) return { ok: false, reason: 'invalid' }

  const { fetch: doFetch = fetch, signal, init, baseUrl = DEFAULT_BASE_URL } = options
  const abortSignal = signal ?? init?.signal ?? undefined
  let data: unknown
  try {
    const response = await doFetch(`${baseUrl}/${normalized}`, { ...init, signal: abortSignal })
    if (response.status === 404) return { ok: false, reason: 'not-found' }
    if (!response.ok) return { ok: false, reason: 'upstream' }
    data = await response.json()
  } catch (error) {
    if (abortSignal?.aborted) throw error
    return { ok: false, reason: 'upstream' }
  }
  if (!isRecord(data)) return { ok: false, reason: 'upstream' }

  return {
    ok: true,
    address: {
      postalCode: normalizePostalCode(stringField(data, 'cep')) ?? normalized,
      state: stringField(data, 'state'),
      city: stringField(data, 'city'),
      neighborhood: stringField(data, 'neighborhood'),
      street: stringField(data, 'street'),
    },
  }
}
