'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Search, LogOut, User, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getInitials } from '@/lib/utils'
import { roleDisplayNames } from '@/lib/permissions'
import { useCommandPalette, CommandPalette } from '@/components/command-palette'
import { NotificationBell } from '@/components/notifications'

export function Header() {
  const { data: session } = useSession()
  const router = useRouter()
  const { open } = useCommandPalette()

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b bg-white px-6">
        <button
          onClick={open}
          className="flex h-10 flex-1 max-w-md items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search customers, projects, candidates...</span>
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>

      <div className="flex items-center gap-2">
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-indigo-600 text-white text-xs">
                  {session?.user?.fullName
                    ? getInitials(session.user.fullName)
                    : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <div className="text-sm font-medium">
                  {session?.user?.fullName || 'User'}
                </div>
                <div className="text-xs text-gray-500">
                  {session?.user?.role
                    ? roleDisplayNames[session.user.role]
                    : ''}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </header>
      <CommandPalette />
    </>
  )
}
