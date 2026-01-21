import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { projectSchema } from '@/lib/validations'
import { logActivity, createDiff } from '@/lib/activity'
import { hasPermission } from '@/lib/permissions'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'projects:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          select: { id: true, name: true, industry: true },
        },
        assignedUsers: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true, role: true },
            },
          },
        },
        projectCandidates: {
          include: {
            candidate: {
              select: {
                id: true,
                fullName: true,
                title: true,
                technologies: true,
                yearsExperience: true,
                seniorityLevel: true,
                summaryPublic: true,
              },
            },
            recruiterOwner: {
              select: { id: true, fullName: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Client managers can only see projects they're assigned to
    if (session.user.role === 'CLIENT_MANAGER') {
      const isAssigned = project.assignedUsers.some(
        (a) => a.userId === session.user.id
      )
      if (!isAssigned) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.json({ data: project })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'projects:write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existing = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        assignedUsers: true,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Client managers can only update status and notes of their assigned projects
    if (session.user.role === 'CLIENT_MANAGER') {
      const isAssigned = existing.assignedUsers.some(
        (a) => a.userId === session.user.id
      )
      if (!isAssigned) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
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
    const oldStatus = existing.status

    // Handle assigned users update
    if (data.assignedUserIds) {
      // Delete existing assignments
      await prisma.projectAssignment.deleteMany({
        where: { projectId: params.id },
      })

      // Create new assignments
      await prisma.projectAssignment.createMany({
        data: data.assignedUserIds.map((userId: string) => ({
          projectId: params.id,
          userId,
        })),
      })
    }

    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        customerId: data.customerId,
        title: data.title,
        description: data.description || null,
        technologies: data.technologies || [],
        mustHave: data.mustHave || [],
        niceToHave: data.niceToHave || [],
        seniorityLevel: data.seniorityLevel || null,
        yearsExperienceMin: data.yearsExperienceMin ?? null,
        location: data.location || null,
        remotePolicy: data.remotePolicy || null,
        languageRequirements: data.languageRequirements || [],
        headcount: data.headcount ?? null,
        priority: data.priority,
        status: data.status,
        devOpsStatus: data.devOpsStatus ?? null,
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

    const diff = createDiff(
      existing as unknown as Record<string, unknown>,
      project as unknown as Record<string, unknown>
    )

    // Log stage change separately if status changed
    if (oldStatus !== project.status) {
      await logActivity({
        entityType: 'Project',
        entityId: project.id,
        action: 'STAGE_CHANGED',
        performedByUserId: session.user.id,
        diff: { status: { old: oldStatus, new: project.status } },
      })
    } else {
      await logActivity({
        entityType: 'Project',
        entityId: project.id,
        action: 'UPDATED',
        performedByUserId: session.user.id,
        diff: diff || undefined,
      })
    }

    return NextResponse.json({ data: project })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'projects:delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existing = await prisma.project.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    await prisma.project.delete({
      where: { id: params.id },
    })

    await logActivity({
      entityType: 'Project',
      entityId: params.id,
      action: 'DELETED',
      performedByUserId: session.user.id,
    })

    return NextResponse.json({ message: 'Project deleted successfully' })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
