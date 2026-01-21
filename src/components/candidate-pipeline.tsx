'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  candidateStageLabels,
  candidateStageColors,
  CandidateStage,
} from '@/types'

interface ProjectCandidate {
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
}

interface CandidatePipelineProps {
  projectId: string
  candidates: ProjectCandidate[]
  onRefresh: () => void
}

const stages: CandidateStage[] = [
  'SHORTLISTED',
  'CONTACTED',
  'SUBMITTED_TO_CLIENT',
  'INTERVIEWING',
  'REJECTED',
  'HIRED',
]

export function CandidatePipeline({
  projectId,
  candidates,
  onRefresh,
}: CandidatePipelineProps) {
  const [updating, setUpdating] = useState<string | null>(null)

  const handleStageChange = async (
    projectCandidateId: string,
    newStage: string
  ) => {
    setUpdating(projectCandidateId)
    try {
      const res = await fetch(`/api/project-candidates/${projectCandidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      })

      if (res.ok) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error updating stage:', error)
    } finally {
      setUpdating(null)
    }
  }

  const handleRemove = async (projectCandidateId: string) => {
    if (!confirm('Remove this candidate from the project?')) return

    try {
      const res = await fetch(`/api/project-candidates/${projectCandidateId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error removing candidate:', error)
    }
  }

  // Group candidates by stage
  const candidatesByStage = stages.reduce(
    (acc, stage) => {
      acc[stage] = candidates.filter((c) => c.stage === stage)
      return acc
    },
    {} as Record<CandidateStage, ProjectCandidate[]>
  )

  if (candidates.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          No candidates in this project yet. Use the &quot;Find Matches&quot; tab to add
          candidates.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-6 gap-2">
        {stages.map((stage) => (
          <div
            key={stage}
            className={`rounded-lg p-2 text-center ${candidateStageColors[stage]}`}
          >
            <div className="text-2xl font-bold">
              {candidatesByStage[stage].length}
            </div>
            <div className="text-xs">{candidateStageLabels[stage]}</div>
          </div>
        ))}
      </div>

      {/* List view */}
      <Card>
        <CardHeader>
          <CardTitle>All Candidates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {candidates.map((pc) => (
              <div
                key={pc.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/candidates/${pc.candidate.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {pc.candidate.fullName}
                    </Link>
                    {pc.matchScore != null && (
                      <Badge variant="outline" className="text-xs">
                        {pc.matchScore}% match
                      </Badge>
                    )}
                  </div>
                  {pc.candidate.title && (
                    <div className="text-sm text-gray-500">
                      {pc.candidate.title}
                    </div>
                  )}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {pc.candidate.technologies.slice(0, 4).map((tech) => (
                      <Badge key={tech} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={pc.stage}
                    onValueChange={(value) => handleStageChange(pc.id, value)}
                    disabled={updating === pc.id}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {candidateStageLabels[stage]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(pc.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
