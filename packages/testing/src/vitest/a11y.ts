/**
 * Shared accessibility assertion for jsdom component tests, backed by axe-core
 * (via jest-axe). Design-system components are exactly where automated a11y
 * checks pay off — a violation here propagates to every consuming app.
 *
 *   import { expectNoA11yViolations } from '@cbrl/testing/a11y'
 *   const { container } = render(<Button>Salvar</Button>)
 *   await expectNoA11yViolations(container)
 *
 * The jest-axe matcher runs directly instead of through `expect.extend`, so
 * importing this module has no side effects and needs no matcher type
 * augmentation (Vitest 5 no longer merges jest-axe's `jest.Matchers` typings
 * into `Assertion`). Requires a DOM environment (`environment: 'jsdom'`).
 */
import { axe, toHaveNoViolations } from 'jest-axe'
import { assert } from 'vitest'

export async function expectNoA11yViolations(container: Element): Promise<void> {
  const results = await axe(container, {
    // `region`/landmark rules are page-level concerns (content must sit inside a
    // <main>/<nav>/etc). Component tests render in isolation with no page shell,
    // so these always false-positive — disable them here, not at the call site.
    rules: { region: { enabled: false } },
  })
  const result = toHaveNoViolations.toHaveNoViolations(results)
  assert(result.pass, result.message())
}
