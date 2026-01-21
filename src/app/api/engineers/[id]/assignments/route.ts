import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { engineerAssignmentSchema } from '@/lib/validations'
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

    if (!hasPermission(session.user.role, 'candidates:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const assignments = await prisma.engineerAssignment.findMany({
      where: { engineerId: params.id },
      include: {
        project: { select: { id: true, title: true, status: true } },
        customer: { select: { id: true, name: true } },
      },
      orderBy: { startDate: 'desc' },
    })

    return NextResponse.json({ data: assignments })
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'candidates:write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if engineer exists
    const engineer = await prisma.engineer.findUnique({
      where: { id: params.id },
    })

    if (!engineer) {
      return NextResponse.json({ error: 'Engineer not found' }, { status: 404 })
    }

    const body = await request.json()
    const validationResult = engineerAssignmentSchema.safeParse({
      ...body,
      engineerId: params.id,
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check for existing active assignment (MVP: at most one active at a time)
    if (data.status === 'ACTIVE' || !data.status) {
      const existingActive = await prisma.engineerAssignment.findFirst({
        where: {
          engineerId: params.id,
          status: 'ACTIVE',
        },
      })

      if (existingActive) {
        return NextResponse.json(
          { error: 'Engineer already has an active assignment. Complete or cancel it first.' },
          { status: 400 }
        )
      }
    }

    const assignment = await prisma.engineerAssignment.create({
      data: {
        engineerId: params.id,
        projectId: data.projectId || null,
        customerId: data.customerId || null,
        roleTitle: data.roleTitle || null,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: data.status || 'ACTIVE',
        notes: data.notes || null,
      },
      include: {
        project: { select: { id: true, title: true } },
        customer: { select: { id: true, name: true } },
      },
    })

    // Update engineer status to ASSIGNED if assignment is active
    if (assignment.status === 'ACTIVE') {
      await prisma.engineer.update({
        where: { id: params.id },
        data: { employmentStatus: 'ASSIGNED' },
      })
    }

    await logActivity({
      entityType: 'Engineer',
      entityId: params.id,
      action: 'ASSIGNED',
      performedByUserId: session.user.id,
      diff: {
        assignmentId: assignment.id,
        projectId: assignment.projectId,
        customerId: assignment.customerId,
      },
    })

    return NextResponse.json({ data: assignment }, { status: 201 })
  } catch (error) {
    console.error('Error creating assignment:', error)
    return NextResponse.json(
      { error: 'Failed to create assignment' },
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

    if (!hasPermission(session.user.role, 'candidates:write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('assignmentId')

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'assignmentId query parameter required' },
        { status: 400 }
      )
    }

    const existing = await prisma.engineerAssignment.findUnique({
      where: { id: assignmentId },
    })

    if (!existing || existing.engineerId !== params.id) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    const body = await request.json()

    const assignment = await prisma.engineerAssignment.update({
      where: { id: assignmentId },
      data: {
        roleTitle: body.roleTitle ?? existing.roleTitle,
        startDate: body.startDate ? new Date(body.startDate) : existing.startDate,
        endDate: body.endDate ? new Date(body.endDate) : body.endDate === null ? null : existing.endDate,
        status: body.status ?? existing.status,
        notes: body.notes ?? existing.notes,
      },
      include: {
        project: { select: { id: true, title: true } },
        customer: { select: { id: true, name: true } },
      },
    })

    // Update engineer status based on assignment status change
    if (body.status && body.status !== 'ACTIVE' && existing.status === 'ACTIVE') {
      // Check if there are other active assignments
      const otherActive = await prisma.engineerAssignment.findFirst({
        where: {
          engineerId: params.id,
          status: 'ACTIVE',
          id: { not: assignmentId },
        },
      })

      if (!otherActive) {
        await prisma.engineer.update({
          where: { id: params.id },
          data: { employmentStatus: 'BENCH' },
        })
      }
    }

    await logActivity({
      entityType: 'Engineer',
      entityId: params.id,
      action: 'UPDATED',
      performedByUserId: session.user.id,
      diff: { assignmentId, status: body.status },
    })

    return NextResponse.json({ data: assignment })
  } catch (error) {
    console.error('Error updating assignment:', error)
    return NextResponse.json(
      { error: 'Failed to update assignment' },
      { status: 500 }
    )
  }
}
