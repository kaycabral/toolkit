import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

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
