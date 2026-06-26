/**
 * Shared Firebase emulator test harness.
 *
 * Every Firebase app wires its e2e/integration suite to the emulator the same
 * way: run under `firebase emulators:exec` (which injects the emulator hosts +
 * project), read those injected values fail-fast, and point Playwright's
 * web server at the app. Re-implementing that per app caused drift — divergent
 * fake values, the `process.env.X ?? 'literal'` anti-pattern, and host/port
 * mismatches. This module is the single source of truth for all of it.
 *
 * Lives under the agnostic `@cbrl/testing` package (subpath `/firebase`) so
 * non-Firebase test helpers can join later.
 */
import { requireEnv } from '@cbrl/env'

// --- Emulator connection (injected by `firebase emulators:exec`) -------------
// Each reads fail-fast: a caller not running under emulators:exec crashes loud
// instead of silently targeting a default host.

/** Emulator project id (matches the `--project` passed to emulators:exec). */
export const emulatorProjectId = (): string => requireEnv('GCLOUD_PROJECT')

/** `host:port` of the Firestore emulator. */
export const firestoreEmulatorHost = (): string => requireEnv('FIRESTORE_EMULATOR_HOST')

/** `host:port` of the Auth emulator. */
export const authEmulatorHost = (): string => requireEnv('FIREBASE_AUTH_EMULATOR_HOST')

/** `host:port` of the Storage emulator. */
export const storageEmulatorHost = (): string => requireEnv('FIREBASE_STORAGE_EMULATOR_HOST')

// --- Playwright web server ---------------------------------------------------

export interface FirebaseEmulatorWebServerOptions {
  /** Command that starts the app server, e.g. `'pnpm run dev'`. */
  readonly command: string
  /**
   * Port the app listens on. The health-check URL is *derived* from it, so the
   * URL can never drift from the server the way a hard-coded URL did (the
   * classic "config says :3000 but the dev script runs :3003" bug).
   */
  readonly port: number
  /** Emulator project id — must match the `--project` of emulators:exec. */
  readonly projectId: string
  /**
   * App-specific public/test env, merged over the Firebase defaults below.
   * Use fixed test constants here, never `process.env.X ?? 'literal'`.
   */
  readonly env?: Readonly<Record<string, string>>
  /** Reuse a server already running locally. Default: true unless on CI. */
  readonly reuseExistingServer?: boolean
  /** Server boot timeout in ms. Default 120_000. */
  readonly timeoutMs?: number
}

/**
 * Build the Playwright `webServer` config for an emulator-backed e2e run.
 * Emulator hosts + `GCLOUD_PROJECT` are injected by emulators:exec and inherited
 * by the server subprocess — deliberately not set here, so there is no
 * literal-default to mask a missing emulator.
 */
export function firebaseEmulatorWebServer(opts: FirebaseEmulatorWebServerOptions) {
  const { command, port, projectId, env = {}, reuseExistingServer, timeoutMs = 120_000 } = opts
  const serverEnv: Record<string, string> = {
    NEXT_PUBLIC_USE_FIREBASE_EMULATORS: 'true',
    FIREBASE_ADMIN_PROJECT_ID: projectId,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: projectId,
    NEXT_PUBLIC_FIREBASE_API_KEY: 'emulator-fake-key',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: `${projectId}.firebaseapp.com`,
    NEXT_PUBLIC_FIREBASE_APP_ID: 'emulator-fake-app-id',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: `${projectId}.firebasestorage.app`,
    ...env,
  }
  return {
    command,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: reuseExistingServer ?? !process.env.CI,
    timeout: timeoutMs,
    env: serverEnv,
  }
}
