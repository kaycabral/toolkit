import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import { useTheme } from 'next-themes'
import { describe, expect, it } from 'vitest'

import { ThemeProvider } from './theme-provider'

function CurrentTheme() {
  const { theme } = useTheme()
  return <p>theme: {theme}</p>
}

describe('ThemeProvider', () => {
  it('renders children and forwards props to next-themes', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <CurrentTheme />
      </ThemeProvider>,
    )
    expect(screen.getByText('theme: dark')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <ThemeProvider attribute="class">
        <p>content</p>
      </ThemeProvider>,
    )
    await expectNoA11yViolations(container)
  })
})
