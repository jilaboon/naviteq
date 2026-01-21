'use client'

import { useState } from 'react'
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
import { interviewNoteSchema, InterviewNoteInput } from '@/lib/validations'

interface InterviewNote {
  interviewerName: string
  date: string
  notes: string
  score?: number
}

interface InterviewNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidateId: string
  existingNotes: InterviewNote[]
  onSuccess: () => void
}

export function InterviewNoteDialog({
  open,
  onOpenChange,
  candidateId,
  existingNotes,
  onSuccess,
}: InterviewNoteDialogProps) {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<InterviewNoteInput>({
    resolver: zodResolver(interviewNoteSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  })

  const onSubmit = async (data: InterviewNoteInput) => {
    setLoading(true)
    try {
      // Fetch current candidate to get existing interview notes
      const getRes = await fetch(`/api/candidates/${candidateId}`)
      const candidate = await getRes.json()

      const newNotes = [
        ...(candidate.data.interviewNotes || []),
        {
          interviewerName: data.interviewerName,
          date: data.date,
          notes: data.notes,
          score: data.score,
        },
      ]

      // Update candidate with new interview notes
      const res = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: candidate.data.fullName,
          interviewNotes: newNotes,
        }),
      })

      if (res.ok) {
        onSuccess()
        reset({
          date: new Date().toISOString().split('T')[0],
          interviewerName: '',
          notes: '',
          score: undefined,
        })
      } else {
        const errorData = await res.json()
        alert(errorData.error || 'Failed to add interview note')
      }
    } catch (error) {
      console.error('Error adding interview note:', error)
      alert('Failed to add interview note')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Interview Note</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interviewerName">Interviewer Name *</Label>
              <Input
                id="interviewerName"
                {...register('interviewerName')}
                placeholder="Your name"
              />
              {errors.interviewerName && (
                <p className="text-sm text-red-500">
                  {errors.interviewerName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input id="date" type="date" {...register('date')} />
              {errors.date && (
                <p className="text-sm text-red-500">{errors.date.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Score (1-5)</Label>
            <Select
              onValueChange={(value) => setValue('score', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Poor</SelectItem>
                <SelectItem value="2">2 - Below Average</SelectItem>
                <SelectItem value="3">3 - Average</SelectItem>
                <SelectItem value="4">4 - Good</SelectItem>
                <SelectItem value="5">5 - Excellent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes *</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Interview feedback, technical assessment, cultural fit, etc."
              rows={6}
            />
            {errors.notes && (
              <p className="text-sm text-red-500">{errors.notes.message}</p>
            )}
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
              {loading ? 'Saving...' : 'Add Note'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
