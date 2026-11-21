import type * as React from 'react'

/** Props shared by the brand icons: any `<svg>` prop plus an optional `title`. */
export type BrandIconProps = Omit<React.ComponentProps<'svg'>, 'children'> & {
  /** Accessible name. Without it the icon is decorative (`aria-hidden`). */
  title?: string
}

export function BrandIcon({
  title,
  viewBox,
  children,
  ...props
}: BrandIconProps & { viewBox: string; children: React.ReactNode }) {
  const a11y = title ? { role: 'img' } : { 'aria-hidden': true }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      focusable="false"
      {...a11y}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  )
}
