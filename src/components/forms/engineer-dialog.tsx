'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { engineerSchema, EngineerInput } from '@/lib/validations'

interface EngineerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  engineer?: {
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
  }
  onSuccess: () => void
}

export function EngineerDialog({
  open,
  onOpenChange,
  engineer,
  onSuccess,
}: EngineerDialogProps) {
  const [loading, setLoading] = useState(false)
  const [technologies, setTechnologies] = useState('')
  const [managers, setManagers] = useState<Array<{ id: string; fullName: string }>>([])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EngineerInput>({
    resolver: zodResolver(engineerSchema),
  })

  useEffect(() => {
    // Fetch potential managers (other engineers)
    fetch('/api/engineers?pageSize=100')
      .then((res) => res.json())
      .then((data) => {
        setManagers(
          (data.data || [])
            .filter((e: { id: string }) => e.id !== engineer?.id)
            .map((e: { id: string; fullName: string }) => ({
              id: e.id,
              fullName: e.fullName,
            }))
        )
      })
      .catch(console.error)
  }, [engineer?.id])

  useEffect(() => {
    if (engineer) {
      setValue('fullName', engineer.fullName)
      setValue('email', engineer.email || '')
      setValue('phone', engineer.phone || '')
      setValue('location', engineer.location || '')
      setValue('title', engineer.title || '')
      setValue('yearsExperience', engineer.yearsExperience)
      setValue('seniorityLevel', engineer.seniorityLevel as EngineerInput['seniorityLevel'])
      setValue('employmentStatus', engineer.employmentStatus as EngineerInput['employmentStatus'])
      setValue(
        'employmentStartDate',
        engineer.employmentStartDate
          ? new Date(engineer.employmentStartDate).toISOString().split('T')[0]
          : ''
      )
      setValue('managerEngineerId', engineer.managerEngineerId)
      setTechnologies(engineer.technologies.join(', '))
    } else {
      reset()
      setTechnologies('')
    }
  }, [engineer, setValue, reset])

  const onSubmit = async (data: EngineerInput) => {
    setLoading(true)
    try {
      const payload = {
        ...data,
        technologies: technologies.split(',').map((t) => t.trim()).filter(Boolean),
      }

      const url = engineer ? `/api/engineers/${engineer.id}` : '/api/engineers'
      const method = engineer ? 'PUT' : 'POST'

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
        alert(errorData.error || 'Failed to save engineer')
      }
    } catch (error) {
      console.error('Error saving engineer:', error)
      alert('Failed to save engineer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {engineer ? 'Edit Engineer' : 'Add Engineer'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                {...register('fullName')}
                placeholder="John Doe"
              />
              {errors.fullName && (
                <p className="text-sm text-red-500">{errors.fullName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Senior Software Engineer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="john@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="+972-50-123-4567"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                {...register('location')}
                placeholder="Tel Aviv, Israel"
              />
            </div>
            <div className="space-y-2">
              <Label>Seniority Level</Label>
              <Select
                onValueChange={(value) =>
                  setValue('seniorityLevel', value as EngineerInput['seniorityLevel'])
                }
                defaultValue={engineer?.seniorityLevel || ''}
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="yearsExperience">Years of Experience</Label>
              <Input
                id="yearsExperience"
                type="number"
                min={0}
                {...register('yearsExperience', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>Employment Status</Label>
              <Select
                onValueChange={(value) =>
                  setValue('employmentStatus', value as EngineerInput['employmentStatus'])
                }
                defaultValue={engineer?.employmentStatus || 'ACTIVE'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="BENCH">Bench</SelectItem>
                  <SelectItem value="ASSIGNED">Assigned</SelectItem>
                  <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employmentStartDate">Employment Start Date</Label>
              <Input
                id="employmentStartDate"
                type="date"
                {...register('employmentStartDate')}
              />
            </div>
            <div className="space-y-2">
              <Label>Manager</Label>
              <Select
                onValueChange={(value) =>
                  setValue('managerEngineerId', value === '_none' ? null : value)
                }
                defaultValue={engineer?.managerEngineerId || '_none'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">No Manager</SelectItem>
                  {managers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="technologies">Technologies (comma-separated)</Label>
            <Input
              id="technologies"
              value={technologies}
              onChange={(e) => setTechnologies(e.target.value)}
              placeholder="React, Node.js, TypeScript, PostgreSQL"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : engineer ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
