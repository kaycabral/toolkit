import type { NextConfig } from 'next'

import { buildCsp, type CspDirectives } from './csp'

/** One `{ key, value }` response header, as Next.js `headers()` expects. */
export interface SecurityHeader {
  key: string
  value: string
}

/** Options for {@link securityHeaders} and {@link withSecurityHeaders}. */
export interface SecurityHeadersOptions {
  /** CSP directives, usually from `cspDirectives()`. */
  csp: CspDirectives
  /**
   * `'report-only'` sends `Content-Security-Policy-Report-Only` (violations are
   * reported, nothing is blocked); `'enforce'` sends `Content-Security-Policy`.
   * Defaults to `'report-only'`.
   */
  cspMode?: 'report-only' | 'enforce'
  /**
   * Where browsers POST violation reports, e.g. `'/api/csp-report'` (served by
   * `cspReportRoute()`) or an absolute `https://` URL. Adds `report-uri` and
   * `report-to` to the CSP plus a `Reporting-Endpoints` header. Without it the
   * report-only mode reports nothing.
   */
  reportPath?: string
}

/** Options for {@link withSecurityHeaders}. */
export interface WithSecurityHeadersOptions extends SecurityHeadersOptions {
  /** Path pattern the headers apply to. Defaults to every path, `'/:path*'`. */
  source?: string
}

/** Reporting API endpoint group named by `report-to`. */
export const CSP_REPORT_GROUP = 'csp-endpoint'

/**
 * The security header set: HSTS (1 year, subdomains, preload),
 * `nosniff`, `X-Frame-Options: DENY`, a strict referrer policy, a restrictive
 * `Permissions-Policy` and the CSP (report-only or enforced), wired to a
 * report endpoint when `reportPath` is given.
 */
export function securityHeaders(options: SecurityHeadersOptions): SecurityHeader[] {
  const { csp, cspMode = 'report-only', reportPath } = options
  const directives: CspDirectives =
    reportPath === undefined
      ? csp
      : { ...csp, 'report-uri': [reportPath], 'report-to': [CSP_REPORT_GROUP] }

  const headers: SecurityHeader[] = [
    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    },
    {
      key:
        cspMode === 'enforce' ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only',
      value: buildCsp(directives),
    },
  ]
  if (reportPath !== undefined) {
    headers.push({ key: 'Reporting-Endpoints', value: `${CSP_REPORT_GROUP}="${reportPath}"` })
  }
  return headers
}

/**
 * Wrap a Next.js config so every response carries {@link securityHeaders} and
 * the `X-Powered-By` header is dropped. Header rules the config already
 * declares are kept and come after ours, so an app rule for the same key wins.
 */
export function withSecurityHeaders(
  nextConfig: NextConfig,
  options: WithSecurityHeadersOptions,
): NextConfig {
  const { source = '/:path*', ...headerOptions } = options
  const ownHeaders = nextConfig.headers
  return {
    ...nextConfig,
    poweredByHeader: false,
    async headers() {
      const existing = ownHeaders ? await ownHeaders() : []
      return [{ source, headers: securityHeaders(headerOptions) }, ...existing]
    },
  }
}
