import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Input } from './input'
import { Label } from './label'

describe('Label', () => {
  it('associates with its control via htmlFor', () => {
    render(
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" />
      </div>,
    )
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" />
      </div>,
    )
    await expectNoA11yViolations(container)
  })
})
