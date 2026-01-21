import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { engineerSchema } from '@/lib/validations'
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

    if (!hasPermission(session.user.role, 'candidates:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const engineer = await prisma.engineer.findUnique({
      where: { id: params.id },
      include: {
        linkedCandidate: true,
        manager: {
          select: { id: true, fullName: true, title: true },
        },
        directReports: {
          select: { id: true, fullName: true, title: true },
        },
        assignments: {
          include: {
            project: { select: { id: true, title: true, status: true } },
            customer: { select: { id: true, name: true } },
          },
          orderBy: { startDate: 'desc' },
        },
        updates: {
          include: {
            author: { select: { id: true, fullName: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        projectTalents: {
          include: {
            project: {
              select: { id: true, title: true, status: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { assignments: true, updates: true, projectTalents: true },
        },
      },
    })

    if (!engineer) {
      return NextResponse.json({ error: 'Engineer not found' }, { status: 404 })
    }

    return NextResponse.json({ data: engineer })
  } catch (error) {
    console.error('Error fetching engineer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch engineer' },
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

    const existing = await prisma.engineer.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Engineer not found' }, { status: 404 })
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

    const engineer = await prisma.engineer.update({
      where: { id: params.id },
      data: {
        fullName: data.fullName,
        email: data.email || null,
        phone: data.phone || null,
        location: data.location || null,
        title: data.title || null,
        technologies: data.technologies || [],
        yearsExperience: data.yearsExperience ?? null,
        seniorityLevel: data.seniorityLevel || null,
        employmentStatus: data.employmentStatus || existing.employmentStatus,
        employmentStartDate: data.employmentStartDate
          ? new Date(data.employmentStartDate)
          : existing.employmentStartDate,
        managerEngineerId: data.managerEngineerId ?? existing.managerEngineerId,
      },
    })

    const diff = createDiff(
      existing as unknown as Record<string, unknown>,
      engineer as unknown as Record<string, unknown>
    )

    await logActivity({
      entityType: 'Engineer',
      entityId: engineer.id,
      action: 'UPDATED',
      performedByUserId: session.user.id,
      diff: diff || undefined,
    })

    return NextResponse.json({ data: engineer })
  } catch (error) {
    console.error('Error updating engineer:', error)
    return NextResponse.json(
      { error: 'Failed to update engineer' },
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

    if (!hasPermission(session.user.role, 'candidates:delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existing = await prisma.engineer.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Engineer not found' }, { status: 404 })
    }

    await prisma.engineer.delete({
      where: { id: params.id },
    })

    await logActivity({
      entityType: 'Engineer',
      entityId: params.id,
      action: 'DELETED',
      performedByUserId: session.user.id,
    })

    return NextResponse.json({ message: 'Engineer deleted successfully' })
  } catch (error) {
    console.error('Error deleting engineer:', error)
    return NextResponse.json(
      { error: 'Failed to delete engineer' },
      { status: 500 }
    )
  }
}
