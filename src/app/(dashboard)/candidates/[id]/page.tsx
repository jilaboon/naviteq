'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Trash2, FileText, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/layout/page-header'
import { CandidateDialog } from '@/components/forms/candidate-dialog'
import { InterviewNoteDialog } from '@/components/forms/interview-note-dialog'
import { ActivityList } from '@/components/activity-list'
import { formatDate, formatDateTime } from '@/lib/utils'
import {
  seniorityLabels,
  candidateStageLabels,
  candidateStageColors,
  projectStatusLabels,
} from '@/types'

interface InterviewNote {
  interviewerName: string
  date: string
  notes: string
  score?: number
}

interface Candidate {
  id: string
  fullName: string
  email: string | null
  phone: string | null
  location: string | null
  title: string | null
  summaryPublic: string | null
  summaryInternal: string | null
  technologies: string[]
  yearsExperience: number | null
  seniorityLevel: string | null
  languages: string[]
  availability: string | null
  salaryExpectation: string | null
  resumeFileUrl: string | null
  resumeOriginalName: string | null
  resumeExtractedText: string | null
  interviewNotes: InterviewNote[]
  tags: string[]
  projectCandidates: Array<{
    id: string
    stage: string
    matchScore: number | null
    project: { id: string; title: string; status: string }
  }>
  createdAt: string
  updatedAt: string
}

export default function CandidateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)

  const fetchCandidate = async () => {
    try {
      const res = await fetch(`/api/candidates/${params.id}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setCandidate(data.data)
    } catch (error) {
      console.error('Error fetching candidate:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCandidate()
  }, [params.id])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this candidate?')) return
    try {
      const res = await fetch(`/api/candidates/${params.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        router.push('/candidates')
      }
    } catch (error) {
      console.error('Error deleting candidate:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">Loading...</div>
    )
  }

  if (!candidate) {
    return (
      <div className="flex items-center justify-center py-12">
        Candidate not found
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/candidates"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Candidates
        </Link>
      </div>

      <PageHeader
        title={candidate.fullName}
        description={candidate.title || undefined}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="resume">Resume</TabsTrigger>
          <TabsTrigger value="interviews">
            Interview Notes ({candidate.interviewNotes?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="projects">
            Projects ({candidate.projectCandidates?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {candidate.email && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">
                        Email
                      </div>
                      <a
                        href={`mailto:${candidate.email}`}
                        className="text-sm text-blue-600"
                      >
                        {candidate.email}
                      </a>
                    </div>
                  )}
                  {candidate.phone && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">
                        Phone
                      </div>
                      <div className="text-sm">{candidate.phone}</div>
                    </div>
                  )}
                  {candidate.location && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">
                        Location
                      </div>
                      <div className="text-sm">{candidate.location}</div>
                    </div>
                  )}
                  {candidate.seniorityLevel && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">
                        Seniority
                      </div>
                      <div className="text-sm">
                        {
                          seniorityLabels[
                            candidate.seniorityLevel as keyof typeof seniorityLabels
                          ]
                        }
                      </div>
                    </div>
                  )}
                  {candidate.yearsExperience != null && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">
                        Experience
                      </div>
                      <div className="text-sm">
                        {candidate.yearsExperience} years
                      </div>
                    </div>
                  )}
                  {candidate.availability && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">
                        Availability
                      </div>
                      <div className="text-sm">{candidate.availability}</div>
                    </div>
                  )}
                </div>

                {candidate.technologies.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-500">
                      Technologies
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {candidate.technologies.map((tech) => (
                        <Badge key={tech} variant="secondary">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {candidate.languages.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-500">
                      Languages
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {candidate.languages.map((lang) => (
                        <Badge key={lang} variant="outline">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {candidate.tags.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-500">
                      Tags
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {candidate.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              {candidate.summaryPublic && (
                <Card>
                  <CardHeader>
                    <CardTitle>Public Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm">
                      {candidate.summaryPublic}
                    </p>
                  </CardContent>
                </Card>
              )}

              {candidate.summaryInternal && (
                <Card>
                  <CardHeader>
                    <CardTitle>Internal Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm">
                      {candidate.summaryInternal}
                    </p>
                  </CardContent>
                </Card>
              )}

              {candidate.salaryExpectation && (
                <Card>
                  <CardHeader>
                    <CardTitle>Salary Expectation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{candidate.salaryExpectation}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="resume" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resume
              </CardTitle>
            </CardHeader>
            <CardContent>
              {candidate.resumeFileUrl ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500">
                      File
                    </div>
                    <div className="text-sm">
                      {candidate.resumeOriginalName || 'Resume file'}
                    </div>
                  </div>
                  {candidate.resumeExtractedText && (
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-2">
                        Extracted Content
                      </div>
                      <div className="max-h-96 overflow-y-auto rounded-lg bg-gray-50 p-4 text-sm whitespace-pre-wrap">
                        {candidate.resumeExtractedText}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No resume uploaded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interviews" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Interview Notes</CardTitle>
              <Button size="sm" onClick={() => setNoteDialogOpen(true)}>
                <Plus className="mr-1 h-4 w-4" />
                Add Note
              </Button>
            </CardHeader>
            <CardContent>
              {!candidate.interviewNotes ||
              candidate.interviewNotes.length === 0 ? (
                <p className="text-gray-500">No interview notes yet</p>
              ) : (
                <div className="space-y-4">
                  {candidate.interviewNotes.map((note, idx) => (
                    <div key={idx} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{note.interviewerName}</div>
                        <div className="flex items-center gap-2">
                          {note.score && (
                            <Badge variant="outline">
                              Score: {note.score}/5
                            </Badge>
                          )}
                          <span className="text-sm text-gray-500">
                            {formatDate(note.date)}
                          </span>
                        </div>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm">
                        {note.notes}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {!candidate.projectCandidates ||
              candidate.projectCandidates.length === 0 ? (
                <p className="text-gray-500">
                  Not submitted to any projects yet
                </p>
              ) : (
                <div className="space-y-3">
                  {candidate.projectCandidates.map((pc) => (
                    <Link
                      key={pc.id}
                      href={`/projects/${pc.project.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                    >
                      <div>
                        <div className="font-medium">{pc.project.title}</div>
                        <div className="text-sm text-gray-500">
                          {
                            projectStatusLabels[
                              pc.project.status as keyof typeof projectStatusLabels
                            ]
                          }
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {pc.matchScore != null && (
                          <Badge variant="outline">
                            {pc.matchScore}% match
                          </Badge>
                        )}
                        <Badge
                          className={
                            candidateStageColors[
                              pc.stage as keyof typeof candidateStageColors
                            ]
                          }
                        >
                          {
                            candidateStageLabels[
                              pc.stage as keyof typeof candidateStageLabels
                            ]
                          }
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityList entityType="Candidate" entityId={candidate.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CandidateDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        candidate={candidate}
        onSuccess={() => {
          setEditDialogOpen(false)
          fetchCandidate()
        }}
      />

      <InterviewNoteDialog
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
        candidateId={candidate.id}
        existingNotes={candidate.interviewNotes || []}
        onSuccess={() => {
          setNoteDialogOpen(false)
          fetchCandidate()
        }}
      />
    </div>
  )
}
