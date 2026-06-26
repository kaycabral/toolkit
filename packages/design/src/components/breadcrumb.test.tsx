import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './breadcrumb'

function Trail() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Início</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Detalhe</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

describe('Breadcrumb', () => {
  it('renders links, the current page and the navigation landmark', () => {
    render(<Trail />)
    expect(screen.getByRole('navigation', { name: 'breadcrumb' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Início' })).toHaveAttribute('href', '/')
    expect(screen.getByText('Detalhe')).toHaveAttribute('aria-current', 'page')
  })

  it('renders a link via asChild without a nested anchor', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <a href="/units">Unidades</a>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    )
    expect(screen.getByRole('link', { name: 'Unidades' })).toHaveAttribute('href', '/units')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Trail />)
    await expectNoA11yViolations(container)
  })
})
