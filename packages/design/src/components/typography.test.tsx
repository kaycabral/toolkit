import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Typography } from './typography'

const VARIANTS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'pageTitle',
  'p',
  'blockquote',
  'lead',
  'large',
  'small',
  'muted',
  'code',
] as const

describe('Typography', () => {
  it('renders every variant with its default semantic tag', () => {
    for (const variant of VARIANTS) {
      const { unmount } = render(<Typography variant={variant}>{variant} text</Typography>)
      expect(screen.getByText(`${variant} text`)).toBeInTheDocument()
      unmount()
    }
  })

  it('defaults to a paragraph when no variant is given', () => {
    render(<Typography>plain</Typography>)
    expect(screen.getByText('plain').tagName).toBe('P')
  })

  it('honours the `as` override for the semantic element', () => {
    render(
      <Typography variant="pageTitle" as="span">
        Agenda
      </Typography>,
    )
    expect(screen.getByText('Agenda').tagName).toBe('SPAN')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Typography variant="h1">Título</Typography>)
    await expectNoA11yViolations(container)
  })
})
