# @cbrl/log

## 0.1.0

### Minor Changes

- [#15](https://github.com/kaycabral/toolkit/pull/15) [`32d58ee`](https://github.com/kaycabral/toolkit/commit/32d58eefdd5eefe70ad7b51a9b966875eff11088) Thanks [@kaycabral](https://github.com/kaycabral)! - New package: a PII-safe structured logger and a per-request context, framework-agnostic (Node and the standard `Request`). `logger` and `createLogger({ piiKeys })` emit JSON lines with the Cloud Logging `severity` in production and test and a colored line in development, redact personal data by key at any depth and reduce errors to name, message, stack and a string code. `withRequestContext`, `withActionContext`, `runWithRequestContext`, `getRequestContext` and `setRequestContextField` scope a correlation id (taken from the trace headers or minted) and extra fields on AsyncLocalStorage, and every log line carries them.
