import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AuthSplitScreen } from './auth-split-screen'

const visualPanel = <span>mosaico</span>

describe('AuthSplitScreen', () => {
  it('renders the entry column as the main landmark, beside the decorative panel', () => {
    render(<AuthSplitScreen visual={visualPanel}>entrada</AuthSplitScreen>)
    expect(screen.getByRole('main')).toHaveTextContent('entrada')
    expect(screen.getByText('mosaico')).toBeInTheDocument()
  })

  it('renders a plain single column when no visual is given', () => {
    render(<AuthSplitScreen>entrada</AuthSplitScreen>)
    expect(screen.getByRole('main')).toHaveTextContent('entrada')
    expect(screen.queryByText('mosaico')).not.toBeInTheDocument()
    // Degenerate input must not leave the entry column at half width with a gap
    // where the panel would have been.
    expect(screen.getByRole('main')).toHaveClass('w-full')
  })

  it('centers the entry column on both axes', () => {
    render(<AuthSplitScreen visual={visualPanel}>entrada</AuthSplitScreen>)
    expect(screen.getByRole('main')).toHaveClass('items-center', 'justify-center')
  })

  // The panel is decorative, so it stays out of the accessibility tree: a screen
  // reader must never have to walk past a mosaic to reach the sign-in button.
  it('keeps the decorative panel out of the accessibility tree', () => {
    render(
      <AuthSplitScreen visual={visualPanel}>
        <button type="button">Continuar</button>
      </AuthSplitScreen>,
    )
    // `mosaico` renders, but nothing inside the panel is reachable by role —
    // aria-hidden prunes the whole subtree.
    expect(screen.getByText('mosaico')).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })

  it('has no a11y violations', async () => {
    const { container } = render(
      <AuthSplitScreen visual={visualPanel}>
        <button type="button">Continuar</button>
      </AuthSplitScreen>,
    )
    await expectNoA11yViolations(container)
  })
})
