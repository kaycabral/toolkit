import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Button, buttonVariants } from './button'

const VARIANTS = ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'] as const
const SIZES = ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'] as const

describe('Button', () => {
  it('renders every variant', () => {
    for (const variant of VARIANTS) {
      const { unmount } = render(<Button variant={variant}>{variant}</Button>)
      expect(screen.getByRole('button', { name: variant })).toHaveAttribute('data-variant', variant)
      unmount()
    }
  })

  it('renders every size', () => {
    for (const size of SIZES) {
      const { unmount } = render(<Button size={size}>b</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('data-size', size)
      unmount()
    }
  })

  it('fires onClick', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Salvar</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not fire onClick when disabled', async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Salvar
      </Button>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('renders as a child element when asChild is set', () => {
    render(
      <Button asChild>
        <a href="/go">Ir</a>
      </Button>,
    )
    expect(screen.getByRole('link', { name: 'Ir' })).toHaveAttribute('data-slot', 'button')
  })

  it('exposes buttonVariants as a class builder', () => {
    expect(buttonVariants({ variant: 'destructive', size: 'sm' })).toContain('text-destructive')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Button>Salvar</Button>)
    await expectNoA11yViolations(container)
  })
})
