---
'@cbrl/log': minor
---

New package: a PII-safe structured logger and a per-request context, framework-agnostic (Node and the standard `Request`). `logger` and `createLogger({ piiKeys })` emit JSON lines with the Cloud Logging `severity` in production and test and a colored line in development, redact personal data by key at any depth and reduce errors to name, message, stack and a string code. `withRequestContext`, `withActionContext`, `runWithRequestContext`, `getRequestContext` and `setRequestContextField` scope a correlation id (taken from the trace headers or minted) and extra fields on AsyncLocalStorage, and every log line carries them.
