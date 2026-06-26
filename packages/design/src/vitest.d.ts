// Registers @testing-library/jest-dom matchers (toBeInTheDocument,
// toHaveAttribute, …) on vitest's Assertion type so component tests
// typecheck. Lives under src/ so tsc picks it up via `src/**/*.ts`.
import '@testing-library/jest-dom/vitest'
