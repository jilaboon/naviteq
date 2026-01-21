'use client'

import { useState, useEffect } from 'react'
import { UserPlus, Filter, Users, Users2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getScoreColor, getScoreLabel } from '@/lib/matching'
import { employmentStatusLabels, employmentStatusColors } from '@/types'

interface MatchedTalent {
  id: string
  talentType: 'CANDIDATE' | 'ENGINEER'
  candidateId?: string
  engineerId?: string
  fullName: string
  title: string | null
  technologies: string[]
  yearsExperience: number | null
  seniorityLevel: string | null
  location: string | null
  employmentStatus?: string
  matchScore: number
  matchReasons: string[]
}

interface MatchingPanelProps {
  projectId: string
  onAddTalent: () => void
}

export function MatchingPanel({ projectId, onAddTalent }: MatchingPanelProps) {
  const [talents, setTalents] = useState<MatchedTalent[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState<string | null>(null)
  const [minScore, setMinScore] = useState('0')
  const [seniorityFilter, setSeniorityFilter] = useState('')
  const [talentTypeFilter, setTalentTypeFilter] = useState('')

  const fetchMatches = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ projectId })
      if (minScore) params.set('minScore', minScore)
      if (seniorityFilter) params.set('seniorityLevel', seniorityFilter)
      if (talentTypeFilter) params.set('talentType', talentTypeFilter)

      const res = await fetch(`/api/matching?${params}`)
      const data = await res.json()
      setTalents(data.data || [])
    } catch (error) {
      console.error('Error fetching matches:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMatches()
  }, [projectId, minScore, seniorityFilter, talentTypeFilter])

  const handleAddToProject = async (talent: MatchedTalent) => {
    setAdding(talent.id)
    try {
      const res = await fetch('/api/project-talents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          talentType: talent.talentType,
          candidateId: talent.candidateId || null,
          engineerId: talent.engineerId || null,
          stage: 'SHORTLISTED',
        }),
      })

      if (res.ok) {
        // Remove from list and refresh parent
        setTalents(talents.filter((t) => t.id !== talent.id))
        onAddTalent()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to add talent')
      }
    } catch (error) {
      console.error('Error adding talent:', error)
    } finally {
      setAdding(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <Filter className="h-5 w-5 text-gray-400" />
        <Select value={talentTypeFilter || '_all'} onValueChange={(v) => setTalentTypeFilter(v === '_all' ? '' : v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Talent Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Talent</SelectItem>
            <SelectItem value="CANDIDATE">Candidates Only</SelectItem>
            <SelectItem value="ENGINEER">Engineers Only</SelectItem>
          </SelectContent>
        </Select>
        <Select value={minScore} onValueChange={setMinScore}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Min Score" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">All Scores</SelectItem>
            <SelectItem value="40">40+ (Fair)</SelectItem>
            <SelectItem value="60">60+ (Good)</SelectItem>
            <SelectItem value="80">80+ (Excellent)</SelectItem>
          </SelectContent>
        </Select>
        <Select value={seniorityFilter || '_all'} onValueChange={(v) => setSeniorityFilter(v === '_all' ? '' : v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Seniority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Levels</SelectItem>
            <SelectItem value="JUNIOR">Junior</SelectItem>
            <SelectItem value="MID">Mid</SelectItem>
            <SelectItem value="SENIOR">Senior</SelectItem>
            <SelectItem value="LEAD">Lead</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchMatches}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-500">Finding matches...</div>
      ) : talents.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          No matching talent found. Try adjusting filters or add more candidates/engineers to the system.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {talents.map((talent) => (
            <Card key={talent.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {talent.talentType === 'ENGINEER' ? (
                        <Users2 className="h-4 w-4 text-teal-600" />
                      ) : (
                        <Users className="h-4 w-4 text-purple-600" />
                      )}
                      <span className="font-medium">{talent.fullName}</span>
                      <Badge className={getScoreColor(talent.matchScore)}>
                        {talent.matchScore}% - {getScoreLabel(talent.matchScore)}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      {talent.title && (
                        <span className="text-sm text-gray-500">{talent.title}</span>
                      )}
                      <Badge
                        variant="outline"
                        className={
                          talent.talentType === 'ENGINEER'
                            ? 'bg-teal-50 text-teal-700 border-teal-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }
                      >
                        {talent.talentType === 'ENGINEER' ? 'Engineer' : 'Candidate'}
                      </Badge>
                      {talent.talentType === 'ENGINEER' && talent.employmentStatus && (
                        <Badge
                          className={
                            employmentStatusColors[
                              talent.employmentStatus as keyof typeof employmentStatusColors
                            ]
                          }
                        >
                          {
                            employmentStatusLabels[
                              talent.employmentStatus as keyof typeof employmentStatusLabels
                            ]
                          }
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {talent.technologies.slice(0, 5).map((tech) => (
                        <Badge key={tech} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                      {talent.technologies.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{talent.technologies.length - 5}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-gray-600">
                      {talent.matchReasons.map((reason, idx) => (
                        <div key={idx}>• {reason}</div>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                      {talent.seniorityLevel && (
                        <span>{talent.seniorityLevel}</span>
                      )}
                      {talent.yearsExperience != null && (
                        <span>{talent.yearsExperience} years</span>
                      )}
                      {talent.location && <span>{talent.location}</span>}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddToProject(talent)}
                    disabled={adding === talent.id}
                  >
                    <UserPlus className="mr-1 h-4 w-4" />
                    {adding === talent.id ? 'Adding...' : 'Add'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
