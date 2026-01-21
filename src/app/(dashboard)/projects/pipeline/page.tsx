'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search, GitBranch } from 'lucide-react'
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
  projectStatusLabels,
  projectStatusColors,
  priorityLabels,
  priorityColors,
  ProjectStatus,
  ProjectPriority,
} from '@/types'

interface Project {
  id: string
  title: string
  status: ProjectStatus
  priority: ProjectPriority
  customer: { id: string; name: string }
  assignedUsers: Array<{ user: { fullName: string } }>
  _count: { projectCandidates: number; projectTalents: number }
  updatedAt: string
}

export default function PipelineProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchProjects = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      params.set('category', 'PIPELINE')
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      if (priority) params.set('priority', priority)
      const res = await fetch(`/api/projects?${params}`)
      const data = await res.json()
      setProjects(data.data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }, [search, status, priority])

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
        title="Pipeline Projects"
        description="Recruitment and staffing projects - finding the right candidates"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Pipeline Project
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
        <Select value={status || '_all'} onValueChange={(v) => setStatus(v === '_all' ? '' : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Statuses</SelectItem>
            <SelectItem value="INITIAL">Initial</SelectItem>
            <SelectItem value="SOURCING">Sourcing</SelectItem>
            <SelectItem value="INTERVIEWS">Interviews</SelectItem>
            <SelectItem value="CLOSED_WON">Closed Won</SelectItem>
            <SelectItem value="CLOSED_LOST">Closed Lost</SelectItem>
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
              <TableHead>Assigned</TableHead>
              <TableHead>Candidates</TableHead>
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
                  <GitBranch className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2 text-gray-500">No pipeline projects found</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create your first pipeline project
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
                    <Badge className={projectStatusColors[project.status]}>
                      {projectStatusLabels[project.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={priorityColors[project.priority]}>
                      {priorityLabels[project.priority]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {project.assignedUsers
                      .slice(0, 2)
                      .map((a) => a.user.fullName)
                      .join(', ')}
                    {project.assignedUsers.length > 2 &&
                      ` +${project.assignedUsers.length - 2}`}
                  </TableCell>
                  <TableCell>
                    {project._count.projectCandidates + project._count.projectTalents}
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
        defaultCategory="PIPELINE"
      />
    </div>
  )
}
