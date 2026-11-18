import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Separator } from './separator'

describe('Separator', () => {
  it('defaults to a horizontal decorative separator', () => {
    render(<Separator />)
    // Decorative separators are hidden from assistive tech via role="none".
    const separator = screen.getByRole('none')
    expect(separator).toHaveAttribute('data-slot', 'separator')
    expect(separator).toHaveAttribute('data-orientation', 'horizontal')
  })

  it('renders a vertical separator', () => {
    render(<Separator orientation="vertical" />)
    expect(screen.getByRole('none')).toHaveAttribute('data-orientation', 'vertical')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Separator />)
    await expectNoA11yViolations(container)
  })
})
