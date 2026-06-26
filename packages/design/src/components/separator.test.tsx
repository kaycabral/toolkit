import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Separator } from './separator'

describe('Separator', () => {
  it('defaults to a horizontal decorative separator', () => {
    render(<Separator data-testid="sep" />)
    expect(screen.getByTestId('sep')).toHaveAttribute('data-orientation', 'horizontal')
  })

  it('renders a vertical separator', () => {
    render(<Separator data-testid="sep" orientation="vertical" />)
    expect(screen.getByTestId('sep')).toHaveAttribute('data-orientation', 'vertical')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Separator />)
    await expectNoA11yViolations(container)
  })
})
