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

  it('collapses children past max into a +K count', async () => {
    const { container } = render(
      <AvatarGroup max={2}>
        {['A', 'B', 'C', 'D', 'E'].map((name) => (
          <Avatar key={name}>
            <AvatarFallback>{name}</AvatarFallback>
          </Avatar>
        ))}
      </AvatarGroup>,
    )
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
    expect(screen.queryByText('C')).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: '+3' })).toHaveTextContent('+3')
    await expectNoA11yViolations(container)
  })

  it('renders every child when they fit max, with a custom count label', () => {
    const { rerender } = render(
      <AvatarGroup max={3}>
        <Avatar>
          <AvatarFallback>A</AvatarFallback>
        </Avatar>
        {null}
        <Avatar>
          <AvatarFallback>B</AvatarFallback>
        </Avatar>
      </AvatarGroup>,
    )
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument()
    rerender(
      <AvatarGroup max={1} overflowLabel={(n) => `mais ${n}`}>
        <Avatar>
          <AvatarFallback>A</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>B</AvatarFallback>
        </Avatar>
      </AvatarGroup>,
    )
    expect(screen.getByRole('img', { name: 'mais 1' })).toHaveTextContent('+1')
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
