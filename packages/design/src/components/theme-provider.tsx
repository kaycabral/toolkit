'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type * as React from 'react'

/**
 * Client boundary around `next-themes`' provider, so a Server Component root
 * layout can mount it. Props are passed through unchanged.
 *
 * @example
 * ```tsx
 * <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
 *   {children}
 * </ThemeProvider>
 * ```
 */
function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

export { ThemeProvider }
