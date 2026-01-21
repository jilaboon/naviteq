'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Plus,
  Briefcase,
  MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EngineerDialog } from '@/components/forms/engineer-dialog'
import { formatDate } from '@/lib/utils'
import {
  seniorityLabels,
  employmentStatusLabels,
  employmentStatusColors,
  assignmentStatusLabels,
  assignmentStatusColors,
  updateVisibilityLabels,
} from '@/types'

interface Engineer {
  id: string
  fullName: string
  email: string | null
  phone: string | null
  location: string | null
  title: string | null
  technologies: string[]
  yearsExperience: number | null
  seniorityLevel: string | null
  employmentStatus: string
  employmentStartDate: string | null
  managerEngineerId: string | null
  linkedCandidateId: string | null
  manager: { id: string; fullName: string; title: string | null } | null
  directReports: Array<{ id: string; fullName: string; title: string | null }>
  linkedCandidate: { id: string; fullName: string } | null
  assignments: Array<{
    id: string
    roleTitle: string | null
    startDate: string
    endDate: string | null
    status: string
    notes: string | null
    project: { id: string; title: string; status: string } | null
    customer: { id: string; name: string } | null
  }>
  updates: Array<{
    id: string
    content: string
    visibility: string
    createdAt: string
    author: { id: string; fullName: string }
  }>
  projectTalents: Array<{
    id: string
    stage: string
    project: { id: string; title: string; status: string }
  }>
  createdAt: string
  updatedAt: string
}

export default function EngineerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [engineer, setEngineer] = useState<Engineer | null>(null)
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [newUpdate, setNewUpdate] = useState('')
  const [updateVisibility, setUpdateVisibility] = useState<'INTERNAL' | 'MANAGER_ONLY'>('INTERNAL')
  const [submittingUpdate, setSubmittingUpdate] = useState(false)

  const fetchEngineer = async () => {
    try {
      const res = await fetch(`/api/engineers/${params.id}`)
      const data = await res.json()
      if (res.ok) {
        setEngineer(data.data)
      } else {
        alert(data.error || 'Failed to fetch engineer')
      }
    } catch (error) {
      console.error('Error fetching engineer:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEngineer()
  }, [params.id])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this engineer?')) return

    try {
      const res = await fetch(`/api/engineers/${params.id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/engineers')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete engineer')
      }
    } catch (error) {
      console.error('Error deleting engineer:', error)
    }
  }

  const handleAddUpdate = async () => {
    if (!newUpdate.trim()) return

    setSubmittingUpdate(true)
    try {
      const res = await fetch(`/api/engineers/${params.id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newUpdate,
          visibility: updateVisibility,
        }),
      })

      if (res.ok) {
        setNewUpdate('')
        fetchEngineer()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to add update')
      }
    } catch (error) {
      console.error('Error adding update:', error)
    } finally {
      setSubmittingUpdate(false)
    }
  }

  if (loading) {
    return <div className="py-8 text-center">Loading...</div>
  }

  if (!engineer) {
    return <div className="py-8 text-center text-red-500">Engineer not found</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{engineer.fullName}</h1>
            <div className="flex items-center gap-2 text-gray-500">
              {engineer.title && <span>{engineer.title}</span>}
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
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assignments">
            Assignments ({engineer.assignments.length})
          </TabsTrigger>
          <TabsTrigger value="updates">
            Updates ({engineer.updates.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {engineer.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a href={`mailto:${engineer.email}`} className="text-blue-600 hover:underline">
                      {engineer.email}
                    </a>
                  </div>
                )}
                {engineer.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {engineer.phone}
                  </div>
                )}
                {engineer.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {engineer.location}
                  </div>
                )}
                {engineer.employmentStartDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    Started: {formatDate(engineer.employmentStartDate)}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Professional Info */}
            <Card>
              <CardHeader>
                <CardTitle>Professional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Seniority</span>
                  <span>
                    {engineer.seniorityLevel
                      ? seniorityLabels[engineer.seniorityLevel as keyof typeof seniorityLabels]
                      : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Experience</span>
                  <span>
                    {engineer.yearsExperience != null
                      ? `${engineer.yearsExperience} years`
                      : '-'}
                  </span>
                </div>
                {engineer.manager && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Manager</span>
                    <Link
                      href={`/engineers/${engineer.manager.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {engineer.manager.fullName}
                    </Link>
                  </div>
                )}
                {engineer.linkedCandidate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Linked Candidate</span>
                    <Link
                      href={`/candidates/${engineer.linkedCandidate.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      View Profile
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Technologies */}
            <Card>
              <CardHeader>
                <CardTitle>Technologies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {engineer.technologies.length > 0 ? (
                    engineer.technologies.map((tech) => (
                      <Badge key={tech} variant="secondary">
                        {tech}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-400">No technologies listed</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Direct Reports */}
            {engineer.directReports.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Direct Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {engineer.directReports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between">
                        <Link
                          href={`/engineers/${report.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {report.fullName}
                        </Link>
                        <span className="text-sm text-gray-500">{report.title}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Work History</h3>
          </div>

          {engineer.assignments.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <Briefcase className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2">No assignments yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {engineer.assignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {assignment.project?.title || assignment.customer?.name || 'Assignment'}
                          </span>
                          <Badge
                            className={
                              assignmentStatusColors[
                                assignment.status as keyof typeof assignmentStatusColors
                              ]
                            }
                          >
                            {
                              assignmentStatusLabels[
                                assignment.status as keyof typeof assignmentStatusLabels
                              ]
                            }
                          </Badge>
                        </div>
                        {assignment.roleTitle && (
                          <p className="text-sm text-gray-500">{assignment.roleTitle}</p>
                        )}
                        <p className="text-sm text-gray-400">
                          {formatDate(assignment.startDate)} -{' '}
                          {assignment.endDate ? formatDate(assignment.endDate) : 'Present'}
                        </p>
                        {assignment.notes && (
                          <p className="mt-2 text-sm text-gray-600">{assignment.notes}</p>
                        )}
                      </div>
                      {assignment.project && (
                        <Link
                          href={`/projects/${assignment.project.id}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View Project
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Updates Tab */}
        <TabsContent value="updates" className="space-y-4">
          {/* Add Update Form */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <Textarea
                  placeholder="Add an update about this engineer..."
                  value={newUpdate}
                  onChange={(e) => setNewUpdate(e.target.value)}
                  rows={3}
                />
                <div className="flex items-center justify-between">
                  <Select
                    value={updateVisibility}
                    onValueChange={(v) => setUpdateVisibility(v as typeof updateVisibility)}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INTERNAL">Internal</SelectItem>
                      <SelectItem value="MANAGER_ONLY">Manager Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddUpdate} disabled={submittingUpdate || !newUpdate.trim()}>
                    <Plus className="mr-2 h-4 w-4" />
                    {submittingUpdate ? 'Adding...' : 'Add Update'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Updates Timeline */}
          {engineer.updates.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2">No updates yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {engineer.updates.map((update) => (
                <Card key={update.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm whitespace-pre-wrap">{update.content}</p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                          <span>{update.author.fullName}</span>
                          <span>•</span>
                          <span>{formatDate(update.createdAt)}</span>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">
                            {updateVisibilityLabels[update.visibility as keyof typeof updateVisibilityLabels]}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <EngineerDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        engineer={engineer}
        onSuccess={() => {
          setEditDialogOpen(false)
          fetchEngineer()
        }}
      />
    </div>
  )
}
