'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search, Users } from 'lucide-react'
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
import { CandidateDialog } from '@/components/forms/candidate-dialog'
import { formatDate } from '@/lib/utils'
import { seniorityLabels } from '@/types'

interface Candidate {
  id: string
  fullName: string
  title: string | null
  location: string | null
  technologies: string[]
  yearsExperience: number | null
  seniorityLevel: string | null
  tags: string[]
  _count: { projectCandidates: number }
  updatedAt: string
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [seniorityFilter, setSeniorityFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchCandidates = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (seniorityFilter) params.set('seniorityLevel', seniorityFilter)
      const res = await fetch(`/api/candidates?${params}`)
      const data = await res.json()
      setCandidates(data.data || [])
    } catch (error) {
      console.error('Error fetching candidates:', error)
    } finally {
      setLoading(false)
    }
  }, [search, seniorityFilter])

  useEffect(() => {
    const debounce = setTimeout(fetchCandidates, 300)
    return () => clearTimeout(debounce)
  }, [fetchCandidates])

  const handleCreated = () => {
    setDialogOpen(false)
    fetchCandidates()
  }

  return (
    <div>
      <PageHeader
        title="Candidates"
        description="Manage your talent pool"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Candidate
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search candidates..."
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
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Seniority</TableHead>
              <TableHead>Experience</TableHead>
              <TableHead>Technologies</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Projects</TableHead>
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
            ) : candidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2 text-gray-500">No candidates found</p>
                </TableCell>
              </TableRow>
            ) : (
              candidates.map((candidate) => (
                <TableRow key={candidate.id}>
                  <TableCell>
                    <Link
                      href={`/candidates/${candidate.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {candidate.fullName}
                    </Link>
                  </TableCell>
                  <TableCell>{candidate.title || '-'}</TableCell>
                  <TableCell>
                    {candidate.seniorityLevel
                      ? seniorityLabels[
                          candidate.seniorityLevel as keyof typeof seniorityLabels
                        ]
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {candidate.yearsExperience != null
                      ? `${candidate.yearsExperience} years`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {candidate.technologies.slice(0, 3).map((tech) => (
                        <Badge key={tech} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                      {candidate.technologies.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{candidate.technologies.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{candidate.location || '-'}</TableCell>
                  <TableCell>{candidate._count.projectCandidates}</TableCell>
                  <TableCell>{formatDate(candidate.updatedAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CandidateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleCreated}
      />
    </div>
  )
}
