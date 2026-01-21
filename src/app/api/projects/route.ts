import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { projectSchema } from '@/lib/validations'
import { logActivity } from '@/lib/activity'
import { hasPermission } from '@/lib/permissions'

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
    const search = searchParams.get('search') || ''
    const customerId = searchParams.get('customerId') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''
    const devOpsStatus = searchParams.get('devOpsStatus') || ''
    const priority = searchParams.get('priority') || ''
    const assignedUserId = searchParams.get('assignedUserId') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (customerId) {
      where.customerId = customerId
    }

    // Filter by project category
    if (category) {
      where.projectCategory = category
    }

    if (status) {
      where.status = status
    }

    if (devOpsStatus) {
      where.devOpsStatus = devOpsStatus
    }

    if (priority) {
      where.priority = priority
    }

    if (assignedUserId) {
      where.assignedUsers = {
        some: { userId: assignedUserId },
      }
    }

    // Client managers can only see projects they're assigned to
    if (session.user.role === 'CLIENT_MANAGER') {
      where.assignedUsers = {
        some: { userId: session.user.id },
      }
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          customer: {
            select: { id: true, name: true },
          },
          assignedUsers: {
            include: {
              user: {
                select: { id: true, fullName: true, email: true, role: true },
              },
            },
          },
          engineerAssignments: {
            include: {
              engineer: {
                select: { id: true, fullName: true },
              },
            },
          },
          _count: {
            select: {
              projectCandidates: true,
              projectTalents: true,
              updates: true,
              engineerAssignments: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.project.count({ where }),
    ])

    return NextResponse.json({
      data: projects,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
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
    const validationResult = projectSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    const project = await prisma.project.create({
      data: {
        customerId: data.customerId,
        title: data.title,
        description: data.description || null,
        projectCategory: data.projectCategory || 'PIPELINE',
        technologies: data.technologies || [],
        mustHave: data.mustHave || [],
        niceToHave: data.niceToHave || [],
        seniorityLevel: data.seniorityLevel || null,
        yearsExperienceMin: data.yearsExperienceMin ?? null,
        location: data.location || null,
        remotePolicy: data.remotePolicy || null,
        languageRequirements: data.languageRequirements || [],
        headcount: data.headcount ?? null,
        priority: data.priority || 'MEDIUM',
        status: data.status || 'INITIAL',
        devOpsStatus: data.projectCategory === 'DEVOPS' ? (data.devOpsStatus || 'ACTIVE') : null,
        assignedUsers: data.assignedUserIds
          ? {
              create: data.assignedUserIds.map((userId: string) => ({
                userId,
              })),
            }
          : {
              create: [{ userId: session.user.id }],
            },
      },
      include: {
        customer: {
          select: { id: true, name: true },
        },
        assignedUsers: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true, role: true },
            },
          },
        },
      },
    })

    await logActivity({
      entityType: 'Project',
      entityId: project.id,
      action: 'CREATED',
      performedByUserId: session.user.id,
    })

    return NextResponse.json({ data: project }, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
