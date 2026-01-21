import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
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

    if (!hasPermission(session.user.role, 'project_candidates:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const projectCandidate = await prisma.projectCandidate.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: { id: true, title: true, status: true, customer: { select: { name: true } } },
        },
        candidate: true,
        recruiterOwner: {
          select: { id: true, fullName: true },
        },
      },
    })

    if (!projectCandidate) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ data: projectCandidate })
  } catch (error) {
    console.error('Error fetching project candidate:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project candidate' },
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

    if (!hasPermission(session.user.role, 'project_candidates:write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existing = await prisma.projectCandidate.findUnique({
      where: { id: params.id },
      include: {
        project: {
          include: { assignedUsers: true },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Client managers can only update feedback on their assigned projects
    if (session.user.role === 'CLIENT_MANAGER') {
      const isAssigned = existing.project.assignedUsers.some(
        (a) => a.userId === session.user.id
      )
      if (!isAssigned) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const body = await request.json()
    const { stage, notes, clientFeedback, submittedAt } = body

    const updateData: Record<string, unknown> = {}

    if (stage !== undefined) {
      updateData.stage = stage
      updateData.lastStageChangeAt = new Date()

      if (stage === 'SUBMITTED_TO_CLIENT' && !existing.submittedAt) {
        updateData.submittedAt = new Date()
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    if (clientFeedback !== undefined) {
      updateData.clientFeedback = clientFeedback
    }

    if (submittedAt !== undefined) {
      updateData.submittedAt = submittedAt ? new Date(submittedAt) : null
    }

    const projectCandidate = await prisma.projectCandidate.update({
      where: { id: params.id },
      data: updateData,
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

    // Log stage change
    if (stage && stage !== existing.stage) {
      await logActivity({
        entityType: 'ProjectCandidate',
        entityId: projectCandidate.id,
        action: 'STAGE_CHANGED',
        performedByUserId: session.user.id,
        diff: { stage: { old: existing.stage, new: stage } },
      })
    } else {
      await logActivity({
        entityType: 'ProjectCandidate',
        entityId: projectCandidate.id,
        action: 'UPDATED',
        performedByUserId: session.user.id,
      })
    }

    return NextResponse.json({ data: projectCandidate })
  } catch (error) {
    console.error('Error updating project candidate:', error)
    return NextResponse.json(
      { error: 'Failed to update project candidate' },
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

    if (!hasPermission(session.user.role, 'project_candidates:delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existing = await prisma.projectCandidate.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.projectCandidate.delete({
      where: { id: params.id },
    })

    await logActivity({
      entityType: 'ProjectCandidate',
      entityId: params.id,
      action: 'DELETED',
      performedByUserId: session.user.id,
    })

    return NextResponse.json({ message: 'Removed from project successfully' })
  } catch (error) {
    console.error('Error deleting project candidate:', error)
    return NextResponse.json(
      { error: 'Failed to remove candidate from project' },
      { status: 500 }
    )
  }
}
