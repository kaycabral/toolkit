import { describe, expect, it, vi } from 'vitest'

import { cspReportRoute, parseCspReports, stripUri } from './csp-report'

const legacyReport = {
  'csp-report': {
    'document-uri': 'https://app.example.com/account?email=a@b.com#top',
    referrer: 'https://google.com/?q=secret',
    'violated-directive': 'script-src-elem',
    'effective-directive': 'script-src-elem',
    'original-policy': "default-src 'self'",
    disposition: 'report',
    'blocked-uri': 'https://cdn.evil.com/x.js?token=123',
    'line-number': 10,
    'column-number': 4,
    'source-file': 'https://app.example.com/_next/static/app.js?v=1',
    'script-sample': 'leaked',
  },
}

const reportingApiPayload = [
  {
    type: 'csp-violation',
    age: 1,
    url: 'https://app.example.com/search?q=cpf',
    user_agent: 'Mozilla/5.0',
    body: {
      documentURL: 'https://app.example.com/search?q=cpf',
      blockedURL: 'inline',
      effectiveDirective: 'style-src-attr',
      disposition: 'enforce',
      sample: 'color: red',
    },
  },
  { type: 'deprecation', body: { documentURL: 'https://app.example.com/' } },
  'garbage',
]

function post(body: string, headers: Record<string, string>): Request {
  return new Request('https://app.example.com/api/csp-report', { method: 'POST', body, headers })
}

describe('stripUri', () => {
  it.each([
    ['https://a.com/p/q?x=1#f', 'https://a.com/p/q'],
    ['wss://a.com:8443/socket?t=1', 'wss://a.com:8443/socket'],
    ['data:image/png;base64,AAAA', 'data'],
    ['blob:https://a.com/uuid', 'blob'],
    ['chrome-extension://abc/script.js', 'chrome-extension'],
    ['inline', 'inline'],
    ['eval', 'eval'],
    ['/relative/path?x=1#y', '/relative/path'],
  ])('%s → %s', (input, expected) => {
    expect(stripUri(input)).toBe(expected)
  })
})

describe('parseCspReports', () => {
  it('normalizes the report-uri format, dropping query, fragment and sensitive fields', () => {
    expect(parseCspReports(legacyReport)).toEqual([
      {
        documentUri: 'https://app.example.com/account',
        blockedUri: 'https://cdn.evil.com/x.js',
        violatedDirective: 'script-src-elem',
        disposition: 'report',
        sourceFile: 'https://app.example.com/_next/static/app.js',
        lineNumber: 10,
        columnNumber: 4,
      },
    ])
  })

  it('normalizes the Reporting API format and skips non-CSP reports', () => {
    expect(parseCspReports(reportingApiPayload)).toEqual([
      {
        documentUri: 'https://app.example.com/search',
        blockedUri: 'inline',
        violatedDirective: 'style-src-attr',
        disposition: 'enforce',
      },
    ])
  })

  it('falls back to violated-directive and an inline blocked URI', () => {
    expect(
      parseCspReports({
        'csp-report': {
          'document-uri': 'https://a.com/',
          'violated-directive': 'img-src',
          'blocked-uri': '',
          'line-number': Number.NaN,
        },
      }),
    ).toEqual([
      {
        documentUri: 'https://a.com/',
        blockedUri: 'inline',
        violatedDirective: 'img-src',
        disposition: 'report',
      },
    ])
  })

  it('ignores payloads without the required fields', () => {
    expect(parseCspReports(null)).toEqual([])
    expect(parseCspReports({ 'csp-report': 'x' })).toEqual([])
    expect(parseCspReports({ 'csp-report': { 'document-uri': 'https://a.com/' } })).toEqual([])
    expect(
      parseCspReports([{ type: 'csp-violation', body: { documentURL: 'https://a.com/' } }]),
    ).toEqual([])
  })
})

describe('cspReportRoute', () => {
  it('passes each violation to onReport and answers 204', async () => {
    const onReport = vi.fn()
    const POST = cspReportRoute({ onReport })
    const legacy = await POST(
      post(JSON.stringify(legacyReport), { 'content-type': 'application/csp-report' }),
    )
    expect(legacy.status).toBe(204)
    const modern = await POST(
      post(JSON.stringify(reportingApiPayload), {
        'content-type': 'application/reports+json; charset=utf-8',
      }),
    )
    expect(modern.status).toBe(204)
    expect(onReport).toHaveBeenCalledTimes(2)
    expect(onReport).toHaveBeenLastCalledWith(
      expect.objectContaining({ documentUri: 'https://app.example.com/search' }),
    )
  })

  it('awaits async onReport', async () => {
    const seen: string[] = []
    const POST = cspReportRoute({
      onReport: async (violation) => {
        await Promise.resolve()
        seen.push(violation.violatedDirective)
      },
    })
    await POST(post(JSON.stringify(legacyReport), { 'content-type': 'application/json' }))
    expect(seen).toEqual(['script-src-elem'])
  })

  it('rejects other content types with 415', async () => {
    const onReport = vi.fn()
    const POST = cspReportRoute({ onReport })
    expect((await POST(post('{}', { 'content-type': 'text/plain' }))).status).toBe(415)
    const untyped = new Request('https://a.com/', { method: 'POST' })
    expect((await POST(untyped)).status).toBe(415)
    expect(onReport).not.toHaveBeenCalled()
  })

  it('rejects oversized bodies with 413, by header or by actual size', async () => {
    const POST = cspReportRoute({ onReport: vi.fn(), maxBytes: 16 })
    const declared = post('{}', {
      'content-type': 'application/csp-report',
      'content-length': '17',
    })
    expect((await POST(declared)).status).toBe(413)
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"a":"0123456789'))
        controller.enqueue(new TextEncoder().encode('0123456789"}'))
        controller.close()
      },
    })
    const undeclared = new Request('https://a.com/', {
      method: 'POST',
      body: stream,
      headers: { 'content-type': 'application/csp-report' },
      duplex: 'half',
    })
    expect((await POST(undeclared)).status).toBe(413)
  })

  it('answers 400 for invalid JSON, including an empty body', async () => {
    const POST = cspReportRoute({ onReport: vi.fn() })
    expect((await POST(post('{', { 'content-type': 'application/csp-report' }))).status).toBe(400)
    const empty = new Request('https://a.com/', {
      method: 'POST',
      headers: { 'content-type': 'application/csp-report' },
    })
    expect((await POST(empty)).status).toBe(400)
  })
})
