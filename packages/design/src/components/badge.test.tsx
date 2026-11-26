import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Badge, badgeVariants } from './badge'

const VARIANTS = [
  'default',
  'secondary',
  'destructive',
  'success',
  'warning',
  'info',
  'outline',
  'ghost',
  'link',
] as const

describe('Badge', () => {
  it('renders each variant and reflects it on data-variant', () => {
    for (const variant of VARIANTS) {
      const { unmount } = render(<Badge variant={variant}>{variant}</Badge>)
      expect(screen.getByText(variant)).toHaveAttribute('data-variant', variant)
      unmount()
    }
  })

  it('renders as a child element when asChild is set', () => {
    render(
      <Badge asChild>
        <a href="/new">Novo</a>
      </Badge>,
    )
    const link = screen.getByRole('link', { name: 'Novo' })
    expect(link).toHaveAttribute('data-slot', 'badge')
  })

  it('exposes badgeVariants as a class builder', () => {
    expect(typeof badgeVariants()).toBe('string')
    expect(badgeVariants({ variant: 'outline' })).toContain('text-foreground')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Badge>Ativo</Badge>)
    await expectNoA11yViolations(container)
  })
})
