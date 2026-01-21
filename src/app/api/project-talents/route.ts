import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { projectTalentSchema } from '@/lib/validations'
import { logActivity } from '@/lib/activity'
import { hasPermission } from '@/lib/permissions'
import { calculateMatchScore, calculateEngineerMatchScore } from '@/lib/matching'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'projects:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const talentType = searchParams.get('talentType')
    const stage = searchParams.get('stage')

    const where: Record<string, unknown> = {}

    if (projectId) {
      where.projectId = projectId
    }

    if (talentType) {
      where.talentType = talentType
    }

    if (stage) {
      where.stage = stage
    }

    const talents = await prisma.projectTalent.findMany({
      where,
      include: {
        project: {
          select: { id: true, title: true, status: true },
        },
        candidate: {
          select: {
            id: true,
            fullName: true,
            title: true,
            technologies: true,
            seniorityLevel: true,
            yearsExperience: true,
            location: true,
          },
        },
        engineer: {
          select: {
            id: true,
            fullName: true,
            title: true,
            technologies: true,
            seniorityLevel: true,
            yearsExperience: true,
            location: true,
            employmentStatus: true,
          },
        },
        owner: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: [{ stage: 'asc' }, { matchScore: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ data: talents })
  } catch (error) {
    console.error('Error fetching project talents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project talents' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'projects:write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validationResult = projectTalentSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Get the project
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Calculate match score
    let matchScore: number | null = null
    let matchReasons: string[] = []

    if (data.talentType === 'CANDIDATE' && data.candidateId) {
      const candidate = await prisma.candidate.findUnique({
        where: { id: data.candidateId },
      })

      if (!candidate) {
        return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
      }

      // Check for duplicate
      const existing = await prisma.projectTalent.findUnique({
        where: {
          projectId_candidateId: {
            projectId: data.projectId,
            candidateId: data.candidateId,
          },
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Candidate already added to this project' },
          { status: 400 }
        )
      }

      const matchResult = calculateMatchScore(candidate, project)
      matchScore = matchResult.score
      matchReasons = matchResult.reasons
    } else if (data.talentType === 'ENGINEER' && data.engineerId) {
      const engineer = await prisma.engineer.findUnique({
        where: { id: data.engineerId },
        include: {
          assignments: {
            where: { status: 'ACTIVE' },
          },
        },
      })

      if (!engineer) {
        return NextResponse.json({ error: 'Engineer not found' }, { status: 404 })
      }

      // Check for duplicate
      const existing = await prisma.projectTalent.findUnique({
        where: {
          projectId_engineerId: {
            projectId: data.projectId,
            engineerId: data.engineerId,
          },
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Engineer already added to this project' },
          { status: 400 }
        )
      }

      const matchResult = calculateEngineerMatchScore(engineer, project)
      matchScore = matchResult.score
      matchReasons = matchResult.reasons
    }

    const projectTalent = await prisma.projectTalent.create({
      data: {
        projectId: data.projectId,
        talentType: data.talentType,
        candidateId: data.candidateId || null,
        engineerId: data.engineerId || null,
        stage: data.stage || 'SHORTLISTED',
        matchScore,
        matchReasons: matchReasons.length > 0 ? matchReasons : undefined,
        ownerUserId: data.ownerUserId || session.user.id,
        notes: data.notes || null,
      },
      include: {
        candidate: {
          select: { id: true, fullName: true, title: true },
        },
        engineer: {
          select: { id: true, fullName: true, title: true },
        },
      },
    })

    await logActivity({
      entityType: 'ProjectTalent',
      entityId: projectTalent.id,
      action: 'CREATED',
      performedByUserId: session.user.id,
      diff: {
        projectId: data.projectId,
        talentType: data.talentType,
        talentId: data.candidateId || data.engineerId,
      },
    })

    return NextResponse.json({ data: projectTalent }, { status: 201 })
  } catch (error) {
    console.error('Error creating project talent:', error)
    return NextResponse.json(
      { error: 'Failed to create project talent' },
      { status: 500 }
    )
  }
}
