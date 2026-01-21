import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { engineerSchema } from '@/lib/validations'
import { logActivity } from '@/lib/activity'
import { hasPermission } from '@/lib/permissions'

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
    const employmentStatus = searchParams.get('employmentStatus') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (technologies.length > 0) {
      where.technologies = { hasSome: technologies }
    }

    if (seniorityLevel) {
      where.seniorityLevel = seniorityLevel
    }

    if (employmentStatus) {
      where.employmentStatus = employmentStatus
    }

    const [engineers, total] = await Promise.all([
      prisma.engineer.findMany({
        where,
        include: {
          manager: {
            select: { id: true, fullName: true },
          },
          assignments: {
            where: { status: 'ACTIVE' },
            include: {
              project: { select: { id: true, title: true } },
              customer: { select: { id: true, name: true } },
            },
            take: 1,
          },
          _count: {
            select: { assignments: true, updates: true, projectTalents: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.engineer.count({ where }),
    ])

    return NextResponse.json({
      data: engineers,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Error fetching engineers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch engineers' },
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
    const validationResult = engineerSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    const engineer = await prisma.engineer.create({
      data: {
        fullName: data.fullName,
        email: data.email || null,
        phone: data.phone || null,
        location: data.location || null,
        title: data.title || null,
        technologies: data.technologies || [],
        yearsExperience: data.yearsExperience ?? null,
        seniorityLevel: data.seniorityLevel || null,
        employmentStatus: data.employmentStatus || 'ACTIVE',
        employmentStartDate: data.employmentStartDate ? new Date(data.employmentStartDate) : null,
        managerEngineerId: data.managerEngineerId || null,
      },
    })

    await logActivity({
      entityType: 'Engineer',
      entityId: engineer.id,
      action: 'CREATED',
      performedByUserId: session.user.id,
    })

    return NextResponse.json({ data: engineer }, { status: 201 })
  } catch (error) {
    console.error('Error creating engineer:', error)
    return NextResponse.json(
      { error: 'Failed to create engineer' },
      { status: 500 }
    )
  }
}
