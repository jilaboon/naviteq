'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import { CommandPaletteProvider } from '@/components/command-palette/command-palette-context'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <CommandPaletteProvider>{children}</CommandPaletteProvider>
    </SessionProvider>
  )
}
