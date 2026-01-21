'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Upload, FileText, X, Loader2 } from 'lucide-react'
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
import { candidateSchema, CandidateInput } from '@/lib/validations'

interface CandidateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidate?: {
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
    tags: string[]
    resumeExtractedText: string | null
    resumeFileUrl: string | null
    resumeOriginalName: string | null
  }
  onSuccess: () => void
}

export function CandidateDialog({
  open,
  onOpenChange,
  candidate,
  onSuccess,
}: CandidateDialogProps) {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [technologies, setTechnologies] = useState('')
  const [languages, setLanguages] = useState('')
  const [tags, setTags] = useState('')
  const [uploadedFile, setUploadedFile] = useState<{
    name: string
    url: string
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CandidateInput>({
    resolver: zodResolver(candidateSchema),
  })

  const resumeText = watch('resumeExtractedText')

  useEffect(() => {
    if (candidate) {
      setValue('fullName', candidate.fullName)
      setValue('email', candidate.email || '')
      setValue('phone', candidate.phone || '')
      setValue('location', candidate.location || '')
      setValue('title', candidate.title || '')
      setValue('summaryPublic', candidate.summaryPublic || '')
      setValue('summaryInternal', candidate.summaryInternal || '')
      setValue('yearsExperience', candidate.yearsExperience)
      setValue('seniorityLevel', candidate.seniorityLevel as CandidateInput['seniorityLevel'])
      setValue('availability', candidate.availability || '')
      setValue('salaryExpectation', candidate.salaryExpectation || '')
      setValue('resumeExtractedText', candidate.resumeExtractedText || '')
      setTechnologies(candidate.technologies.join(', '))
      setLanguages(candidate.languages.join(', '))
      setTags(candidate.tags.join(', '))
      if (candidate.resumeFileUrl) {
        setUploadedFile({
          name: candidate.resumeOriginalName || candidate.resumeFileUrl.split('/').pop() || 'Resume',
          url: candidate.resumeFileUrl,
        })
      }
    } else {
      reset()
      setTechnologies('')
      setLanguages('')
      setTags('')
      setUploadedFile(null)
    }
  }, [candidate, setValue, reset])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ]

    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF or Word document')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setUploadedFile({
          name: data.data.originalName,
          url: data.data.url,
        })
        // Auto-fill the extracted text
        if (data.data.extractedText) {
          setValue('resumeExtractedText', data.data.extractedText)
        }
      } else {
        alert(data.error || 'Failed to upload file')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload file')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const onSubmit = async (data: CandidateInput) => {
    setLoading(true)
    try {
      const payload = {
        ...data,
        technologies: technologies.split(',').map((t) => t.trim()).filter(Boolean),
        languages: languages.split(',').map((t) => t.trim()).filter(Boolean),
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        resumeFileUrl: uploadedFile?.url || null,
        resumeOriginalName: uploadedFile?.name || null,
      }

      const url = candidate ? `/api/candidates/${candidate.id}` : '/api/candidates'
      const method = candidate ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        onSuccess()
        reset()
        setUploadedFile(null)
      } else {
        const errorData = await res.json()
        alert(errorData.error || 'Failed to save candidate')
      }
    } catch (error) {
      console.error('Error saving candidate:', error)
      alert('Failed to save candidate')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {candidate ? 'Edit Candidate' : 'Add Candidate'}
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
                placeholder="john@example.com"
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
                  setValue('seniorityLevel', value as CandidateInput['seniorityLevel'])
                }
                defaultValue={candidate?.seniorityLevel || ''}
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
              <Label htmlFor="availability">Availability</Label>
              <Input
                id="availability"
                {...register('availability')}
                placeholder="Immediate, 2 weeks notice, etc."
              />
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

          <div className="space-y-2">
            <Label htmlFor="languages">Languages (comma-separated)</Label>
            <Input
              id="languages"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              placeholder="English, Hebrew"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="summaryPublic">Public Summary</Label>
            <Textarea
              id="summaryPublic"
              {...register('summaryPublic')}
              placeholder="Brief summary visible to Sales team"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="summaryInternal">Internal Summary</Label>
            <Textarea
              id="summaryInternal"
              {...register('summaryInternal')}
              placeholder="Detailed internal notes (recruiters only)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salaryExpectation">Salary Expectation</Label>
              <Input
                id="salaryExpectation"
                {...register('salaryExpectation')}
                placeholder="$100k-120k / 35k-40k NIS"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="fintech, startup-ready, remote-ok"
              />
            </div>
          </div>

          {/* CV Upload Section */}
          <div className="space-y-2">
            <Label>Upload CV (PDF or Word)</Label>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
              {uploadedFile ? (
                <div className="flex items-center justify-between bg-gray-50 rounded p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-medium">{uploadedFile.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={uploadedFile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View
                    </a>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="cv-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="cv-upload"
                    className={`cursor-pointer inline-flex flex-col items-center ${
                      uploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {uploading ? (
                      <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                    ) : (
                      <Upload className="h-8 w-8 text-gray-400" />
                    )}
                    <span className="mt-2 text-sm text-gray-500">
                      {uploading ? 'Uploading & extracting text...' : 'Click to upload CV'}
                    </span>
                    <span className="text-xs text-gray-400">PDF or Word, max 10MB</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="resumeExtractedText">Resume Content</Label>
              {resumeText && (
                <span className="text-xs text-gray-400">
                  {resumeText.length.toLocaleString()} characters
                </span>
              )}
            </div>
            <Textarea
              id="resumeExtractedText"
              {...register('resumeExtractedText')}
              placeholder="Upload a CV above to auto-extract text, or paste resume content here manually"
              rows={6}
            />
            <p className="text-xs text-gray-500">
              This text is used for matching candidates to projects. Upload a CV to auto-extract, or paste manually.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploading}>
              {loading ? 'Saving...' : candidate ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
