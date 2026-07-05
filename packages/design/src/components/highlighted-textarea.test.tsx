import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { HighlightedTextarea, syncScrollToBackdrop } from './highlighted-textarea'

describe('HighlightedTextarea', () => {
  it('exposes an accessible, editable textarea holding the value', () => {
    render(
      <HighlightedTextarea
        aria-label="Mensagem"
        value="Olá {cliente_nome}"
        tokens={['{cliente_nome}']}
        onChange={() => {}}
      />,
    )
    const box = screen.getByRole('textbox', { name: 'Mensagem' })
    expect(box).toHaveValue('Olá {cliente_nome}')
  })

  it('marks a recognized token in the backdrop', () => {
    render(
      <HighlightedTextarea
        aria-label="Mensagem"
        value="Oi {cliente_nome}, tudo bem?"
        tokens={['{cliente_nome}']}
        onChange={() => {}}
      />,
    )
    // The recognized placeholder is wrapped in a <mark>; the surrounding text is
    // not. (mark has the implicit ARIA role "mark".)
    const marks = screen.getAllByRole('mark', { hidden: true })
    expect(marks).toHaveLength(1)
    expect(marks[0]).toHaveTextContent('{cliente_nome}')
  })

  it('does not mark an unknown placeholder', () => {
    render(
      <HighlightedTextarea
        aria-label="Mensagem"
        value="Oi {desconhecido}"
        tokens={['{cliente_nome}']}
        onChange={() => {}}
      />,
    )
    expect(screen.queryAllByRole('mark', { hidden: true })).toHaveLength(0)
  })

  it('marks every occurrence and prefers the longest token', () => {
    render(
      <HighlightedTextarea
        aria-label="Mensagem"
        value="{a} e {ab} e {a}"
        tokens={['{a}', '{ab}']}
        onChange={() => {}}
      />,
    )
    const marks = screen.getAllByRole('mark', { hidden: true })
    expect(marks.map((m) => m.textContent)).toEqual(['{a}', '{ab}', '{a}'])
  })

  it('highlights nothing when the token list is empty', () => {
    render(
      <HighlightedTextarea
        aria-label="Mensagem"
        value="Oi {cliente_nome}"
        tokens={[]}
        onChange={() => {}}
      />,
    )
    expect(screen.queryAllByRole('mark', { hidden: true })).toHaveLength(0)
    expect(screen.getByRole('textbox', { name: 'Mensagem' })).toHaveValue('Oi {cliente_nome}')
  })

  it('syncs the backdrop scroll and forwards onScroll', () => {
    const onScroll = vi.fn()
    render(
      <HighlightedTextarea
        aria-label="Mensagem"
        value="linha 1\nlinha 2"
        tokens={['{x}']}
        onChange={() => {}}
        onScroll={onScroll}
      />,
    )
    fireEvent.scroll(screen.getByRole('textbox', { name: 'Mensagem' }), {
      target: { scrollTop: 12, scrollLeft: 4 },
    })
    expect(onScroll).toHaveBeenCalledTimes(1)
  })
})

describe('syncScrollToBackdrop', () => {
  it('copies the scroll offsets onto the previous-sibling backdrop', () => {
    const backdrop = document.createElement('div')
    const textarea = document.createElement('textarea')
    const parent = document.createElement('div')
    parent.append(backdrop, textarea)
    textarea.scrollTop = 20
    textarea.scrollLeft = 8

    syncScrollToBackdrop(textarea)

    expect(backdrop.scrollTop).toBe(20)
    expect(backdrop.scrollLeft).toBe(8)
  })

  it('is a no-op when the textarea has no element sibling', () => {
    const textarea = document.createElement('textarea')
    // No parent / sibling — must not throw.
    expect(() => syncScrollToBackdrop(textarea)).not.toThrow()
  })
})
