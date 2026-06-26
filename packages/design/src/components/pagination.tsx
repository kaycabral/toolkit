'use client'

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

import { cn } from '../lib/cn'
import { buttonVariants } from './button'

// Controlled, framework-agnostic pagination. It holds NO state and never knows
// where `page` lives — the consumer owns it (a URL param in Next, `useState`
// elsewhere) and reacts to `onPageChange`. Page numbers are buttons (not links)
// so it fits server-side paging: changing the page just fires the callback and
// the consumer refetches the slice. Visual reference: shadcn "Pagination", but
// icon-only prev/next so no language leaks into the shared layer (aria-labels
// are overridable via `labels`). Collapses to nothing for a single page.

type EllipsisToken = 'ellipsis-left' | 'ellipsis-right'

/**
 * Page tokens to render: always first + last, a window of `siblingCount` around
 * the current page, and ellipses for the gaps. Pure + exported for unit testing
 * the windowing in isolation.
 */
export function buildPaginationRange(
  page: number,
  pageCount: number,
  siblingCount = 1,
): (number | EllipsisToken)[] {
  const range = (start: number, end: number): number[] =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i)

  // first + last + current + 2·siblings + 2 ellipses. Below this everything
  // fits without a gap, so render the plain sequence.
  const totalSlots = siblingCount * 2 + 5
  if (pageCount <= totalSlots) return range(1, pageCount)

  const leftSibling = Math.max(page - siblingCount, 1)
  const rightSibling = Math.min(page + siblingCount, pageCount)
  const showLeftEllipsis = leftSibling > 2
  const showRightEllipsis = rightSibling < pageCount - 1

  if (!showLeftEllipsis && showRightEllipsis) {
    return [...range(1, siblingCount * 2 + 3), 'ellipsis-right', pageCount]
  }
  if (showLeftEllipsis && !showRightEllipsis) {
    return [1, 'ellipsis-left', ...range(pageCount - (siblingCount * 2 + 2), pageCount)]
  }
  return [1, 'ellipsis-left', ...range(leftSibling, rightSibling), 'ellipsis-right', pageCount]
}

type PaginationLabels = {
  /** `aria-label` of the wrapping nav. */
  root?: string
  /** `aria-label` of the previous-page control. */
  previous?: string
  /** `aria-label` of the next-page control. */
  next?: string
  /** `aria-label` of a numbered page control. */
  page?: (page: number) => string
}

type PaginationProps = {
  /** Current page, 1-based. */
  page: number
  /** Total number of pages. */
  pageCount: number
  /** Fired with the target page (clamped to `[1, pageCount]`). */
  onPageChange: (page: number) => void
  /** Pages shown on each side of the current page before collapsing. Default 1. */
  siblingCount?: number
  /** Accessible labels — English defaults; override for localization. */
  labels?: PaginationLabels
  className?: string
}

const DEFAULT_LABELS: Required<PaginationLabels> = {
  root: 'Pagination',
  previous: 'Go to previous page',
  next: 'Go to next page',
  page: (page) => `Go to page ${page}`,
}

function Pagination({
  page,
  pageCount,
  onPageChange,
  siblingCount = 1,
  labels,
  className,
}: PaginationProps) {
  // A single page (or none) needs no controls.
  if (pageCount <= 1) return null

  const text = { ...DEFAULT_LABELS, ...labels }
  const items = buildPaginationRange(page, pageCount, siblingCount)
  const go = (target: number): void => {
    const clamped = Math.min(Math.max(target, 1), pageCount)
    if (clamped !== page) onPageChange(clamped)
  }

  return (
    <nav
      data-slot="pagination"
      role="navigation"
      aria-label={text.root}
      className={cn('flex items-center justify-center gap-1', className)}
    >
      <button
        type="button"
        data-slot="pagination-previous"
        aria-label={text.previous}
        disabled={page <= 1}
        onClick={() => go(page - 1)}
        className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
      >
        <ChevronLeft />
      </button>

      {items.map((item) =>
        item === 'ellipsis-left' || item === 'ellipsis-right' ? (
          <span
            key={item}
            data-slot="pagination-ellipsis"
            aria-hidden
            className="text-muted-foreground flex size-7 items-center justify-center"
          >
            <MoreHorizontal className="size-4" />
          </span>
        ) : (
          <button
            key={item}
            type="button"
            data-slot="pagination-page"
            aria-label={text.page(item)}
            aria-current={item === page ? 'page' : undefined}
            onClick={() => go(item)}
            className={cn(
              buttonVariants({
                variant: item === page ? 'outline' : 'ghost',
                size: 'icon-sm',
              }),
              'tabular-nums',
            )}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        data-slot="pagination-next"
        aria-label={text.next}
        disabled={page >= pageCount}
        onClick={() => go(page + 1)}
        className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
      >
        <ChevronRight />
      </button>
    </nav>
  )
}

export { Pagination, type PaginationProps }
