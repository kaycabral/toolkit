---
'@cbrl/testing': minor
---

Support Vitest 5 (the `vitest` peer stays `>=3`). `expectNoA11yViolations` now runs jest-axe's matcher directly instead of registering it with `expect.extend`, because Vitest 5 no longer merges jest-axe's `jest.Matchers` typings into `Assertion`. Importing `@cbrl/testing/a11y` therefore has no side effects anymore: code that called `expect(results).toHaveNoViolations()` relying on that import must switch to `expectNoA11yViolations(container)` (or call `expect.extend(toHaveNoViolations)` itself).
