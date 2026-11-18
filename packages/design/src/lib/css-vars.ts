import type { CSSProperties } from 'react'

type CSSCustomProperties = Record<`--${string}`, string>

export function cssVars(vars: CSSCustomProperties): CSSProperties {
  return vars
}
