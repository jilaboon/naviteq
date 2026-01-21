'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Building2, FolderKanban, Users, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'

interface DashboardStats {
  customers: number
  projects: number
  candidates: number
  activeProjects: number
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats>({
    customers: 0,
    projects: 0,
    candidates: 0,
    activeProjects: 0,
  })
  const [recentProjects, setRecentProjects] = useState<Array<{
    id: string
    title: string
    status: string
    customer: { name: string }
  }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [customersRes, projectsRes, candidatesRes] = await Promise.all([
          fetch('/api/customers?pageSize=1'),
          fetch('/api/projects?pageSize=5'),
          fetch('/api/candidates?pageSize=1'),
        ])

        const [customersData, projectsData, candidatesData] = await Promise.all([
          customersRes.json(),
          projectsRes.json(),
          candidatesRes.json(),
        ])

        setStats({
          customers: customersData.total || 0,
          projects: projectsData.total || 0,
          candidates: candidatesData.total || 0,
          activeProjects: (projectsData.data || []).filter(
            (p: { status: string }) => !['CLOSED_WON', 'CLOSED_LOST'].includes(p.status)
          ).length,
        })

        setRecentProjects(projectsData.data || [])
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const statCards = [
    {
      title: 'Total Customers',
      value: stats.customers,
      icon: Building2,
      href: '/customers',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Projects',
      value: stats.projects,
      icon: FolderKanban,
      href: '/projects',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Candidates',
      value: stats.candidates,
      icon: Users,
      href: '/candidates',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Active Projects',
      value: stats.activeProjects,
      icon: TrendingUp,
      href: '/projects?status=active',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${session?.user?.fullName || 'User'}`}
        description="Here's what's happening in your workspace"
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading dashboard...</div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <Link key={stat.title} href={stat.href}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      {stat.title}
                    </CardTitle>
                    <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Recent Projects</CardTitle>
              </CardHeader>
              <CardContent>
                {recentProjects.length === 0 ? (
                  <p className="text-gray-500">No projects yet</p>
                ) : (
                  <div className="space-y-4">
                    {recentProjects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
                      >
                        <div>
                          <div className="font-medium">{project.title}</div>
                          <div className="text-sm text-gray-500">
                            {project.customer.name}
                          </div>
                        </div>
                        <div className="text-sm">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              project.status === 'CLOSED_WON'
                                ? 'bg-green-100 text-green-800'
                                : project.status === 'CLOSED_LOST'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {project.status.replace('_', ' ')}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
