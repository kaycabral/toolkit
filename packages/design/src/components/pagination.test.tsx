import { expectNoA11yViolations } from '@cbrl/testing/a11y'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { buildPaginationRange, Pagination } from './pagination'

describe('buildPaginationRange', () => {
  it('lists every page when they all fit without a gap', () => {
    expect(buildPaginationRange(1, 5)).toEqual([1, 2, 3, 4, 5])
  })

  it('collapses only the right side near the start', () => {
    expect(buildPaginationRange(2, 10)).toEqual([1, 2, 3, 4, 5, 'ellipsis-right', 10])
  })

  it('collapses only the left side near the end', () => {
    expect(buildPaginationRange(9, 10)).toEqual([1, 'ellipsis-left', 6, 7, 8, 9, 10])
  })

  it('collapses both sides in the middle', () => {
    expect(buildPaginationRange(5, 10)).toEqual([1, 'ellipsis-left', 4, 5, 6, 'ellipsis-right', 10])
  })

  it('widens the window with a larger siblingCount', () => {
    expect(buildPaginationRange(5, 20, 2)).toEqual([
      1,
      'ellipsis-left',
      3,
      4,
      5,
      6,
      7,
      'ellipsis-right',
      20,
    ])
  })
})

describe('Pagination', () => {
  it('renders nothing for a single page or fewer', () => {
    const { container } = render(<Pagination page={1} pageCount={1} onPageChange={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders prev, next and one button per visible page', () => {
    render(<Pagination page={1} pageCount={3} onPageChange={vi.fn()} />)
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go to page 3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go to previous page' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go to next page' })).toBeInTheDocument()
  })

  it('marks the current page with aria-current', () => {
    render(<Pagination page={2} pageCount={3} onPageChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Go to page 2' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('button', { name: 'Go to page 1' })).not.toHaveAttribute('aria-current')
  })

  it('disables prev on the first page and next on the last', () => {
    const { rerender } = render(<Pagination page={1} pageCount={3} onPageChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Go to previous page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Go to next page' })).toBeEnabled()

    rerender(<Pagination page={3} pageCount={3} onPageChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Go to previous page' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Go to next page' })).toBeDisabled()
  })

  it('fires onPageChange for a number, prev and next', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<Pagination page={2} pageCount={5} onPageChange={onPageChange} />)

    await user.click(screen.getByRole('button', { name: 'Go to page 4' }))
    await user.click(screen.getByRole('button', { name: 'Go to previous page' }))
    await user.click(screen.getByRole('button', { name: 'Go to next page' }))

    expect(onPageChange).toHaveBeenNthCalledWith(1, 4)
    expect(onPageChange).toHaveBeenNthCalledWith(2, 1)
    expect(onPageChange).toHaveBeenNthCalledWith(3, 3)
  })

  it('does not fire when clicking the already-current page', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<Pagination page={2} pageCount={5} onPageChange={onPageChange} />)
    await user.click(screen.getByRole('button', { name: 'Go to page 2' }))
    expect(onPageChange).not.toHaveBeenCalled()
  })

  it('renders an ellipsis for large ranges', () => {
    render(<Pagination page={5} pageCount={10} onPageChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go to page 10' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Go to page 3' })).not.toBeInTheDocument()
  })

  it('applies overridden labels', () => {
    render(
      <Pagination
        page={1}
        pageCount={2}
        onPageChange={vi.fn()}
        labels={{
          root: 'Paginação',
          previous: 'Página anterior',
          next: 'Próxima página',
          page: (n) => `Ir para página ${n}`,
        }}
      />,
    )
    expect(screen.getByRole('navigation', { name: 'Paginação' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ir para página 1' })).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    render(<Pagination page={2} pageCount={5} onPageChange={vi.fn()} />)
    await expectNoA11yViolations(document.body)
  })
})
