import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from './avatar'

describe('Avatar', () => {
  it('shows the fallback when the image is not loaded (jsdom never loads)', () => {
    render(
      <Avatar>
        <AvatarImage src="/x.png" alt="Maria" />
        <AvatarFallback>MA</AvatarFallback>
      </Avatar>,
    )
    expect(screen.getByText('MA')).toBeInTheDocument()
  })

  it('applies the size data attribute', () => {
    render(
      <Avatar size="lg" role="img" aria-label="Maria">
        <AvatarFallback>X</AvatarFallback>
      </Avatar>,
    )
    expect(screen.getByRole('img', { name: 'Maria' })).toHaveAttribute('data-size', 'lg')
  })

  it('renders a group with an overflow count', () => {
    render(
      <AvatarGroup>
        <Avatar>
          <AvatarFallback>A</AvatarFallback>
        </Avatar>
        <AvatarGroupCount>+3</AvatarGroupCount>
      </AvatarGroup>,
    )
    expect(screen.getByText('+3')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Avatar>
        <AvatarFallback>MA</AvatarFallback>
      </Avatar>,
    )
    await expectNoA11yViolations(container)
  })
})
