'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search, Server } from 'lucide-react'
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
  devOpsStatusLabels,
  devOpsStatusColors,
  priorityLabels,
  priorityColors,
  DevOpsStatus,
  ProjectPriority,
} from '@/types'

interface Project {
  id: string
  title: string
  devOpsStatus: DevOpsStatus | null
  priority: ProjectPriority
  customer: { id: string; name: string }
  assignedUsers: Array<{ user: { fullName: string } }>
  engineerAssignments: Array<{ engineer: { fullName: string } }>
  _count: { updates: number; engineerAssignments: number }
  updatedAt: string
}

export default function DevOpsProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [devOpsStatus, setDevOpsStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchProjects = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      params.set('category', 'DEVOPS')
      if (search) params.set('search', search)
      if (devOpsStatus) params.set('devOpsStatus', devOpsStatus)
      if (priority) params.set('priority', priority)
      const res = await fetch(`/api/projects?${params}`)
      const data = await res.json()
      setProjects(data.data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }, [search, devOpsStatus, priority])

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
        title="DevOps Projects"
        description="Active delivery projects with assigned engineers"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New DevOps Project
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
        <Select value={devOpsStatus || '_all'} onValueChange={(v) => setDevOpsStatus(v === '_all' ? '' : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="AT_RISK">At Risk</SelectItem>
            <SelectItem value="BLOCKED">Blocked</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
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
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Engineers</TableHead>
              <TableHead>Updates</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Server className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2 text-gray-500">No DevOps projects found</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create your first DevOps project
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
                    {project.devOpsStatus && (
                      <Badge className={devOpsStatusColors[project.devOpsStatus]}>
                        {devOpsStatusLabels[project.devOpsStatus]}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={priorityColors[project.priority]}>
                      {priorityLabels[project.priority]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {project.engineerAssignments
                      .slice(0, 2)
                      .map((a) => a.engineer.fullName)
                      .join(', ')}
                    {project.engineerAssignments.length > 2 &&
                      ` +${project.engineerAssignments.length - 2}`}
                    {project.engineerAssignments.length === 0 && (
                      <span className="text-gray-400">No engineers</span>
                    )}
                  </TableCell>
                  <TableCell>{project._count.updates}</TableCell>
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
        defaultCategory="DEVOPS"
      />
    </div>
  )
}
