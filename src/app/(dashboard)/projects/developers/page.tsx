'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search, Code2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/layout/page-header'
import { ProjectDialog } from '@/components/forms/project-dialog'
import { formatDate } from '@/lib/utils'
import {
  priorityLabels,
  priorityColors,
  ProjectPriority,
} from '@/types'

interface Project {
  id: string
  title: string
  priority: ProjectPriority
  description: string | null
  customer: { id: string; name: string }
  assignedUsers: Array<{ user: { fullName: string } }>
  engineerAssignments: Array<{ engineer: { fullName: string } }>
  _count: { engineerAssignments: number }
  updatedAt: string
}

export default function DevelopersProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchProjects = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      params.set('category', 'DEVELOPERS')
      if (search) params.set('search', search)
      if (priority) params.set('priority', priority)
      const res = await fetch(`/api/projects?${params}`)
      const data = await res.json()
      setProjects(data.data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }, [search, priority])

  useEffect(() => {
    const debounce = setTimeout(fetchProjects, 300)
    return () => clearTimeout(debounce)
  }, [fetchProjects])

  const handleCreated = () => {
    setDialogOpen(false)
    fetchProjects()
  }

  return (
    <div>
      <PageHeader
        title="Developers Projects"
        description="Internal developer pools, squads, and future allocation"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Developers Project
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={priority || '_all'} onValueChange={(v) => setPriority(v === '_all' ? '' : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Priorities</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Engineers</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Code2 className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2 text-gray-500">No developers projects found</p>
                  <p className="mt-1 text-sm text-gray-400">
                    Use this for internal developer pools and squad organization
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create your first developers project
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <Link
                      href={`/projects/${project.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {project.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/customers/${project.customer.id}`}
                      className="hover:underline"
                    >
                      {project.customer.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge className={priorityColors[project.priority]}>
                      {priorityLabels[project.priority]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {project.description || '-'}
                  </TableCell>
                  <TableCell>
                    {project._count.engineerAssignments > 0 ? (
                      <Badge variant="outline">
                        {project._count.engineerAssignments} engineer(s)
                      </Badge>
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(project.updatedAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleCreated}
        defaultCategory="DEVELOPERS"
      />
    </div>
  )
}
