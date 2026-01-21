'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Trash2, UserPlus, MessageSquare, ArrowRight, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/layout/page-header'
import { ProjectDialog } from '@/components/forms/project-dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MatchingPanel } from '@/components/matching-panel'
import { CandidatePipeline } from '@/components/candidate-pipeline'
import { ActivityList } from '@/components/activity-list'
import { ProjectUpdatesTimeline } from '@/components/project-updates'
import { formatDate } from '@/lib/utils'
import {
  projectStatusLabels,
  projectStatusColors,
  priorityLabels,
  seniorityLabels,
  remotePolicyLabels,
  projectCategoryLabels,
  projectCategoryColors,
  devOpsStatusLabels,
  devOpsStatusColors,
  ProjectStatus,
  ProjectCategory,
  DevOpsStatus,
} from '@/types'

interface Project {
  id: string
  title: string
  description: string | null
  status: ProjectStatus
  projectCategory: ProjectCategory
  devOpsStatus: DevOpsStatus | null
  priority: string
  technologies: string[]
  mustHave: string[]
  niceToHave: string[]
  seniorityLevel: string | null
  yearsExperienceMin: number | null
  location: string | null
  remotePolicy: string | null
  languageRequirements: string[]
  headcount: number | null
  customer: { id: string; name: string; industry: string | null }
  assignedUsers: Array<{ user: { id: string; fullName: string; role: string } }>
  projectCandidates: Array<{
    id: string
    stage: string
    matchScore: number | null
    candidate: {
      id: string
      fullName: string
      title: string | null
      technologies: string[]
      yearsExperience: number | null
      seniorityLevel: string | null
    }
  }>
  createdAt: string
  updatedAt: string
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [convertDialogOpen, setConvertDialogOpen] = useState(false)
  const [converting, setConverting] = useState(false)

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${params.id}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setProject(data.data)
    } catch (error) {
      console.error('Error fetching project:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProject()
  }, [params.id])

  const handleStatusChange = async (newStatus: string) => {
    if (!project) return
    try {
      const updateData =
        project.projectCategory === 'DEVOPS'
          ? { ...project, devOpsStatus: newStatus }
          : { ...project, status: newStatus }

      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })
      if (res.ok) {
        fetchProject()
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project?')) return
    try {
      const res = await fetch(`/api/projects/${params.id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/projects')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
    }
  }

  const handleConvertToDevOps = async () => {
    setConverting(true)
    try {
      const res = await fetch(`/api/projects/${params.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ createNew: true }),
      })
      if (res.ok) {
        const data = await res.json()
        setConvertDialogOpen(false)
        // Navigate to the new DevOps project
        router.push(`/projects/${data.data.id}`)
      } else {
        const errorData = await res.json()
        alert(errorData.error || 'Failed to convert project')
      }
    } catch (error) {
      console.error('Error converting project:', error)
      alert('Failed to convert project')
    } finally {
      setConverting(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12">Loading...</div>
  }

  if (!project) {
    return <div className="flex items-center justify-center py-12">Project not found</div>
  }

  return (
    <div>
      <div className="mb-4">
        <Link
          href={`/projects/${project.projectCategory.toLowerCase()}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to {projectCategoryLabels[project.projectCategory]} Projects
        </Link>
      </div>

      <PageHeader
        title={project.title}
        description={project.customer.name}
        actions={
          <div className="flex items-center gap-2">
            {project.projectCategory === 'DEVOPS' ? (
              <Select
                value={project.devOpsStatus || 'ACTIVE'}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="AT_RISK">At Risk</SelectItem>
                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Select value={project.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INITIAL">Initial</SelectItem>
                  <SelectItem value="SOURCING">Sourcing</SelectItem>
                  <SelectItem value="INTERVIEWS">Interviews</SelectItem>
                  <SelectItem value="CLOSED_WON">Closed Won</SelectItem>
                  <SelectItem value="CLOSED_LOST">Closed Lost</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            {project.projectCategory === 'PIPELINE' && project.status !== 'CLOSED_LOST' && (
              <Button
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50"
                onClick={() => setConvertDialogOpen(true)}
              >
                <Rocket className="mr-2 h-4 w-4" />
                Convert to DevOps
              </Button>
            )}
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <Badge variant="outline" className="font-medium">
          {projectCategoryLabels[project.projectCategory]}
        </Badge>
        {project.projectCategory === 'PIPELINE' ? (
          <Badge className={projectStatusColors[project.status]}>
            {projectStatusLabels[project.status]}
          </Badge>
        ) : (
          project.devOpsStatus && (
            <Badge className={devOpsStatusColors[project.devOpsStatus]}>
              {devOpsStatusLabels[project.devOpsStatus]}
            </Badge>
          )
        )}
        <Badge className={priorityLabels[project.priority as keyof typeof priorityLabels] ? 'bg-gray-100' : ''}>
          {priorityLabels[project.priority as keyof typeof priorityLabels] || project.priority}
        </Badge>
        {project.headcount && (
          <Badge variant="outline">Headcount: {project.headcount}</Badge>
        )}
      </div>

      <Tabs defaultValue={project.projectCategory === 'DEVOPS' ? 'updates' : 'overview'}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="updates">
            <MessageSquare className="mr-1 h-4 w-4" />
            Updates
          </TabsTrigger>
          {project.projectCategory === 'PIPELINE' && (
            <>
              <TabsTrigger value="candidates">
                Candidates ({project.projectCandidates.length})
              </TabsTrigger>
              <TabsTrigger value="matching">
                <UserPlus className="mr-1 h-4 w-4" />
                Find Matches
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.technologies.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-500">Technologies</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {project.technologies.map((tech) => (
                        <Badge key={tech} variant="secondary">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {project.mustHave.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-500">Must Have</div>
                    <ul className="mt-1 list-inside list-disc text-sm">
                      {project.mustHave.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {project.niceToHave.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-500">Nice to Have</div>
                    <ul className="mt-1 list-inside list-disc text-sm text-gray-600">
                      {project.niceToHave.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {project.seniorityLevel && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">Seniority</div>
                      <div className="text-sm">
                        {seniorityLabels[project.seniorityLevel as keyof typeof seniorityLabels]}
                      </div>
                    </div>
                  )}
                  {project.yearsExperienceMin != null && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">Min Experience</div>
                      <div className="text-sm">{project.yearsExperienceMin}+ years</div>
                    </div>
                  )}
                  {project.location && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">Location</div>
                      <div className="text-sm">{project.location}</div>
                    </div>
                  )}
                  {project.remotePolicy && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">Remote Policy</div>
                      <div className="text-sm">
                        {remotePolicyLabels[project.remotePolicy as keyof typeof remotePolicyLabels]}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {project.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm">{project.description}</p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Team</CardTitle>
                </CardHeader>
                <CardContent>
                  {project.assignedUsers.length === 0 ? (
                    <p className="text-gray-500">No team members assigned</p>
                  ) : (
                    <div className="space-y-2">
                      {project.assignedUsers.map(({ user }) => (
                        <div key={user.id} className="flex items-center justify-between">
                          <span className="text-sm">{user.fullName}</span>
                          <Badge variant="outline" className="text-xs">
                            {user.role.replace('_', ' ')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-500">Created</div>
                    <div>{formatDate(project.createdAt)}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-500">Updated</div>
                    <div>{formatDate(project.updatedAt)}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="updates" className="mt-4">
          <ProjectUpdatesTimeline projectId={project.id} />
        </TabsContent>

        {project.projectCategory === 'PIPELINE' && (
          <>
            <TabsContent value="candidates" className="mt-4">
              <CandidatePipeline
                projectId={project.id}
                candidates={project.projectCandidates}
                onRefresh={fetchProject}
              />
            </TabsContent>

            <TabsContent value="matching" className="mt-4">
              <MatchingPanel projectId={project.id} onAddTalent={fetchProject} />
            </TabsContent>
          </>
        )}

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityList entityType="Project" entityId={project.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ProjectDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        project={project}
        onSuccess={() => {
          setEditDialogOpen(false)
          fetchProject()
        }}
      />

      <AlertDialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert to DevOps Project</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new DevOps project from this Pipeline project. The current
              project will be marked as &quot;Closed Won&quot; and a new DevOps project will be created
              with the same customer and team. Any hired candidates who have been converted
              to engineers will be automatically assigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={converting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConvertToDevOps}
              disabled={converting}
              className="bg-green-600 hover:bg-green-700"
            >
              {converting ? 'Converting...' : 'Convert to DevOps'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
