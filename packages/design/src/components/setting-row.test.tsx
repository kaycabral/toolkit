import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SettingRow, SettingRowGroup } from './setting-row'

describe('SettingRow', () => {
  it('renders the title, description and control', () => {
    render(
      <SettingRow title="Nome completo" description="Como você aparece">
        <input aria-label="nome control" />
      </SettingRow>,
    )
    expect(screen.getByText('Nome completo')).toBeInTheDocument()
    expect(screen.getByText('Como você aparece')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'nome control' })).toBeInTheDocument()
  })

  it('renders the title as plain text (no label) when htmlFor is omitted', () => {
    render(
      <SettingRow title="Somente leitura">
        <span>valor</span>
      </SettingRow>,
    )
    // Without htmlFor the title is not a form label — it is not associated with a
    // control, so there is no accessible textbox named after it.
    expect(screen.getByText('Somente leitura')).toBeInTheDocument()
    expect(screen.queryByLabelText('Somente leitura')).not.toBeInTheDocument()
  })

  it('binds the title to the control when htmlFor is given', () => {
    render(
      <SettingRow title="Nome" htmlFor="name-input">
        <input id="name-input" />
      </SettingRow>,
    )
    // The title is a <label> bound to the control, so the input is reachable by
    // its accessible name.
    expect(screen.getByLabelText('Nome')).toBeInTheDocument()
  })

  it('renders each row inside the group', () => {
    render(
      <SettingRowGroup>
        <SettingRow title="Primeiro">
          <span>a</span>
        </SettingRow>
        <SettingRow title="Segundo">
          <span>b</span>
        </SettingRow>
      </SettingRowGroup>,
    )
    expect(screen.getByText('Primeiro')).toBeInTheDocument()
    expect(screen.getByText('Segundo')).toBeInTheDocument()
  })
})
