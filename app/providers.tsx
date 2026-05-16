'use client'

import { ThemeProvider } from 'next-themes'
import { NavigationProgress } from '@/components/ui/NavigationProgress'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <NavigationProgress />
      {children}
    </ThemeProvider>
  )
}
