import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SettingsSection } from './settings-section'

describe('SettingsSection', () => {
  it('renders the title as a heading with the described text and children', () => {
    render(
      <SettingsSection title="Perfil" description="Corrija seus dados">
        <div>bloco</div>
      </SettingsSection>,
    )
    expect(screen.getByRole('heading', { name: 'Perfil' })).toBeInTheDocument()
    expect(screen.getByText('Corrija seus dados')).toBeInTheDocument()
    expect(screen.getByText('bloco')).toBeInTheDocument()
  })

  it('omits the description when none is given', () => {
    render(
      <SettingsSection title="Cobrança">
        <div>bloco</div>
      </SettingsSection>,
    )
    expect(screen.getByRole('heading', { name: 'Cobrança' })).toBeInTheDocument()
    expect(screen.getByText('bloco')).toBeInTheDocument()
  })

  it('renders trailing action content alongside the title', () => {
    render(
      <SettingsSection title="Cobrança" action={<span>Ativa</span>}>
        <div>bloco</div>
      </SettingsSection>,
    )
    expect(screen.getByText('Ativa')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <SettingsSection title="Perfil" description="Corrija seus dados">
        <div>bloco</div>
      </SettingsSection>,
    )
    await expectNoA11yViolations(container)
  })
})
