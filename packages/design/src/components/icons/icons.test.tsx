import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { GoogleIcon } from './google-icon'
import { WhatsappIcon } from './whatsapp-icon'

describe.each([
  ['WhatsappIcon', WhatsappIcon, 'whatsapp-icon'],
  ['GoogleIcon', GoogleIcon, 'google-icon'],
] as const)('%s', (name, Icon, slot) => {
  it('is decorative by default', () => {
    render(
      <button type="button">
        <Icon />
        Share
      </button>,
    )
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('forwards svg props and lets them override the defaults', () => {
    render(<Icon className="size-4" role="img" aria-hidden={false} aria-label={name} />)
    const svg = screen.getByRole('img', { name })
    expect(svg).toHaveAttribute('data-slot', slot)
    expect(svg).toHaveClass('size-4')
  })

  it('exposes an accessible image when given a title', () => {
    render(<Icon title={name} />)
    const img = screen.getByRole('img', { name })
    expect(img).not.toHaveAttribute('aria-hidden')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <button type="button">
        <Icon />
        Share
      </button>,
    )
    await expectNoA11yViolations(container)
  })

  it('has no accessibility violations with a title', async () => {
    const { container } = render(<Icon title={name} />)
    await expectNoA11yViolations(container)
  })
})
