import type { ToasterProps } from 'sonner'

export function toasterTheme(theme: string): ToasterProps['theme'] {
  return theme === 'light' || theme === 'dark' ? theme : 'system'
}
