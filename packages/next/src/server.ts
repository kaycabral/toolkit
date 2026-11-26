/**
 * Server-only helpers: Route Handler factories (health check, CSP report
 * endpoint) and `readBackend` for degradable backend reads.
 */
export { cspReportRoute, type CspReportRouteOptions, type CspViolation } from './server/csp-report'
export { healthRoute, type HealthBody, type HealthRouteOptions } from './server/health'
export {
  BACKEND_READ_TIMEOUT_MS,
  readBackend,
  type BackendRead,
  type ReadBackendOptions,
} from './server/read-backend'
