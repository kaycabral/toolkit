'use client'

import * as React from 'react'

import { cn } from '../lib/cn'

// A textarea that highlights recognized tokens inline — the way an editor marks
// a placeholder / code span. It renders a mirror layer behind a transparent
// textarea: the mirror paints the same text with the matched tokens wrapped in a
// styled <mark>, and the real textarea (fully editable, accessible) sits on top.
// The two share identical typography + padding and scroll together, so the
// highlight tracks the caret exactly.
//
// `tokens` are the exact strings to highlight (e.g. the known placeholders); any
// occurrence of one is marked. Matching is literal (tokens are escaped), longest
// first, so overlapping tokens don't mis-highlight. Everything else renders as
// plain text — an unknown `{foo}` is deliberately NOT highlighted, which is the
// signal that it won't be substituted.

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Splits `text` into segments, flagging which ones matched a token. Built from a
// single alternation regex (longest token first) so adjacent/overlapping tokens
// resolve deterministically.
function segment(text: string, tokens: readonly string[]): Array<{ text: string; match: boolean }> {
  const active = tokens.filter((t) => t.length > 0)
  if (active.length === 0) return [{ text, match: false }]

  const pattern = [...active]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join('|')
  const re = new RegExp(pattern, 'g')

  const out: Array<{ text: string; match: boolean }> = []
  let last = 0
  for (let m = re.exec(text); m !== null; m = re.exec(text)) {
    if (m.index > last) out.push({ text: text.slice(last, m.index), match: false })
    out.push({ text: m[0], match: true })
    last = m.index + m[0].length
  }
  if (last < text.length) out.push({ text: text.slice(last), match: false })
  return out
}

// Copies a textarea's scroll offsets onto its backdrop (the immediate previous
// sibling). A no-op when there is no element sibling — exported so the sync is
// covered directly, both with and without a backdrop present.
export function syncScrollToBackdrop(textarea: HTMLTextAreaElement): void {
  const backdrop = textarea.previousElementSibling
  if (!(backdrop instanceof HTMLElement)) return
  backdrop.scrollTop = textarea.scrollTop
  backdrop.scrollLeft = textarea.scrollLeft
}

// Shared box geometry + typography, so the mirror and the textarea overlap to
// the pixel. Any change here must stay identical on both layers.
const SHARED_BOX =
  'w-full rounded-lg border px-2.5 py-2 text-base whitespace-pre-wrap break-words md:text-sm'

function HighlightedTextarea({
  value,
  tokens,
  className,
  onScroll,
  ...props
}: Omit<React.ComponentProps<'textarea'>, 'value'> & {
  value: string
  tokens: readonly string[]
}) {
  // Mirror the textarea's scroll onto the backdrop so long text stays aligned.
  // The backdrop is the textarea's immediate previous sibling in the fixed render
  // order below — `syncScrollToBackdrop` reads it from the DOM, so no ref is
  // needed (and the sync is unit-testable without a mounted layout).
  function handleScroll(event: React.UIEvent<HTMLTextAreaElement>) {
    syncScrollToBackdrop(event.currentTarget)
    onScroll?.(event)
  }

  const segments = segment(value, tokens)

  return (
    <div data-slot="highlighted-textarea" className="relative">
      {/* Backdrop: same box + type as the textarea, painting the highlights. It
          is aria-hidden — the textarea is the accessible control. A trailing
          newline keeps the last line's height when text ends in "\n". */}
      <div
        aria-hidden="true"
        className={cn(
          SHARED_BOX,
          'text-foreground border-transparent',
          'pointer-events-none absolute inset-0 overflow-auto select-none',
          className,
        )}
      >
        {segments.map((seg, i) =>
          seg.match ? (
            <mark key={i} className="bg-primary/15 text-primary rounded-[3px] px-0.5 font-medium">
              {seg.text}
            </mark>
          ) : (
            <React.Fragment key={i}>{seg.text}</React.Fragment>
          ),
        )}
        {'\n'}
      </div>

      <textarea
        data-slot="highlighted-textarea-input"
        value={value}
        onScroll={handleScroll}
        className={cn(
          SHARED_BOX,
          'border-input focus-visible:border-ring focus-visible:ring-ring/50 caret-foreground relative bg-transparent text-transparent transition-colors outline-none focus-visible:ring-3',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'placeholder:text-muted-foreground field-sizing-content min-h-16 resize-y',
          className,
        )}
        {...props}
      />
    </div>
  )
}

export { HighlightedTextarea }
