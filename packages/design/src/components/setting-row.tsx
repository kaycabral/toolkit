import * as React from 'react'

import { cn } from '../lib/cn'

// A single settings row: a label (title + optional description) on the left and
// its control on the right — the account-settings pattern (label-left,
// control-right) used across the Configurações surfaces. Rows stack inside a
// SettingRowGroup, which draws the dividing lines between them.
//
// Pass the control as children. When `htmlFor` is given, the title renders as a
// <label> bound to that control (so clicking the title focuses the input); the
// caller gives the control a matching `id`.
function SettingRow({
  title,
  description,
  htmlFor,
  className,
  children,
  ...props
}: {
  title: React.ReactNode
  description?: React.ReactNode
  htmlFor?: string
} & Omit<React.ComponentProps<'div'>, 'title'>) {
  return (
    <div
      data-slot="setting-row"
      className={cn('flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:gap-4', className)}
      {...props}
    >
      <div className="min-w-0 flex-1">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="text-sm font-medium">
            {title}
          </label>
        ) : (
          <div className="text-sm font-medium">{title}</div>
        )}
        {description ? <p className="text-muted-foreground mt-0.5 text-xs">{description}</p> : null}
      </div>
      <div className="sm:shrink-0">{children}</div>
    </div>
  )
}

// Stacks SettingRows with a divider between each — a titled block of settings.
// The first row has no top border (the group edge already bounds it).
function SettingRowGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="setting-row-group"
      className={cn('flex flex-col [&>[data-slot=setting-row]+*]:border-t', className)}
      {...props}
    />
  )
}

export { SettingRow, SettingRowGroup }
