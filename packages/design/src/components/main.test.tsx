import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Main } from './main'

describe('Main', () => {
  it('renders a <main> landmark on the shared frame by default', () => {
    render(<Main>content</Main>)
    const el = screen.getByRole('main')
    expect(el).toHaveAttribute('data-slot', 'main')
    expect(el).toHaveAttribute('data-width', 'default')
    // Frame is the list width, centered — same for every non-full screen.
    expect(el).toHaveClass('mx-auto', 'max-w-7xl', 'p-6')
  })

  it('keeps the shared frame but constrains the content column when narrow', () => {
    render(<Main width="narrow">form</Main>)
    // Same outer frame as default — left edge stays aligned with list screens.
    expect(screen.getByRole('main')).toHaveClass('mx-auto', 'max-w-7xl')
    // The narrow cap lives on the content column, anchored left (no mx-auto).
    const column = screen.getByText('form')
    expect(column).toHaveAttribute('data-slot', 'main-content')
    expect(column).toHaveClass('max-w-2xl')
    expect(column).not.toHaveClass('mx-auto')
  })

  it('omits the max-width cap when full-bleed', () => {
    render(<Main width="full">board</Main>)
    const el = screen.getByRole('main')
    expect(el).toHaveAttribute('data-width', 'full')
    expect(el).not.toHaveClass('max-w-7xl')
    expect(el).not.toHaveClass('mx-auto')
  })

  it('merges a caller className onto the content column', () => {
    render(
      <Main width="narrow" className="space-y-6">
        x
      </Main>,
    )
    const column = screen.getByText('x')
    expect(column).toHaveAttribute('data-slot', 'main-content')
    expect(column).toHaveClass('max-w-2xl', 'space-y-6')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Main>content</Main>)
    await expectNoA11yViolations(container)
  })
})
