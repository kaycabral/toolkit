import * as React from 'react'

import { cn } from '../lib/cn'
import { Button } from './button'

type EmptyStateAction = {
  label: string
} & ({ href: string; onClick?: never } | { onClick: () => void; href?: never })

type EmptyStateProps = React.ComponentProps<'div'> & {
  /** Short, value-oriented headline — e.g. "Nenhuma unidade cadastrada". */
  title: string
  /** Optional supporting copy that frames the value of creating the first item. */
  description?: string
  /** Optional leading icon (typically a `lucide-react` glyph). */
  icon?: React.ReactNode
  /**
   * Primary call-to-action. Either a link (`href`) or a click handler
   * (`onClick`) — never both. Rendered as a `Button`; when `href` is set the
   * caller can wrap with their router's `<Link asChild>` via `actionAsChild`.
   */
  action?: EmptyStateAction
  /**
   * When the action uses `href`, render the Button `asChild` so the consumer
   * can pass a framework `<Link>` as the single child instead of the label.
   * Defaults to false (plain anchor via `<a href>`).
   */
  actionSlot?: React.ReactNode
}

/**
 * Actionable empty state for list/CRUD surfaces: a value-oriented headline,
 * optional supporting copy + icon, and a primary CTA that opens the real
 * creation flow. Shared so every area renders the same affordance instead of a
 * bare "Nenhum X cadastrado" line.
 */
function renderAction(
  action: EmptyStateAction | undefined,
  actionSlot: React.ReactNode | undefined,
): React.ReactNode {
  if (actionSlot) {
    return (
      <Button asChild className="mt-1">
        {actionSlot}
      </Button>
    )
  }
  if (!action) return null
  if (action.href) {
    return (
      <Button asChild className="mt-1">
        <a href={action.href}>{action.label}</a>
      </Button>
    )
  }
  return (
    <Button type="button" onClick={action.onClick} className="mt-1">
      {action.label}
    </Button>
  )
}

function EmptyState({
  title,
  description,
  icon,
  action,
  actionSlot,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        // `w-full` so it always fills its container (max width available) and
        // never shrinks to content width inside a flex `items-center` parent —
        // every empty state renders at the same width across the app.
        'border-border bg-muted/20 flex w-full flex-col items-center gap-3 rounded-md border p-12 text-center',
        className,
      )}
      {...props}
    >
      {icon ? (
        <div data-slot="empty-state-icon" className="text-muted-foreground [&_svg]:size-8">
          {icon}
        </div>
      ) : null}
      <div className="flex flex-col gap-1">
        <p data-slot="empty-state-title" className="text-foreground text-sm font-medium">
          {title}
        </p>
        {description ? (
          <p data-slot="empty-state-description" className="text-muted-foreground text-sm">
            {description}
          </p>
        ) : null}
      </div>
      {renderAction(action, actionSlot)}
    </div>
  )
}

export { EmptyState, type EmptyStateProps }
