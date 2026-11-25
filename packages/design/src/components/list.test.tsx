import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { List, ListItem } from './list'

type Customer = { id: string; name: string; email: string }

const customers: Customer[] = [
  { id: 'c1', name: 'Maria Silva', email: 'maria@example.com' },
  { id: 'c2', name: 'João Souza', email: 'joao@example.com' },
]

describe('List', () => {
  it('renders one row per item via renderItem', () => {
    render(
      <List
        items={customers}
        getKey={(c) => c.id}
        renderItem={(c) => ({ title: c.name, description: c.email })}
      />,
    )
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
    expect(screen.getByText('joao@example.com')).toBeInTheDocument()
  })

  it('omits the leading visual when neither leading nor icon is provided', () => {
    render(<List items={customers} getKey={(c) => c.id} renderItem={(c) => ({ title: c.name })} />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('renders an avatar leading plus a trailing value and hint', () => {
    render(
      <List
        items={customers}
        getKey={(c) => c.id}
        renderItem={(c) => ({
          leading: <img alt={c.name} src={`/${c.id}.png`} />,
          title: c.name,
          trailing: <span>R$ 120,00</span>,
          trailingHint: 'desc. R$ 5,00',
        })}
      />,
    )
    expect(screen.getByRole('img', { name: 'Maria Silva' })).toBeInTheDocument()
    expect(screen.getAllByText('R$ 120,00')).toHaveLength(2)
    expect(screen.getAllByText('desc. R$ 5,00')).toHaveLength(2)
  })

  it('wraps an icon in the media squircle, with leading taking precedence', () => {
    render(
      <List
        items={[customers[0]!]}
        getKey={(c) => c.id}
        renderItem={(c) => ({ icon: <span>★</span>, title: c.name })}
      />,
    )
    expect(screen.getByText('★')).toBeInTheDocument()

    render(
      <List
        items={[customers[1]!]}
        getKey={(c) => c.id}
        renderItem={(c) => ({ leading: <span>AV</span>, icon: <span>☆</span>, title: c.name })}
      />,
    )
    expect(screen.getByText('AV')).toBeInTheDocument()
    expect(screen.queryByText('☆')).not.toBeInTheDocument()
  })

  it('renders the status badge and meta column', () => {
    render(
      <List
        items={[customers[0]!]}
        getKey={(c) => c.id}
        renderItem={(c) => ({
          title: c.name,
          badge: <span>Ativo</span>,
          meta: '25/06/1990',
        })}
      />,
    )
    expect(screen.getByText('Ativo')).toBeInTheDocument()
    expect(screen.getByText('25/06/1990')).toBeInTheDocument()
  })

  it('renders an overflow actions slot and keeps the row static even with href', () => {
    render(
      <List
        items={[customers[0]!]}
        getKey={(c) => c.id}
        renderItem={(c) => ({
          title: c.name,
          href: `/customers/${c.id}`,
          actions: <button type="button">Ações</button>,
        })}
      />,
    )
    expect(screen.getByRole('button', { name: 'Ações' })).toBeInTheDocument()
    // The row must not become a link when it carries an actions menu.
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('renders rows with href as links, using a custom linkComponent', () => {
    function Link({
      href,
      className,
      children,
    }: {
      href: string
      className?: string
      children?: React.ReactNode
    }) {
      return (
        <a href={href} className={`router-link ${className ?? ''}`}>
          {children}
        </a>
      )
    }
    render(
      <List
        items={customers}
        getKey={(c) => c.id}
        linkComponent={Link}
        renderItem={(c) => ({ title: c.name, href: `/customers/${c.id}` })}
      />,
    )
    const link = screen.getByRole('link', { name: 'Maria Silva' })
    expect(link).toHaveAttribute('href', '/customers/c1')
    expect(link).toHaveClass('router-link')
  })

  it('falls back to a plain <a> when no linkComponent is given', () => {
    render(
      <List
        items={customers}
        getKey={(c) => c.id}
        renderItem={(c) => ({ title: c.name, href: `/customers/${c.id}` })}
      />,
    )
    const link = screen.getByRole('link', { name: 'Maria Silva' })
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', '/customers/c1')
  })

  it('renders rows with onClick as buttons and fires the handler', async () => {
    const onClick = vi.fn()
    render(
      <List
        items={[customers[0]!]}
        getKey={(c) => c.id}
        renderItem={(c) => ({ title: c.name, onClick })}
      />,
    )
    const row = screen.getByRole('button', { name: 'Maria Silva' })
    // Spans the row and reads left-aligned, like link and static rows.
    expect(row).toHaveClass('w-full', 'text-left')
    await userEvent.click(row)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('shows the empty state when there are no items', () => {
    render(
      <List
        items={[]}
        getKey={(c: Customer) => c.id}
        renderItem={(c) => ({ title: c.name })}
        empty={{ title: 'Nenhum cliente cadastrado' }}
      />,
    )
    expect(screen.getByText('Nenhum cliente cadastrado')).toBeInTheDocument()
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })

  it('renders nothing when empty and no empty prop is given', () => {
    render(
      <List items={[]} getKey={(c: Customer) => c.id} renderItem={(c) => ({ title: c.name })} />,
    )
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('renders skeleton rows while loading, honouring loadingLeading', () => {
    const { rerender } = render(
      <List
        items={customers}
        getKey={(c) => c.id}
        renderItem={(c) => ({ title: c.name })}
        loading
        loadingCount={4}
      />,
    )
    expect(screen.queryByText('Maria Silva')).not.toBeInTheDocument()
    expect(screen.getAllByRole('listitem', { hidden: true })).toHaveLength(4)

    rerender(
      <List
        items={customers}
        getKey={(c) => c.id}
        renderItem={(c) => ({ title: c.name })}
        loading
        loadingCount={2}
        loadingLeading={false}
      />,
    )
    expect(screen.getAllByRole('listitem', { hidden: true })).toHaveLength(2)
  })

  it('is bordered by default and plain when bordered is false', () => {
    const { rerender } = render(
      <List items={customers} getKey={(c) => c.id} renderItem={(c) => ({ title: c.name })} />,
    )
    let list = screen.getByRole('list')
    expect(list).toHaveAttribute('data-bordered', 'true')
    expect(list).toHaveClass('rounded-md', 'border')

    rerender(
      <List
        items={customers}
        getKey={(c) => c.id}
        renderItem={(c) => ({ title: c.name })}
        bordered={false}
      />,
    )
    list = screen.getByRole('list')
    expect(list).toHaveAttribute('data-bordered', 'false')
    expect(list).not.toHaveClass('rounded-md')
  })

  it('exposes ListItem as an escape-hatch row, rendering a div by default', () => {
    render(<ListItem>Linha avulsa</ListItem>)
    const item = screen.getByText('Linha avulsa')
    expect(item.tagName).toBe('DIV')
    expect(item).toHaveAttribute('data-slot', 'list-item')
  })

  it('renders ListItem as its child element when asChild is set', () => {
    render(
      <ListItem asChild interactive>
        <a href="/x">Linha clicável</a>
      </ListItem>,
    )
    const link = screen.getByRole('link', { name: 'Linha clicável' })
    expect(link).toHaveAttribute('href', '/x')
    expect(link).toHaveAttribute('data-interactive', 'true')
  })

  it('has no accessibility violations in its richest form', async () => {
    const { container } = render(
      <List
        items={customers}
        getKey={(c) => c.id}
        renderItem={(c) => ({
          icon: <span aria-hidden>●</span>,
          title: c.name,
          badge: <span>Ativo</span>,
          description: c.email,
          meta: '25/06',
          trailing: <span>R$ 120,00</span>,
          trailingHint: 'desc. R$ 5,00',
          actions: (
            <button type="button" aria-label={`Ações de ${c.name}`}>
              ⋯
            </button>
          ),
        })}
      />,
    )
    await expectNoA11yViolations(container)
  })
})

describe('List — toolbar, filters and pagination', () => {
  const renderName = (c: Customer): { title: string } => ({ title: c.name })

  it('submits the trimmed query on Enter, not on every keystroke', async () => {
    const onSearch = vi.fn()
    render(
      <List
        items={customers}
        getKey={(c) => c.id}
        renderItem={renderName}
        search={{ value: '', onSearch, placeholder: 'Buscar por nome…' }}
      />,
    )
    const box = screen.getByRole('searchbox', { name: 'Buscar por nome…' })
    await userEvent.type(box, '  maria')
    expect(onSearch).not.toHaveBeenCalled()
    await userEvent.type(box, '{Enter}')
    expect(onSearch).toHaveBeenCalledExactlyOnceWith('maria')
  })

  it('submits when the search icon is clicked', async () => {
    const onSearch = vi.fn()
    render(
      <List
        items={customers}
        getKey={(c) => c.id}
        renderItem={renderName}
        search={{ value: '', onSearch, placeholder: 'Buscar' }}
      />,
    )
    await userEvent.type(screen.getByRole('searchbox'), 'ze')
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(onSearch).toHaveBeenCalledExactlyOnceWith('ze')
  })

  it('re-syncs the draft when the applied value changes from outside', () => {
    const { rerender } = render(
      <List
        items={customers}
        getKey={(c) => c.id}
        renderItem={renderName}
        search={{ value: 'maria', onSearch: vi.fn(), placeholder: 'Buscar' }}
      />,
    )
    expect(screen.getByRole('searchbox')).toHaveValue('maria')
    rerender(
      <List
        items={customers}
        getKey={(c) => c.id}
        renderItem={renderName}
        search={{ value: '', onSearch: vi.fn(), placeholder: 'Buscar' }}
      />,
    )
    expect(screen.getByRole('searchbox')).toHaveValue('')
  })

  it('renders a header slot above the list', () => {
    render(
      <List
        items={customers}
        getKey={(c) => c.id}
        renderItem={renderName}
        header={<h1>Clientes</h1>}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Clientes' })).toBeInTheDocument()
    expect(screen.getByRole('list')).toBeInTheDocument()
  })

  it('hides the header when truly empty so the protagonist owns the screen', () => {
    render(
      <List
        items={[]}
        getKey={(c: Customer) => c.id}
        renderItem={renderName}
        header={<h1>Clientes</h1>}
        empty={{ title: 'Nenhum cliente cadastrado' }}
      />,
    )
    expect(screen.queryByRole('heading', { name: 'Clientes' })).not.toBeInTheDocument()
    expect(screen.getByText('Nenhum cliente cadastrado')).toBeInTheDocument()
  })

  it('renders filter dropdowns showing the current selection', () => {
    render(
      <List
        items={customers}
        getKey={(c) => c.id}
        renderItem={renderName}
        filters={[
          {
            key: 'status',
            label: 'Status',
            value: 'active',
            onChange: vi.fn(),
            // The "all" option is auto-prepended from `label`; options are the
            // specific values only.
            options: [
              { value: 'active', label: 'Ativos' },
              { value: 'inactive', label: 'Inativos' },
            ],
          },
        ]}
      />,
    )
    // The trigger is named for a11y via aria-label and shows the selected value.
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveTextContent('Ativos')
  })

  it('shows the field name as the resting (all) option label', () => {
    render(
      <List
        items={customers}
        getKey={(c) => c.id}
        renderItem={renderName}
        filters={[
          {
            key: 'status',
            label: 'Status',
            value: 'all',
            onChange: vi.fn(),
            options: [{ value: 'active', label: 'Ativos' }],
          },
        ]}
      />,
    )
    // At rest (value === all) the trigger reads as the field name.
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveTextContent('Status')
  })

  it('honours a custom allValue/allLabel and falls back to the field name for an unknown value', () => {
    const { rerender } = render(
      <List
        items={customers}
        getKey={(c) => c.id}
        renderItem={renderName}
        filters={[
          {
            key: 'k',
            label: 'Campo',
            allValue: '__all',
            allLabel: 'Qualquer',
            value: '__all',
            onChange: vi.fn(),
            options: [{ value: 'x', label: 'X' }],
          },
        ]}
      />,
    )
    // value === the custom allValue → the trigger reads as the field name.
    expect(screen.getByRole('combobox', { name: 'Campo' })).toHaveTextContent('Campo')

    // A value that matches neither the all sentinel nor any option falls back to
    // the field name rather than rendering blank.
    rerender(
      <List
        items={customers}
        getKey={(c) => c.id}
        renderItem={renderName}
        filters={[
          {
            key: 'k',
            label: 'Campo',
            allValue: '__all',
            allLabel: 'Qualquer',
            value: 'zzz',
            onChange: vi.fn(),
            options: [{ value: 'x', label: 'X' }],
          },
        ]}
      />,
    )
    expect(screen.getByRole('combobox', { name: 'Campo' })).toHaveTextContent('Campo')
  })

  it('renders an escape-hatch toolbarExtra node', () => {
    render(
      <List
        items={customers}
        getKey={(c) => c.id}
        renderItem={renderName}
        toolbarExtra={<button type="button">Exportar</button>}
      />,
    )
    expect(screen.getByRole('button', { name: 'Exportar' })).toBeInTheDocument()
  })

  it('renders pagination below the list and forwards page clicks', async () => {
    const onPageChange = vi.fn()
    render(
      <List
        items={customers}
        getKey={(c) => c.id}
        renderItem={renderName}
        pagination={{ page: 1, pageCount: 3, onPageChange }}
      />,
    )
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Go to page 2' }))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('shows filtered-empty (keeping the toolbar) when a search narrows to zero', () => {
    render(
      <List
        items={[]}
        getKey={(c: Customer) => c.id}
        renderItem={renderName}
        search={{ value: 'zzz', onSearch: vi.fn(), placeholder: 'Buscar' }}
        empty={{ title: 'Nenhum cliente cadastrado' }}
        filteredEmpty={{ title: 'Nenhum resultado para "zzz"' }}
      />,
    )
    expect(screen.getByText('Nenhum resultado para "zzz"')).toBeInTheDocument()
    expect(screen.queryByText('Nenhum cliente cadastrado')).not.toBeInTheDocument()
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
  })

  it('defaults filtered-empty to a neutral "No results"', () => {
    render(
      <List
        items={[]}
        getKey={(c: Customer) => c.id}
        renderItem={renderName}
        search={{ value: 'zzz', onSearch: vi.fn() }}
      />,
    )
    expect(screen.getByText('No results')).toBeInTheDocument()
  })

  it('treats a non-default filter value as an active query', () => {
    render(
      <List
        items={[]}
        getKey={(c: Customer) => c.id}
        renderItem={renderName}
        filters={[
          {
            key: 'status',
            label: 'Status',
            value: 'inactive',
            onChange: vi.fn(),
            options: [{ value: 'inactive', label: 'Inativos' }],
          },
        ]}
        empty={{ title: 'Vazio total' }}
        filteredEmpty={{ title: 'Sem resultado filtrado' }}
      />,
    )
    expect(screen.getByText('Sem resultado filtrado')).toBeInTheDocument()
    expect(screen.queryByText('Vazio total')).not.toBeInTheDocument()
  })

  it('shows the create protagonist (no toolbar) when truly empty with no active query', () => {
    render(
      <List
        items={[]}
        getKey={(c: Customer) => c.id}
        renderItem={renderName}
        search={{ value: '', onSearch: vi.fn() }}
        filters={[
          {
            key: 'status',
            label: 'Status',
            value: 'all',
            onChange: vi.fn(),
            options: [{ value: 'active', label: 'Ativos' }],
          },
        ]}
        empty={{ title: 'Nenhum cliente cadastrado' }}
        filteredEmpty={{ title: 'NÃO deve aparecer' }}
      />,
    )
    expect(screen.getByText('Nenhum cliente cadastrado')).toBeInTheDocument()
    expect(screen.queryByText('NÃO deve aparecer')).not.toBeInTheDocument()
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })

  it('renders a custom empty element when empty is a React element', () => {
    render(
      <List
        items={[]}
        getKey={(c: Customer) => c.id}
        renderItem={renderName}
        empty={
          <form aria-label="create">
            <button type="submit">Registrar venda</button>
          </form>
        }
      />,
    )
    expect(screen.getByRole('button', { name: 'Registrar venda' })).toBeInTheDocument()
  })

  it('renders a custom filtered-empty element while a query is active', () => {
    render(
      <List
        items={[]}
        getKey={(c: Customer) => c.id}
        renderItem={renderName}
        search={{ value: 'zzz', onSearch: vi.fn(), placeholder: 'Buscar' }}
        filteredEmpty={<p>Nada em “zzz”.</p>}
      />,
    )
    expect(screen.getByText('Nada em “zzz”.')).toBeInTheDocument()
  })

  it('honours the isFiltered override against the inference', () => {
    render(
      <List
        items={[]}
        getKey={(c: Customer) => c.id}
        renderItem={renderName}
        search={{ value: '', onSearch: vi.fn() }}
        isFiltered
        empty={{ title: 'Protagonista' }}
        filteredEmpty={{ title: 'Forçado filtrado' }}
      />,
    )
    expect(screen.getByText('Forçado filtrado')).toBeInTheDocument()
    expect(screen.queryByText('Protagonista')).not.toBeInTheDocument()
  })

  it('keeps the toolbar above skeleton rows while loading', () => {
    render(
      <List
        items={customers}
        getKey={(c) => c.id}
        renderItem={renderName}
        loading
        loadingCount={3}
        search={{ value: '', onSearch: vi.fn(), placeholder: 'Buscar' }}
      />,
    )
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem', { hidden: true })).toHaveLength(3)
  })

  it('has no accessibility violations with the full toolbar and pagination', async () => {
    const { container } = render(
      <List
        items={customers}
        getKey={(c) => c.id}
        renderItem={renderName}
        search={{ value: 'a', onSearch: vi.fn(), placeholder: 'Buscar' }}
        filters={[
          {
            key: 'status',
            label: 'Status',
            value: 'all',
            onChange: vi.fn(),
            options: [{ value: 'active', label: 'Ativos' }],
          },
        ]}
        pagination={{ page: 1, pageCount: 3, onPageChange: vi.fn() }}
      />,
    )
    await expectNoA11yViolations(container)
  })
})
