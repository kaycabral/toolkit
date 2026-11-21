import { expect, test } from '@playwright/test'

/** Options for {@link smokeSuite}. */
export interface SmokeSuiteOptions {
  /** Health endpoint that answers `200` with `{ status: 'ok' }`. Default `'/api/health'`. */
  readonly healthPath?: string
  /** Page that must render with a non-empty title. Default `'/'`. */
  readonly homePath?: string
}

/**
 * Register the baseline smoke tests in the calling spec file: the health
 * endpoint returns `200` with `status: 'ok'`, and the home page renders
 * (status below 400) with a non-empty `<title>`. Add app-specific smoke tests
 * next to the call.
 *
 * @example
 * ```ts
 * // _smoke/health.spec.ts
 * import { smokeSuite } from '@cbrl/testing/playwright'
 *
 * smokeSuite()
 * ```
 */
export function smokeSuite(options: SmokeSuiteOptions = {}): void {
  const { healthPath = '/api/health', homePath = '/' } = options

  test('health endpoint returns ok', async ({ request }) => {
    const res = await request.get(healthPath)
    expect(res.status()).toBe(200)
    expect(await res.json()).toMatchObject({ status: 'ok' })
  })

  test('home page renders', async ({ page }) => {
    const res = await page.goto(homePath)
    expect(res?.status()).toBeLessThan(400)
    await expect(page).toHaveTitle(/.+/)
  })
}
