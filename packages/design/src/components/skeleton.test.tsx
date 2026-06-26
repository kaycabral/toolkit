import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Skeleton } from './skeleton'

describe('Skeleton', () => {
  it('renders the pulse placeholder and merges className', () => {
    render(<Skeleton data-testid="sk" className="h-4 w-20" />)
    const el = screen.getByTestId('sk')
    expect(el).toHaveAttribute('data-slot', 'skeleton')
    expect(el).toHaveClass('animate-pulse', 'h-4', 'w-20')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Skeleton className="h-4 w-20" />)
    await expectNoA11yViolations(container)
  })
})
