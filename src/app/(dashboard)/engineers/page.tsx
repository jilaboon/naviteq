'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search, Users2 } from 'lucide-react'
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
import { EngineerDialog } from '@/components/forms/engineer-dialog'
import { formatDate } from '@/lib/utils'
import { seniorityLabels, employmentStatusLabels, employmentStatusColors } from '@/types'

interface Engineer {
  id: string
  fullName: string
  title: string | null
  location: string | null
  technologies: string[]
  yearsExperience: number | null
  seniorityLevel: string | null
  employmentStatus: string
  manager: { id: string; fullName: string } | null
  assignments: Array<{
    id: string
    status: string
    project: { id: string; title: string } | null
    customer: { id: string; name: string } | null
  }>
  _count: { assignments: number; projectTalents: number }
  updatedAt: string
}

export default function EngineersPage() {
  const [engineers, setEngineers] = useState<Engineer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [seniorityFilter, setSeniorityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchEngineers = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (seniorityFilter) params.set('seniorityLevel', seniorityFilter)
      if (statusFilter) params.set('employmentStatus', statusFilter)
      const res = await fetch(`/api/engineers?${params}`)
      const data = await res.json()
      setEngineers(data.data || [])
    } catch (error) {
      console.error('Error fetching engineers:', error)
    } finally {
      setLoading(false)
    }
  }, [search, seniorityFilter, statusFilter])

  useEffect(() => {
    const debounce = setTimeout(fetchEngineers, 300)
    return () => clearTimeout(debounce)
  }, [fetchEngineers])

  const handleCreated = () => {
    setDialogOpen(false)
    fetchEngineers()
  }

  const getCurrentAssignment = (engineer: Engineer) => {
    const active = engineer.assignments.find((a) => a.status === 'ACTIVE')
    if (!active) return null
    return active.project?.title || active.customer?.name || 'Unknown'
  }

  return (
    <div>
      <PageHeader
        title="Engineers"
        description="Manage internal employees"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Engineer
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search engineers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={seniorityFilter || '_all'} onValueChange={(v) => setSeniorityFilter(v === '_all' ? '' : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Seniority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Seniority</SelectItem>
            <SelectItem value="JUNIOR">Junior</SelectItem>
            <SelectItem value="MID">Mid</SelectItem>
            <SelectItem value="SENIOR">Senior</SelectItem>
            <SelectItem value="LEAD">Lead</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter || '_all'} onValueChange={(v) => setStatusFilter(v === '_all' ? '' : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="BENCH">Bench</SelectItem>
            <SelectItem value="ASSIGNED">Assigned</SelectItem>
            <SelectItem value="ON_LEAVE">On Leave</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Seniority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Current Assignment</TableHead>
              <TableHead>Technologies</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : engineers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Users2 className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2 text-gray-500">No engineers found</p>
                </TableCell>
              </TableRow>
            ) : (
              engineers.map((engineer) => (
                <TableRow key={engineer.id}>
                  <TableCell>
                    <Link
                      href={`/engineers/${engineer.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {engineer.fullName}
                    </Link>
                  </TableCell>
                  <TableCell>{engineer.title || '-'}</TableCell>
                  <TableCell>
                    {engineer.seniorityLevel
                      ? seniorityLabels[
                          engineer.seniorityLevel as keyof typeof seniorityLabels
                        ]
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        employmentStatusColors[
                          engineer.employmentStatus as keyof typeof employmentStatusColors
                        ]
                      }
                    >
                      {
                        employmentStatusLabels[
                          engineer.employmentStatus as keyof typeof employmentStatusLabels
                        ]
                      }
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getCurrentAssignment(engineer) || (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {engineer.technologies.slice(0, 3).map((tech) => (
                        <Badge key={tech} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                      {engineer.technologies.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{engineer.technologies.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{engineer.location || '-'}</TableCell>
                  <TableCell>{formatDate(engineer.updatedAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EngineerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleCreated}
      />
    </div>
  )
}
