import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { updateProjectTalentStageSchema } from '@/lib/validations'
import { logActivity } from '@/lib/activity'
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

    const projectTalent = await prisma.projectTalent.findUnique({
      where: { id: params.id },
      include: {
        project: true,
        candidate: true,
        engineer: {
          include: {
            assignments: {
              where: { status: 'ACTIVE' },
              include: {
                project: { select: { id: true, title: true } },
                customer: { select: { id: true, name: true } },
              },
            },
          },
        },
        owner: {
          select: { id: true, fullName: true },
        },
      },
    })

    if (!projectTalent) {
      return NextResponse.json({ error: 'Project talent not found' }, { status: 404 })
    }

    return NextResponse.json({ data: projectTalent })
  } catch (error) {
    console.error('Error fetching project talent:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project talent' },
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

    const existing = await prisma.projectTalent.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Project talent not found' }, { status: 404 })
    }

    const body = await request.json()

    // Validate stage if provided
    if (body.stage) {
      const stageValidation = updateProjectTalentStageSchema.safeParse({ stage: body.stage })
      if (!stageValidation.success) {
        return NextResponse.json(
          { error: 'Invalid stage', details: stageValidation.error.errors },
          { status: 400 }
        )
      }
    }

    const projectTalent = await prisma.projectTalent.update({
      where: { id: params.id },
      data: {
        stage: body.stage ?? existing.stage,
        notes: body.notes ?? existing.notes,
        clientFeedback: body.clientFeedback ?? existing.clientFeedback,
        ownerUserId: body.ownerUserId ?? existing.ownerUserId,
        lastStageChangeAt: body.stage && body.stage !== existing.stage ? new Date() : existing.lastStageChangeAt,
        submittedAt:
          body.stage === 'SUBMITTED_TO_CLIENT' && !existing.submittedAt
            ? new Date()
            : existing.submittedAt,
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

    // If engineer is being ASSIGNED, create an assignment and update status
    if (
      body.stage === 'ASSIGNED' &&
      existing.stage !== 'ASSIGNED' &&
      existing.talentType === 'ENGINEER' &&
      existing.engineerId
    ) {
      const project = await prisma.project.findUnique({
        where: { id: existing.projectId },
        select: { id: true, title: true, customerId: true },
      })

      if (project) {
        // Create assignment
        await prisma.engineerAssignment.create({
          data: {
            engineerId: existing.engineerId,
            projectId: project.id,
            customerId: project.customerId,
            roleTitle: projectTalent.engineer?.title || null,
            startDate: new Date(),
            status: 'ACTIVE',
          },
        })

        // Update engineer status
        await prisma.engineer.update({
          where: { id: existing.engineerId },
          data: { employmentStatus: 'ASSIGNED' },
        })
      }
    }

    if (body.stage && body.stage !== existing.stage) {
      await logActivity({
        entityType: 'ProjectTalent',
        entityId: params.id,
        action: 'STAGE_CHANGED',
        performedByUserId: session.user.id,
        diff: { from: existing.stage, to: body.stage },
      })
    } else {
      await logActivity({
        entityType: 'ProjectTalent',
        entityId: params.id,
        action: 'UPDATED',
        performedByUserId: session.user.id,
      })
    }

    return NextResponse.json({ data: projectTalent })
  } catch (error) {
    console.error('Error updating project talent:', error)
    return NextResponse.json(
      { error: 'Failed to update project talent' },
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

    if (!hasPermission(session.user.role, 'projects:write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existing = await prisma.projectTalent.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Project talent not found' }, { status: 404 })
    }

    await prisma.projectTalent.delete({
      where: { id: params.id },
    })

    await logActivity({
      entityType: 'ProjectTalent',
      entityId: params.id,
      action: 'DELETED',
      performedByUserId: session.user.id,
    })

    return NextResponse.json({ message: 'Project talent removed successfully' })
  } catch (error) {
    console.error('Error deleting project talent:', error)
    return NextResponse.json(
      { error: 'Failed to delete project talent' },
      { status: 500 }
    )
  }
}
