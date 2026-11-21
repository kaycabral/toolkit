import { requireEnv } from '@cbrl/env'
import { devices, type PlaywrightTestConfig } from '@playwright/test'

const chromium = { name: 'chromium', use: { ...devices['Desktop Chrome'] } }

const isCI = (): boolean => Boolean(process.env.CI)

/** Options for {@link defineE2EConfig}. */
export interface E2EConfigOptions {
  /** Port the app server listens on. The base URL is derived from it. */
  readonly port: number
  /** Directory Playwright searches for specs, relative to the config file. */
  readonly testDir: string
  /** Spec glob(s) inside `testDir`. Default `'**\/*.spec.ts'`. */
  readonly testMatch?: string | RegExp | readonly (string | RegExp)[]
  /** Env passed to the app server (test-only flags, local service keys…). */
  readonly webServerEnv?: Readonly<Record<string, string>>
  /** Server command outside CI. Default `'pnpm run dev'`. */
  readonly devCommand?: string
  /**
   * Server command on CI: a production build, so specs never race on-demand
   * compilation. Default `` `pnpm run build && pnpm run start -p ${port}` ``.
   */
  readonly ciCommand?: string
  /** Host the base URL points at. Default `'127.0.0.1'`. */
  readonly host?: string
}

/**
 * Base Playwright config for an E2E suite that boots the app itself.
 *
 * On CI (`process.env.CI` set) it runs the production build, never reuses a
 * running server, forbids `.only` and reports with GitHub annotations; locally
 * it runs the dev server and reuses one already up. Always chromium, no
 * retries, traces kept for failing tests. Spread the result into Playwright's
 * `defineConfig` to add app specifics (`globalSetup`, `workers`, `shard`…).
 *
 * @example
 * ```ts
 * import { defineE2EConfig } from '@cbrl/testing/playwright'
 * import { defineConfig } from '@playwright/test'
 *
 * export default defineConfig({
 *   ...defineE2EConfig({ port: 3000, testDir: './src', testMatch: '**\/_e2e/**\/*.spec.ts' }),
 *   workers: 2,
 * })
 * ```
 */
export function defineE2EConfig(options: E2EConfigOptions): PlaywrightTestConfig {
  const {
    port,
    testDir,
    testMatch = '**/*.spec.ts',
    webServerEnv = {},
    devCommand = 'pnpm run dev',
    ciCommand = `pnpm run build && pnpm run start -p ${port}`,
    host = '127.0.0.1',
  } = options
  const ci = isCI()
  const baseURL = `http://${host}:${port}`
  return {
    testDir,
    testMatch:
      typeof testMatch === 'string' || testMatch instanceof RegExp ? testMatch : [...testMatch],
    fullyParallel: true,
    forbidOnly: ci,
    retries: 0,
    reporter: ci ? 'github' : 'list',
    use: { baseURL, trace: 'retain-on-failure' },
    projects: [chromium],
    webServer: {
      command: ci ? ciCommand : devCommand,
      url: baseURL,
      reuseExistingServer: !ci,
      timeout: ci ? 300_000 : 120_000,
      env: { ...webServerEnv },
    },
  }
}

/** Options for {@link defineSmokeConfig}. */
export interface SmokeConfigOptions {
  /** Directory with the smoke specs. Default `'./_smoke'`. */
  readonly testDir?: string
  /** Env var holding the deployed URL to smoke-test. Default `'SMOKE_BASE_URL'`. */
  readonly baseUrlEnv?: string
}

/**
 * Playwright config for post-deploy smoke tests against a deployed URL. Starts
 * no server; fails fast when the URL env var is missing. Retries twice (a
 * fresh deployment can be cold) and records a trace on the first retry.
 *
 * @example
 * ```ts
 * // playwright.smoke.config.ts
 * import { defineSmokeConfig } from '@cbrl/testing/playwright'
 *
 * export default defineSmokeConfig()
 * ```
 */
export function defineSmokeConfig(options: SmokeConfigOptions = {}): PlaywrightTestConfig {
  const { testDir = './_smoke', baseUrlEnv = 'SMOKE_BASE_URL' } = options
  const baseURL = requireEnv(baseUrlEnv)
  return {
    testDir,
    testMatch: '**/*.spec.ts',
    fullyParallel: true,
    forbidOnly: isCI(),
    retries: 2,
    reporter: 'html',
    use: { baseURL, trace: 'on-first-retry' },
    projects: [chromium],
  }
}
