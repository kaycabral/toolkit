import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from './field'
import { Input } from './input'

function Form() {
  return (
    <FieldGroup>
      <FieldSet>
        <FieldLegend>Dados da unidade</FieldLegend>
        <Field>
          <FieldLabel htmlFor="name" required>
            Nome
          </FieldLabel>
          <FieldContent>
            <Input id="name" />
            <FieldDescription>Como a unidade aparece na agenda.</FieldDescription>
          </FieldContent>
        </Field>
        <FieldSeparator>ou</FieldSeparator>
        <Field>
          <FieldTitle>Resumo</FieldTitle>
        </Field>
      </FieldSet>
    </FieldGroup>
  )
}

describe('Field', () => {
  it('associates the label with its control and marks it required', () => {
    render(<Form />)
    const input = screen.getByLabelText(/Nome/)
    expect(input).toHaveAttribute('id', 'name')
    expect(screen.getByText('Como a unidade aparece na agenda.')).toBeInTheDocument()
  })

  it('renders a horizontal field orientation', () => {
    render(
      <Field orientation="horizontal">
        <FieldTitle>Ativo</FieldTitle>
      </Field>,
    )
    expect(screen.getByText('Ativo').closest('[data-slot=field]')).toHaveAttribute(
      'data-orientation',
      'horizontal',
    )
  })

  describe('FieldError', () => {
    it('renders nothing when there is no content', () => {
      const { container } = render(<FieldError />)
      expect(container).toBeEmptyDOMElement()
    })

    it('renders a single error message inline', () => {
      render(<FieldError errors={[{ message: 'Obrigatório' }]} />)
      expect(screen.getByRole('alert')).toHaveTextContent('Obrigatório')
    })

    it('renders multiple errors as a list', () => {
      render(<FieldError errors={[{ message: 'Muito curto' }, { message: 'Sem espaços' }]} />)
      expect(screen.getAllByRole('listitem')).toHaveLength(2)
    })

    it('prefers explicit children over the errors prop', () => {
      render(<FieldError errors={[{ message: 'ignored' }]}>Mensagem custom</FieldError>)
      expect(screen.getByRole('alert')).toHaveTextContent('Mensagem custom')
    })
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Form />)
    await expectNoA11yViolations(container)
  })
})
