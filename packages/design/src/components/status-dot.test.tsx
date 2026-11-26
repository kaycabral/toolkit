import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StatusDot, statusDotVariants } from './status-dot'

describe('StatusDot', () => {
  it('is an image with the label as its name', () => {
    render(<StatusDot tone="success" label="Online" />)
    const dot = screen.getByRole('img', { name: 'Online' })
    expect(dot).toHaveAttribute('data-slot', 'status-dot')
    expect(dot).toHaveAttribute('data-tone', 'success')
    expect(dot).toHaveClass('bg-emerald-500', 'size-2')
  })

  it('is decorative without a label and defaults to muted', () => {
    render(
      <p>
        <StatusDot size="lg" /> Offline
      </p>,
    )
    const row = screen.getByText('Offline')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(row).toContainHTML('aria-hidden="true"')
    expect(row).toContainHTML('data-tone="muted"')
    expect(row).toContainHTML('size-2.5')
  })

  it('adds a ping ring that hides under reduced motion', () => {
    render(<StatusDot tone="warning" pulse label="Pendente" />)
    const dot = screen.getByRole('img', { name: 'Pendente' })
    expect(dot).toContainHTML('data-slot="status-dot-pulse"')
    expect(dot).toContainHTML('animate-ping')
    expect(dot).toContainHTML('motion-reduce:hidden')
  })

  it('exposes statusDotVariants', () => {
    expect(statusDotVariants({ tone: 'destructive', size: 'sm' })).toContain('bg-destructive')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <p>
        <StatusDot tone="info" label="Sincronizando" pulse /> <StatusDot /> Texto
      </p>,
    )
    await expectNoA11yViolations(container)
  })
})
