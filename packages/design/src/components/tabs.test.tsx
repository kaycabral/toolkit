import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Tabs, TabsContent, TabsCount, TabsList, TabsTrigger } from './tabs'

function TabsTree() {
  return (
    <Tabs defaultValue="agenda">
      <TabsList>
        <TabsTrigger value="agenda">Agenda</TabsTrigger>
        <TabsTrigger value="clientes">Clientes</TabsTrigger>
      </TabsList>
      <TabsContent value="agenda">Painel da agenda</TabsContent>
      <TabsContent value="clientes">Painel de clientes</TabsContent>
    </Tabs>
  )
}

describe('Tabs', () => {
  it('shows the default tab panel', () => {
    render(<TabsTree />)
    expect(screen.getByText('Painel da agenda')).toBeInTheDocument()
    expect(screen.queryByText('Painel de clientes')).not.toBeInTheDocument()
  })

  it('switches the active panel when another tab is selected', async () => {
    render(<TabsTree />)
    await userEvent.click(screen.getByRole('tab', { name: 'Clientes' }))
    expect(screen.getByText('Painel de clientes')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<TabsTree />)
    await expectNoA11yViolations(container)
  })
})

describe('Tabs · line variant', () => {
  function LineTree() {
    return (
      <Tabs defaultValue="atrasadas">
        <TabsList variant="line">
          <TabsTrigger value="atrasadas">
            Atrasadas <TabsCount tone="destructive">2</TabsCount>
          </TabsTrigger>
          <TabsTrigger value="semana">7 dias</TabsTrigger>
        </TabsList>
        <TabsContent value="atrasadas">Lista atrasada</TabsContent>
        <TabsContent value="semana">Lista da semana</TabsContent>
      </Tabs>
    )
  }

  it('marks the list variant and names the tab with its count', () => {
    render(<LineTree />)
    expect(screen.getByRole('tablist')).toHaveAttribute('data-variant', 'line')
    expect(screen.getByRole('tab', { name: 'Atrasadas 2' })).toHaveAttribute('data-state', 'active')
  })

  it('defaults to the pill variant', () => {
    render(<TabsTree />)
    expect(screen.getByRole('tablist')).toHaveAttribute('data-variant', 'default')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<LineTree />)
    await expectNoA11yViolations(container)
  })
})
