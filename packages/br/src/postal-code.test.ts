import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  type PostalCodeFetch,
  formatPostalCode,
  lookupPostalCode,
  maskPostalCode,
  normalizePostalCode,
} from './postal-code'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function fakeFetch(response: Response | Error) {
  return vi.fn<PostalCodeFetch>(() =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  )
}

const brasilApiBody = {
  cep: '01310100',
  state: 'SP',
  city: 'São Paulo',
  neighborhood: 'Bela Vista',
  street: 'Avenida Paulista',
  service: 'open-cep',
}

describe('normalizePostalCode', () => {
  it('returns the 8 digits of a CEP, formatted or raw', () => {
    expect(normalizePostalCode('01310-100')).toBe('01310100')
    expect(normalizePostalCode(' 01.310-100 ')).toBe('01310100')
    expect(normalizePostalCode('01310100')).toBe('01310100')
  })

  it('returns null unless there are exactly 8 digits', () => {
    expect(normalizePostalCode('')).toBeNull()
    expect(normalizePostalCode('0131010')).toBeNull()
    expect(normalizePostalCode('013101000')).toBeNull()
  })
})

describe('formatPostalCode', () => {
  it('formats a complete CEP', () => {
    expect(formatPostalCode('01310100')).toBe('01310-100')
  })

  it('returns incomplete input unchanged', () => {
    expect(formatPostalCode('0131')).toBe('0131')
  })
})

describe('maskPostalCode', () => {
  it.each([
    ['', ''],
    ['0', '0'],
    ['01310', '01310'],
    ['013101', '01310-1'],
    ['01310100', '01310-100'],
    ['01310-1009', '01310-100'],
  ])('masks %j as %j', (input, expected) => {
    expect(maskPostalCode(input)).toBe(expected)
  })
})

describe('lookupPostalCode', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the address and requests BrasilAPI v2 with the normalized CEP', async () => {
    const fetch = fakeFetch(jsonResponse(brasilApiBody))
    const result = await lookupPostalCode('01310-100', { fetch })
    expect(result).toEqual({
      ok: true,
      address: {
        postalCode: '01310100',
        state: 'SP',
        city: 'São Paulo',
        neighborhood: 'Bela Vista',
        street: 'Avenida Paulista',
      },
    })
    expect(fetch).toHaveBeenCalledWith('https://brasilapi.com.br/api/cep/v2/01310100', {
      signal: undefined,
    })
  })

  it('uses the global fetch by default', async () => {
    const fetch = fakeFetch(jsonResponse(brasilApiBody))
    vi.stubGlobal('fetch', fetch)
    const result = await lookupPostalCode('01310100')
    expect(result.ok).toBe(true)
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('forwards init (e.g. Next.js caching), signal and a custom base URL', async () => {
    const fetch = fakeFetch(jsonResponse(brasilApiBody))
    const controller = new AbortController()
    const init: RequestInit & { next: { revalidate: number } } = {
      headers: { accept: 'application/json' },
      next: { revalidate: 604800 },
    }
    await lookupPostalCode('01310100', {
      fetch,
      init,
      signal: controller.signal,
      baseUrl: 'https://proxy.example/cep',
    })
    expect(fetch).toHaveBeenCalledWith('https://proxy.example/cep/01310100', {
      headers: { accept: 'application/json' },
      next: { revalidate: 604800 },
      signal: controller.signal,
    })
  })

  it('falls back to init.signal', async () => {
    const fetch = fakeFetch(jsonResponse(brasilApiBody))
    const controller = new AbortController()
    await lookupPostalCode('01310100', { fetch, init: { signal: controller.signal } })
    expect(fetch).toHaveBeenCalledWith(expect.any(String), { signal: controller.signal })
  })

  it('tolerates missing and non-string fields as empty strings', async () => {
    const fetch = fakeFetch(jsonResponse({ cep: '01310-100', state: 'SP', city: 42, street: null }))
    expect(await lookupPostalCode('01310100', { fetch })).toEqual({
      ok: true,
      address: { postalCode: '01310100', state: 'SP', city: '', neighborhood: '', street: '' },
    })
  })

  it('falls back to the requested CEP when the response has no usable cep', async () => {
    const fetch = fakeFetch(jsonResponse({ cep: 'unknown', city: 'São Paulo' }))
    const result = await lookupPostalCode('01310100', { fetch })
    expect(result.ok && result.address.postalCode).toBe('01310100')
  })

  it('returns invalid without calling fetch for a malformed CEP', async () => {
    const fetch = fakeFetch(jsonResponse(brasilApiBody))
    expect(await lookupPostalCode('1234', { fetch })).toEqual({ ok: false, reason: 'invalid' })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns not-found on 404', async () => {
    const fetch = fakeFetch(jsonResponse({ message: 'CEP not found' }, 404))
    expect(await lookupPostalCode('99999999', { fetch })).toEqual({
      ok: false,
      reason: 'not-found',
    })
  })

  it.each([500, 502, 429, 400])('returns upstream on HTTP %i', async (status) => {
    const fetch = fakeFetch(jsonResponse({ message: 'error' }, status))
    expect(await lookupPostalCode('01310100', { fetch })).toEqual({
      ok: false,
      reason: 'upstream',
    })
  })

  it('returns upstream on a network failure', async () => {
    const fetch = fakeFetch(new TypeError('fetch failed'))
    expect(await lookupPostalCode('01310100', { fetch })).toEqual({
      ok: false,
      reason: 'upstream',
    })
  })

  it('returns upstream on a body that is not JSON', async () => {
    const fetch = fakeFetch(new Response('<html>Bad gateway</html>', { status: 200 }))
    expect(await lookupPostalCode('01310100', { fetch })).toEqual({
      ok: false,
      reason: 'upstream',
    })
  })

  it.each([null, [], 'text', 42])('returns upstream on a non-object JSON body %j', async (body) => {
    const fetch = fakeFetch(jsonResponse(body))
    expect(await lookupPostalCode('01310100', { fetch })).toEqual({
      ok: false,
      reason: 'upstream',
    })
  })

  it('rethrows when the request is aborted', async () => {
    const controller = new AbortController()
    const abortError = new DOMException('Aborted', 'AbortError')
    controller.abort(abortError)
    const fetch = fakeFetch(abortError)
    await expect(lookupPostalCode('01310100', { fetch, signal: controller.signal })).rejects.toBe(
      abortError,
    )
  })
})
