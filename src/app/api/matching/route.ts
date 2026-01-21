import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hasPermission } from '@/lib/permissions'
import { rankCandidates, rankEngineers, rankAllTalent } from '@/lib/matching'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'projects:read') ||
        !hasPermission(session.user.role, 'candidates:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const minScore = parseInt(searchParams.get('minScore') || '0')
    const technologies = searchParams.get('technologies')?.split(',').filter(Boolean) || []
    const seniorityLevel = searchParams.get('seniorityLevel') || ''
    const talentType = searchParams.get('talentType') || '' // 'CANDIDATE', 'ENGINEER', or '' for all
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      )
    }

    // Get the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get talent already in this project (both legacy and new)
    const [existingCandidates, existingTalents] = await Promise.all([
      prisma.projectCandidate.findMany({
        where: { projectId },
        select: { candidateId: true },
      }),
      prisma.projectTalent.findMany({
        where: { projectId },
        select: { candidateId: true, engineerId: true },
      }),
    ])

    const excludeCandidateIds = [
      ...existingCandidates.map((pc) => pc.candidateId),
      ...existingTalents.filter((t) => t.candidateId).map((t) => t.candidateId as string),
    ]
    const excludeEngineerIds = existingTalents
      .filter((t) => t.engineerId)
      .map((t) => t.engineerId as string)

    // Build filters
    const candidateWhere: Record<string, unknown> = {
      id: { notIn: excludeCandidateIds },
    }
    const engineerWhere: Record<string, unknown> = {
      id: { notIn: excludeEngineerIds },
      employmentStatus: { notIn: ['INACTIVE'] }, // Exclude inactive engineers by default
    }

    // Apply technology filter
    if (technologies.length > 0) {
      candidateWhere.technologies = { hasSome: technologies }
      engineerWhere.technologies = { hasSome: technologies }
    }

    // Apply seniority filter
    if (seniorityLevel) {
      candidateWhere.seniorityLevel = seniorityLevel
      engineerWhere.seniorityLevel = seniorityLevel
    }

    // Handle talent type filter
    const includeCandidates = !talentType || talentType === 'CANDIDATE'
    const includeEngineers = !talentType || talentType === 'ENGINEER'

    // Fetch candidates and engineers based on filters
    const [candidates, engineers] = await Promise.all([
      includeCandidates
        ? prisma.candidate.findMany({ where: candidateWhere })
        : Promise.resolve([]),
      includeEngineers
        ? prisma.engineer.findMany({
            where: engineerWhere,
            include: {
              assignments: {
                orderBy: { startDate: 'desc' },
              },
            },
          })
        : Promise.resolve([]),
    ])

    // Calculate and merge match results
    let results: Array<{
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
    }> = []

    if (talentType === 'CANDIDATE') {
      // Only candidates
      const matchResults = rankCandidates(candidates, project)
      results = matchResults
        .filter((r) => r.score >= minScore)
        .map((match) => {
          const candidate = candidates.find((c) => c.id === match.candidateId)!
          return {
            id: candidate.id,
            talentType: 'CANDIDATE' as const,
            candidateId: candidate.id,
            fullName: candidate.fullName,
            title: candidate.title,
            technologies: candidate.technologies,
            yearsExperience: candidate.yearsExperience,
            seniorityLevel: candidate.seniorityLevel,
            location: candidate.location,
            matchScore: match.score,
            matchReasons: match.reasons,
          }
        })
    } else if (talentType === 'ENGINEER') {
      // Only engineers
      const matchResults = rankEngineers(engineers, project)
      results = matchResults
        .filter((r) => r.score >= minScore)
        .map((match) => {
          const engineer = engineers.find((e) => e.id === match.engineerId)!
          return {
            id: engineer.id,
            talentType: 'ENGINEER' as const,
            engineerId: engineer.id,
            fullName: engineer.fullName,
            title: engineer.title,
            technologies: engineer.technologies,
            yearsExperience: engineer.yearsExperience,
            seniorityLevel: engineer.seniorityLevel,
            location: engineer.location,
            employmentStatus: engineer.employmentStatus,
            matchScore: match.score,
            matchReasons: match.reasons,
          }
        })
    } else {
      // Both - use unified ranking
      const unifiedResults = rankAllTalent(candidates, engineers, project)
      results = unifiedResults
        .filter((r) => r.score >= minScore)
        .map((match) => ({
          id: match.id,
          talentType: match.talentType,
          candidateId: match.candidateId,
          engineerId: match.engineerId,
          fullName: match.fullName,
          title: match.title,
          technologies: match.technologies,
          yearsExperience: match.yearsExperience,
          seniorityLevel: match.seniorityLevel,
          location: match.location,
          employmentStatus: match.employmentStatus,
          matchScore: match.score,
          matchReasons: match.reasons,
        }))
    }

    // Apply limit
    const limitedResults = results.slice(0, limit)

    return NextResponse.json({
      data: limitedResults,
      total: results.length,
      returned: limitedResults.length,
      projectId,
      filters: {
        talentType: talentType || 'ALL',
        minScore,
        seniorityLevel: seniorityLevel || null,
        technologies: technologies.length > 0 ? technologies : null,
      },
    })
  } catch (error) {
    console.error('Error fetching matches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    )
  }
}
