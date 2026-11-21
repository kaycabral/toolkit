import type { NextConfig } from 'next'
import { describe, expect, it } from 'vitest'

import { securityHeaders, withSecurityHeaders } from './headers'

const csp = { 'default-src': ["'self'"] }

function header(headers: { key: string; value: string }[], key: string): string | undefined {
  return headers.find((entry) => entry.key === key)?.value
}

describe('securityHeaders', () => {
  it('defaults to a report-only CSP without reporting', () => {
    const headers = securityHeaders({ csp })
    expect(headers.map((entry) => entry.key)).toEqual([
      'Strict-Transport-Security',
      'X-Content-Type-Options',
      'X-Frame-Options',
      'Referrer-Policy',
      'Permissions-Policy',
      'Content-Security-Policy-Report-Only',
    ])
    expect(header(headers, 'Content-Security-Policy-Report-Only')).toBe("default-src 'self'")
    expect(header(headers, 'Strict-Transport-Security')).toBe(
      'max-age=31536000; includeSubDomains; preload',
    )
    expect(header(headers, 'X-Frame-Options')).toBe('DENY')
  })

  it('wires report-uri, report-to and Reporting-Endpoints when reportPath is given', () => {
    const headers = securityHeaders({ csp, reportPath: '/api/csp-report' })
    expect(header(headers, 'Content-Security-Policy-Report-Only')).toBe(
      "default-src 'self'; report-uri /api/csp-report; report-to csp-endpoint",
    )
    expect(header(headers, 'Reporting-Endpoints')).toBe('csp-endpoint="/api/csp-report"')
  })

  it('enforces the CSP in enforce mode', () => {
    const headers = securityHeaders({ csp, cspMode: 'enforce' })
    expect(header(headers, 'Content-Security-Policy')).toBe("default-src 'self'")
    expect(header(headers, 'Content-Security-Policy-Report-Only')).toBeUndefined()
  })
})

describe('withSecurityHeaders', () => {
  it('adds headers for every path and drops X-Powered-By', async () => {
    const config = withSecurityHeaders({ typedRoutes: true }, { csp })
    expect(config.typedRoutes).toBe(true)
    expect(config.poweredByHeader).toBe(false)
    const rules = await config.headers?.()
    expect(rules).toEqual([{ source: '/:path*', headers: securityHeaders({ csp }) }])
  })

  it('keeps existing header rules after its own, honoring a custom source', async () => {
    const appRule = { source: '/embed', headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }] }
    const base: NextConfig = { headers: () => Promise.resolve([appRule]) }
    const rules = await withSecurityHeaders(base, { csp, source: '/app/:path*' }).headers?.()
    expect(rules).toEqual([{ source: '/app/:path*', headers: securityHeaders({ csp }) }, appRule])
  })
})
