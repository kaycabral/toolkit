// No-op shim for the `server-only` package, used during vitest runs.
//
// The real `server-only` throws at import time when loaded outside a server
// boundary — and under vitest the environment is jsdom, which looks like the
// client to it. That would make every server module (admin SDK, Firestore
// readers, PII helpers) unimportable in unit tests. Apps alias the bare
// `server-only` specifier to this file in their vitest config:
//
//   import { fileURLToPath } from 'node:url'
//   resolve: {
//     alias: {
//       'server-only': fileURLToPath(
//         import.meta.resolve('@cbrl/testing/vitest/server-only-shim'),
//       ),
//     },
//   }
//
// The alias only exists during tests; the real package still guards the
// server/client boundary at build time.
export {}
