'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Building2,
  FolderKanban,
  Users,
  Users2,
  UserCog,
  Settings,
  LayoutDashboard,
  ChevronDown,
  ChevronRight,
  GitBranch,
  Server,
  Code2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { hasPermission } from '@/lib/permissions'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  permission: string | null
}

interface NavGroup {
  name: string
  icon: React.ComponentType<{ className?: string }>
  permission: string | null
  children: NavItem[]
}

type NavigationItem = NavItem | NavGroup

function isNavGroup(item: NavigationItem): item is NavGroup {
  return 'children' in item
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: null },
  { name: 'Customers', href: '/customers', icon: Building2, permission: 'customers:read' as const },
  {
    name: 'Projects',
    icon: FolderKanban,
    permission: 'projects:read' as const,
    children: [
      { name: 'Pipeline', href: '/projects/pipeline', icon: GitBranch, permission: 'projects:read' as const },
      { name: 'DevOps', href: '/projects/devops', icon: Server, permission: 'projects:read' as const },
      { name: 'Developers', href: '/projects/developers', icon: Code2, permission: 'projects:read' as const },
    ],
  },
  { name: 'Candidates', href: '/candidates', icon: Users, permission: 'candidates:read' as const },
  { name: 'Engineers', href: '/engineers', icon: Users2, permission: 'candidates:read' as const },
  { name: 'Users', href: '/users', icon: UserCog, permission: 'users:read' as const },
  { name: 'Settings', href: '/settings', icon: Settings, permission: 'settings:read' as const },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Projects'])

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupName)
        ? prev.filter((name) => name !== groupName)
        : [...prev, groupName]
    )
  }

  const hasItemPermission = (permission: string | null) => {
    if (!permission) return true
    if (!session?.user?.role) return false
    return hasPermission(session.user.role, permission as Parameters<typeof hasPermission>[1])
  }

  const isProjectsPath = pathname.startsWith('/projects')

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      <div className="flex h-16 items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <span className="text-lg font-bold text-white">N</span>
          </div>
          <span className="text-xl font-semibold text-white">Naviteq</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          if (!hasItemPermission(item.permission)) return null

          if (isNavGroup(item)) {
            const isExpanded = expandedGroups.includes(item.name) || isProjectsPath
            const hasActiveChild = item.children.some((child) =>
              pathname.startsWith(child.href)
            )

            return (
              <div key={item.name}>
                <button
                  onClick={() => toggleGroup(item.name)}
                  className={cn(
                    'group flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    hasActiveChild
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <span className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.name}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-gray-700 pl-3">
                    {item.children.map((child) => {
                      if (!hasItemPermission(child.permission)) return null
                      const isActive = pathname.startsWith(child.href)
                      return (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={cn(
                            'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-gray-800 text-white'
                              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                          )}
                        >
                          <child.icon className="h-4 w-4 shrink-0" />
                          {child.name}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-gray-800 p-4">
        <div className="text-xs text-gray-500">
          Naviteq Internal System
          <br />
          Version 1.0.0
        </div>
      </div>
    </div>
  )
}
