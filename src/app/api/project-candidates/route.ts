import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { projectCandidateSchema } from '@/lib/validations'
import { logActivity } from '@/lib/activity'
import { hasPermission } from '@/lib/permissions'
import { calculateMatchScore } from '@/lib/matching'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'project_candidates:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId') || ''
    const candidateId = searchParams.get('candidateId') || ''
    const stage = searchParams.get('stage') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')

    const where: Record<string, unknown> = {}

    if (projectId) {
      where.projectId = projectId
    }

    if (candidateId) {
      where.candidateId = candidateId
    }

    if (stage) {
      where.stage = stage
    }

    const [projectCandidates, total] = await Promise.all([
      prisma.projectCandidate.findMany({
        where,
        include: {
          project: {
            select: { id: true, title: true, status: true, customerId: true },
          },
          candidate: {
            select: {
              id: true,
              fullName: true,
              title: true,
              technologies: true,
              yearsExperience: true,
              seniorityLevel: true,
              summaryPublic: true,
              location: true,
            },
          },
          recruiterOwner: {
            select: { id: true, fullName: true },
          },
        },
        orderBy: [{ stage: 'asc' }, { matchScore: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.projectCandidate.count({ where }),
    ])

    return NextResponse.json({
      data: projectCandidates,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Error fetching project candidates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project candidates' },
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

    if (!hasPermission(session.user.role, 'project_candidates:write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validationResult = projectCandidateSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check if already exists
    const existing = await prisma.projectCandidate.findUnique({
      where: {
        projectId_candidateId: {
          projectId: data.projectId,
          candidateId: data.candidateId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Candidate is already added to this project' },
        { status: 400 }
      )
    }

    // Calculate match score
    const [project, candidate] = await Promise.all([
      prisma.project.findUnique({ where: { id: data.projectId } }),
      prisma.candidate.findUnique({ where: { id: data.candidateId } }),
    ])

    if (!project || !candidate) {
      return NextResponse.json(
        { error: 'Project or candidate not found' },
        { status: 404 }
      )
    }

    const matchResult = calculateMatchScore(candidate, project)

    const projectCandidate = await prisma.projectCandidate.create({
      data: {
        projectId: data.projectId,
        candidateId: data.candidateId,
        stage: data.stage || 'SHORTLISTED',
        matchScore: matchResult.score,
        matchReasons: matchResult.reasons,
        recruiterOwnerUserId: data.recruiterOwnerUserId || session.user.id,
        notes: data.notes || null,
        lastStageChangeAt: new Date(),
      },
      include: {
        project: {
          select: { id: true, title: true },
        },
        candidate: {
          select: { id: true, fullName: true },
        },
        recruiterOwner: {
          select: { id: true, fullName: true },
        },
      },
    })

    await logActivity({
      entityType: 'ProjectCandidate',
      entityId: projectCandidate.id,
      action: 'CREATED',
      performedByUserId: session.user.id,
    })

    return NextResponse.json({ data: projectCandidate }, { status: 201 })
  } catch (error) {
    console.error('Error creating project candidate:', error)
    return NextResponse.json(
      { error: 'Failed to add candidate to project' },
      { status: 500 }
    )
  }
}
