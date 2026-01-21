import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { projectUpdateSchema } from '@/lib/validations'
import { logActivity } from '@/lib/activity'
import { hasPermission } from '@/lib/permissions'

// GET /api/projects/[id]/updates - Get all updates for a project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'project_updates:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const projectId = params.id

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const [updates, total] = await Promise.all([
      prisma.projectUpdate.findMany({
        where: { projectId },
        include: {
          author: {
            select: { id: true, fullName: true, email: true, role: true },
          },
          mentionedUsers: {
            select: { id: true, fullName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.projectUpdate.count({ where: { projectId } }),
    ])

    return NextResponse.json({
      data: updates,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Error fetching project updates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project updates' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/updates - Create a new update
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'project_updates:write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const projectId = params.id

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, title: true },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const body = await request.json()
    const validationResult = projectUpdateSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data
    const mentionedUserIds = data.mentionedUserIds || []

    // Create the update
    const update = await prisma.projectUpdate.create({
      data: {
        projectId,
        authorUserId: session.user.id,
        content: data.content,
        visibility: data.visibility || 'INTERNAL',
        tags: data.tags || [],
        mentionedUsers: {
          connect: mentionedUserIds.map((id) => ({ id })),
        },
      },
      include: {
        author: {
          select: { id: true, fullName: true, email: true, role: true },
        },
        mentionedUsers: {
          select: { id: true, fullName: true, email: true },
        },
      },
    })

    // Create notifications for mentioned users
    if (mentionedUserIds.length > 0) {
      await prisma.notification.createMany({
        data: mentionedUserIds
          .filter((id) => id !== session.user.id) // Don't notify the author
          .map((userId) => ({
            userId,
            type: 'MENTION',
            title: 'You were mentioned in a project update',
            message: `${session.user.fullName} mentioned you in an update on "${project.title}"`,
            linkUrl: `/projects/${projectId}?tab=updates`,
            projectUpdateId: update.id,
          })),
      })
    }

    // Log activity
    await logActivity({
      entityType: 'Project',
      entityId: projectId,
      action: 'UPDATE_ADDED',
      performedByUserId: session.user.id,
      diff: { updateId: update.id },
    })

    return NextResponse.json({ data: update }, { status: 201 })
  } catch (error) {
    console.error('Error creating project update:', error)
    return NextResponse.json(
      { error: 'Failed to create project update' },
      { status: 500 }
    )
  }
}
