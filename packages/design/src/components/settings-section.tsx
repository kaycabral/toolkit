import * as React from 'react'

import { cn } from '../lib/cn'
import { Separator } from './separator'
import { Typography } from './typography'

// A settings section: a titled, described panel whose body is a vertical stack
// of blocks (typically Cards). It gives every settings surface the same header
// hierarchy — page title + muted description + a separator — so the layout is
// identical whether the section renders as a full page (deep link) or inside the
// Configurações dialog. Consumers compose the blocks as children.
//
// `action` renders trailing controls aligned with the title (e.g. a status
// badge). The body gap is a token so blocks breathe consistently across apps.
function SettingsSection({
  title,
  description,
  action,
  className,
  children,
  ...props
}: {
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
} & React.ComponentProps<'div'>) {
  return (
    <div data-slot="settings-section" className={cn('flex flex-col gap-6', className)} {...props}>
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Typography variant="pageTitle">{title}</Typography>
            {description ? <Typography variant="muted">{description}</Typography> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
        <Separator />
      </div>
      <div className="flex flex-col gap-6">{children}</div>
    </div>
  )
}

export { SettingsSection }
