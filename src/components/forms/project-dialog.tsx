'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { projectSchema, ProjectInput } from '@/lib/validations'
import { ProjectCategory } from '@/types'

interface Customer {
  id: string
  name: string
}

interface User {
  id: string
  fullName: string
}

interface ProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: {
    id: string
    title: string
    description: string | null
    status: string
    projectCategory: ProjectCategory
    devOpsStatus: string | null
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
    customer: { id: string }
    assignedUsers: Array<{ user: { id: string } }>
  }
  onSuccess: () => void
  defaultCategory?: ProjectCategory
}

export function ProjectDialog({
  open,
  onOpenChange,
  project,
  onSuccess,
  defaultCategory = 'PIPELINE',
}: ProjectDialogProps) {
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [technologies, setTechnologies] = useState('')
  const [mustHave, setMustHave] = useState('')
  const [niceToHave, setNiceToHave] = useState('')
  const [languages, setLanguages] = useState('')
  const [projectCategory, setProjectCategory] = useState<ProjectCategory>(defaultCategory)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/customers').then((r) => r.json()),
      fetch('/api/users').then((r) => r.json()),
    ])
      .then(([customersData, usersData]) => {
        setCustomers(customersData.data || [])
        setUsers(usersData.data || [])
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (project) {
      setValue('customerId', project.customer.id)
      setValue('title', project.title)
      setValue('description', project.description || '')
      setValue('projectCategory', project.projectCategory)
      setProjectCategory(project.projectCategory)
      setValue('status', project.status as ProjectInput['status'])
      setValue('devOpsStatus', project.devOpsStatus as ProjectInput['devOpsStatus'])
      setValue('priority', project.priority as ProjectInput['priority'])
      setValue('seniorityLevel', project.seniorityLevel as ProjectInput['seniorityLevel'])
      setValue('yearsExperienceMin', project.yearsExperienceMin)
      setValue('location', project.location || '')
      setValue('remotePolicy', project.remotePolicy as ProjectInput['remotePolicy'])
      setValue('headcount', project.headcount)
      setTechnologies(project.technologies.join(', '))
      setMustHave(project.mustHave.join(', '))
      setNiceToHave(project.niceToHave.join(', '))
      setLanguages(project.languageRequirements.join(', '))
    } else {
      reset()
      setProjectCategory(defaultCategory)
      setTechnologies('')
      setMustHave('')
      setNiceToHave('')
      setLanguages('')
    }
  }, [project, setValue, reset, defaultCategory])

  const onSubmit = async (data: ProjectInput) => {
    setLoading(true)
    try {
      const payload = {
        ...data,
        projectCategory,
        technologies: technologies.split(',').map((t) => t.trim()).filter(Boolean),
        mustHave: mustHave.split(',').map((t) => t.trim()).filter(Boolean),
        niceToHave: niceToHave.split(',').map((t) => t.trim()).filter(Boolean),
        languageRequirements: languages.split(',').map((t) => t.trim()).filter(Boolean),
      }

      const url = project ? `/api/projects/${project.id}` : '/api/projects'
      const method = project ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        onSuccess()
        reset()
      } else {
        const errorData = await res.json()
        alert(errorData.error || 'Failed to save project')
      }
    } catch (error) {
      console.error('Error saving project:', error)
      alert('Failed to save project')
    } finally {
      setLoading(false)
    }
  }

  const getCategoryTitle = () => {
    if (project) return 'Edit Project'
    switch (defaultCategory) {
      case 'PIPELINE':
        return 'New Pipeline Project'
      case 'DEVOPS':
        return 'New DevOps Project'
      case 'DEVELOPERS':
        return 'New Developers Project'
      default:
        return 'Add Project'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getCategoryTitle()}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer *</Label>
              <Select
                onValueChange={(value) => setValue('customerId', value)}
                defaultValue={project?.customer.id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customerId && (
                <p className="text-sm text-red-500">{errors.customerId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" {...register('title')} placeholder="Project title" />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Project description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Project Category *</Label>
              <Select
                value={projectCategory}
                onValueChange={(value: ProjectCategory) => {
                  setProjectCategory(value)
                  setValue('projectCategory', value)
                }}
                disabled={!!project}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIPELINE">Pipeline</SelectItem>
                  <SelectItem value="DEVOPS">DevOps</SelectItem>
                  <SelectItem value="DEVELOPERS">Developers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{projectCategory === 'DEVOPS' ? 'DevOps Status' : 'Status'}</Label>
              {projectCategory === 'DEVOPS' ? (
                <Select
                  onValueChange={(value) => setValue('devOpsStatus', value as ProjectInput['devOpsStatus'])}
                  defaultValue={project?.devOpsStatus || 'ACTIVE'}
                >
                  <SelectTrigger>
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
                <Select
                  onValueChange={(value) => setValue('status', value as ProjectInput['status'])}
                  defaultValue={project?.status || 'INITIAL'}
                >
                  <SelectTrigger>
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
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                onValueChange={(value) => setValue('priority', value as ProjectInput['priority'])}
                defaultValue={project?.priority || 'MEDIUM'}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Show pipeline-specific fields only for PIPELINE category */}
          {projectCategory === 'PIPELINE' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="technologies">Technologies (comma-separated)</Label>
                <Input
                  id="technologies"
                  value={technologies}
                  onChange={(e) => setTechnologies(e.target.value)}
                  placeholder="React, Node.js, TypeScript"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mustHave">Must Have (comma-separated)</Label>
                <Input
                  id="mustHave"
                  value={mustHave}
                  onChange={(e) => setMustHave(e.target.value)}
                  placeholder="5+ years experience, Team lead experience"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="niceToHave">Nice to Have (comma-separated)</Label>
                <Input
                  id="niceToHave"
                  value={niceToHave}
                  onChange={(e) => setNiceToHave(e.target.value)}
                  placeholder="AWS certification, GraphQL"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Seniority Level</Label>
                  <Select
                    onValueChange={(value) => setValue('seniorityLevel', value as ProjectInput['seniorityLevel'])}
                    defaultValue={project?.seniorityLevel || ''}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="JUNIOR">Junior</SelectItem>
                      <SelectItem value="MID">Mid</SelectItem>
                      <SelectItem value="SENIOR">Senior</SelectItem>
                      <SelectItem value="LEAD">Lead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearsExperienceMin">Min Years Experience</Label>
                  <Input
                    id="yearsExperienceMin"
                    type="number"
                    min={0}
                    {...register('yearsExperienceMin', { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" {...register('location')} placeholder="Tel Aviv, Israel" />
                </div>
                <div className="space-y-2">
                  <Label>Remote Policy</Label>
                  <Select
                    onValueChange={(value) => setValue('remotePolicy', value as ProjectInput['remotePolicy'])}
                    defaultValue={project?.remotePolicy || ''}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select policy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONSITE">On-site</SelectItem>
                      <SelectItem value="HYBRID">Hybrid</SelectItem>
                      <SelectItem value="REMOTE">Remote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="headcount">Headcount</Label>
                  <Input
                    id="headcount"
                    type="number"
                    min={1}
                    {...register('headcount', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="languages">Language Requirements (comma-separated)</Label>
                  <Input
                    id="languages"
                    value={languages}
                    onChange={(e) => setLanguages(e.target.value)}
                    placeholder="English, Hebrew"
                  />
                </div>
              </div>
            </>
          )}

          {/* For DevOps/Developers, show minimal fields */}
          {(projectCategory === 'DEVOPS' || projectCategory === 'DEVELOPERS') && (
            <div className="space-y-2">
              <Label htmlFor="technologies">Technologies (comma-separated)</Label>
              <Input
                id="technologies"
                value={technologies}
                onChange={(e) => setTechnologies(e.target.value)}
                placeholder="React, Node.js, TypeScript"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : project ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
