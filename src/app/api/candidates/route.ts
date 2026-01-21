import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { candidateSchema } from '@/lib/validations'
import { logActivity } from '@/lib/activity'
import { hasPermission, canAccessFullCandidateInfo } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'candidates:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const technologies = searchParams.get('technologies')?.split(',').filter(Boolean) || []
    const seniorityLevel = searchParams.get('seniorityLevel') || ''
    const minYears = searchParams.get('minYearsExperience')
    const maxYears = searchParams.get('maxYearsExperience')
    const location = searchParams.get('location') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { summaryPublic: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (technologies.length > 0) {
      where.technologies = { hasSome: technologies }
    }

    if (seniorityLevel) {
      where.seniorityLevel = seniorityLevel
    }

    if (minYears) {
      where.yearsExperience = {
        ...(where.yearsExperience as Record<string, unknown> || {}),
        gte: parseInt(minYears),
      }
    }

    if (maxYears) {
      where.yearsExperience = {
        ...(where.yearsExperience as Record<string, unknown> || {}),
        lte: parseInt(maxYears),
      }
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' }
    }

    const canSeeFullInfo = canAccessFullCandidateInfo(session.user.role)

    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: canSeeFullInfo,
          phone: canSeeFullInfo,
          location: true,
          title: true,
          summaryPublic: true,
          summaryInternal: canSeeFullInfo,
          technologies: true,
          yearsExperience: true,
          seniorityLevel: true,
          languages: true,
          availability: canSeeFullInfo,
          salaryExpectation: canSeeFullInfo,
          resumeFileUrl: canSeeFullInfo,
          resumeOriginalName: canSeeFullInfo,
          tags: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { projectCandidates: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.candidate.count({ where }),
    ])

    return NextResponse.json({
      data: candidates,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Error fetching candidates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch candidates' },
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

    if (!hasPermission(session.user.role, 'candidates:write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validationResult = candidateSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    const candidate = await prisma.candidate.create({
      data: {
        fullName: data.fullName,
        email: data.email || null,
        phone: data.phone || null,
        location: data.location || null,
        title: data.title || null,
        summaryPublic: data.summaryPublic || null,
        summaryInternal: data.summaryInternal || null,
        technologies: data.technologies || [],
        yearsExperience: data.yearsExperience ?? null,
        seniorityLevel: data.seniorityLevel || null,
        languages: data.languages || [],
        availability: data.availability || null,
        salaryExpectation: data.salaryExpectation || null,
        tags: data.tags || [],
        resumeExtractedText: data.resumeExtractedText || null,
        resumeFileUrl: data.resumeFileUrl || null,
        resumeOriginalName: data.resumeOriginalName || null,
        resumeUploadedAt: data.resumeFileUrl ? new Date() : null,
      },
    })

    await logActivity({
      entityType: 'Candidate',
      entityId: candidate.id,
      action: 'CREATED',
      performedByUserId: session.user.id,
    })

    return NextResponse.json({ data: candidate }, { status: 201 })
  } catch (error) {
    console.error('Error creating candidate:', error)
    return NextResponse.json(
      { error: 'Failed to create candidate' },
      { status: 500 }
    )
  }
}
