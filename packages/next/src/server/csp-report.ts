/**
 * A CSP violation normalized from either report format. URIs keep only origin
 * and path: query strings and fragments are dropped because they can carry
 * personal data (tokens, emails, search terms). Referrer, script samples and
 * user agent are never kept.
 */
export interface CspViolation {
  /** Page where the violation happened. */
  documentUri: string
  /** Resource that was blocked: a URL, a scheme such as `data`, or a keyword such as `inline`/`eval`. */
  blockedUri: string
  /** Directive that was violated, e.g. `script-src-elem`. */
  violatedDirective: string
  /** `'report'` for report-only policies, `'enforce'` for enforced ones. */
  disposition: 'enforce' | 'report'
  /** Script or stylesheet that triggered the violation, when known. */
  sourceFile?: string
  lineNumber?: number
  columnNumber?: number
}

/** Options for {@link cspReportRoute}. */
export interface CspReportRouteOptions {
  /** Receives each violation, e.g. to log it with the app's logger. */
  onReport: (violation: CspViolation) => void | Promise<void>
  /** Largest accepted body in bytes; larger requests get 413. Defaults to 64 KiB. */
  maxBytes?: number
}

const ACCEPTED_TYPES = new Set([
  'application/csp-report',
  'application/reports+json',
  'application/json',
])

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readString(record: JsonRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value !== '') return value
  }
  return undefined
}

function readNumber(record: JsonRecord, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
  }
  return undefined
}

const WEB_SCHEMES = new Set(['http:', 'https:', 'ws:', 'wss:'])

/**
 * Drop query string and fragment. Web URLs keep origin + path; other URLs
 * (`data:`, `blob:`, extensions) keep only their scheme; keywords pass through.
 */
export function stripUri(uri: string): string {
  if (URL.canParse(uri)) {
    const url = new URL(uri)
    return WEB_SCHEMES.has(url.protocol)
      ? `${url.origin}${url.pathname}`
      : url.protocol.slice(0, -1)
  }
  return uri.replace(/[?#].*$/s, '')
}

function normalize(raw: JsonRecord): CspViolation | undefined {
  const documentUri = readString(raw, 'documentURL', 'document-uri')
  const violatedDirective = readString(
    raw,
    'effectiveDirective',
    'effective-directive',
    'violated-directive',
  )
  if (documentUri === undefined || violatedDirective === undefined) return undefined

  const sourceFile = readString(raw, 'sourceFile', 'source-file')
  const lineNumber = readNumber(raw, 'lineNumber', 'line-number')
  const columnNumber = readNumber(raw, 'columnNumber', 'column-number')
  return {
    documentUri: stripUri(documentUri),
    blockedUri: stripUri(readString(raw, 'blockedURL', 'blocked-uri') ?? 'inline'),
    violatedDirective,
    disposition: readString(raw, 'disposition') === 'enforce' ? 'enforce' : 'report',
    ...(sourceFile === undefined ? {} : { sourceFile: stripUri(sourceFile) }),
    ...(lineNumber === undefined ? {} : { lineNumber }),
    ...(columnNumber === undefined ? {} : { columnNumber }),
  }
}

/** Extract violations from a `report-uri` (`{ "csp-report": … }`) or Reporting API (`[{ type, body }]`) payload. */
export function parseCspReports(payload: unknown): CspViolation[] {
  const bodies: unknown[] = Array.isArray(payload)
    ? payload.flatMap((report) =>
        isRecord(report) && report.type === 'csp-violation' ? [report.body] : [],
      )
    : [isRecord(payload) ? payload['csp-report'] : undefined]
  return bodies.flatMap((body) => {
    const violation = isRecord(body) ? normalize(body) : undefined
    return violation === undefined ? [] : [violation]
  })
}

async function readCapped(request: Request, maxBytes: number): Promise<string | undefined> {
  const body: ReadableStream<Uint8Array> | null = request.body
  const reader = body?.getReader()
  if (reader === undefined) return ''
  const decoder = new TextDecoder()
  let text = ''
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > maxBytes) {
      await reader.cancel()
      return undefined
    }
    text += decoder.decode(value, { stream: true })
  }
  return text + decoder.decode()
}

function status(code: number): Response {
  return new Response(null, { status: code })
}

/**
 * A `POST` handler for the CSP report endpoint (`reportPath` of
 * `securityHeaders()`). Accepts `application/csp-report` (`report-uri`) and
 * `application/reports+json` (Reporting API, `report-to`), caps the body size,
 * normalizes each violation with URIs stripped of query and fragment, hands it
 * to `onReport` and answers 204. Errors: 415 wrong content type, 413 too large,
 * 400 invalid JSON.
 *
 * @example export const POST = cspReportRoute({ onReport: (v) => logger.warn(v, 'csp violation') })
 */
export function cspReportRoute(
  options: CspReportRouteOptions,
): (request: Request) => Promise<Response> {
  const { onReport, maxBytes = 64 * 1024 } = options
  return async function POST(request) {
    const contentType = (request.headers.get('content-type') ?? '')
      .replace(/;.*$/s, '')
      .trim()
      .toLowerCase()
    if (!ACCEPTED_TYPES.has(contentType)) return status(415)
    if (Number(request.headers.get('content-length') ?? 0) > maxBytes) return status(413)

    const text = await readCapped(request, maxBytes)
    if (text === undefined) return status(413)
    let payload: unknown
    try {
      payload = JSON.parse(text)
    } catch {
      return status(400)
    }
    for (const violation of parseCspReports(payload)) await onReport(violation)
    return status(204)
  }
}
