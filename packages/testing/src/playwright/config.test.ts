import { devices } from '@playwright/test'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { defineE2EConfig, defineSmokeConfig } from './config'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('defineE2EConfig', () => {
  it('runs the dev server and reuses it outside CI', () => {
    vi.stubEnv('CI', '')
    const config = defineE2EConfig({ port: 3003, testDir: './src' })
    expect(config).toMatchObject({
      testDir: './src',
      testMatch: '**/*.spec.ts',
      fullyParallel: true,
      forbidOnly: false,
      retries: 0,
      reporter: 'list',
      use: { baseURL: 'http://127.0.0.1:3003', trace: 'retain-on-failure' },
      webServer: {
        command: 'pnpm run dev',
        url: 'http://127.0.0.1:3003',
        reuseExistingServer: true,
        timeout: 120_000,
        env: {},
      },
    })
    expect(config.projects).toEqual([{ name: 'chromium', use: devices['Desktop Chrome'] }])
  })

  it('runs a production build without reuse on CI', () => {
    vi.stubEnv('CI', 'true')
    const config = defineE2EConfig({
      port: 3005,
      testDir: './tests/e2e',
      testMatch: /_e2e\/.*\.spec\.ts$/,
      webServerEnv: { ENABLE_TEST_AUTH: 'true' },
    })
    expect(config).toMatchObject({
      testMatch: /_e2e\/.*\.spec\.ts$/,
      forbidOnly: true,
      reporter: 'github',
      webServer: {
        command: 'pnpm run build && pnpm run start -p 3005',
        reuseExistingServer: false,
        timeout: 300_000,
        env: { ENABLE_TEST_AUTH: 'true' },
      },
    })
  })

  it('accepts custom commands, host and a list of globs', () => {
    vi.stubEnv('CI', 'true')
    const config = defineE2EConfig({
      port: 3000,
      testDir: './src/app',
      testMatch: ['**/_e2e/*.spec.ts', /flow\.spec\.ts$/],
      devCommand: 'pnpm dev',
      ciCommand: 'pnpm exec next start -p 3000',
      host: 'localhost',
    })
    expect(config.testMatch).toEqual(['**/_e2e/*.spec.ts', /flow\.spec\.ts$/])
    expect(config.use?.baseURL).toBe('http://localhost:3000')
    expect(config.webServer).toMatchObject({ command: 'pnpm exec next start -p 3000' })
  })
})

describe('defineSmokeConfig', () => {
  it('targets the deployed URL from SMOKE_BASE_URL by default', () => {
    vi.stubEnv('CI', '')
    vi.stubEnv('SMOKE_BASE_URL', 'https://staging.example.com')
    expect(defineSmokeConfig()).toMatchObject({
      testDir: './_smoke',
      testMatch: '**/*.spec.ts',
      forbidOnly: false,
      retries: 2,
      use: { baseURL: 'https://staging.example.com', trace: 'on-first-retry' },
    })
  })

  it('reads a custom env var and test dir', () => {
    vi.stubEnv('CI', 'true')
    vi.stubEnv('PREVIEW_URL', 'https://preview.example.com')
    expect(defineSmokeConfig({ testDir: './smoke', baseUrlEnv: 'PREVIEW_URL' })).toMatchObject({
      testDir: './smoke',
      forbidOnly: true,
      use: { baseURL: 'https://preview.example.com' },
    })
  })

  it('fails fast when the URL env var is missing', () => {
    vi.stubEnv('SMOKE_BASE_URL', '')
    expect(() => defineSmokeConfig()).toThrow('Missing required env: SMOKE_BASE_URL')
  })
})
