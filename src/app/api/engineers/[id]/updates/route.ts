import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { engineerUpdateSchema } from '@/lib/validations'
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const [updates, total] = await Promise.all([
      prisma.engineerUpdate.findMany({
        where: { engineerId: params.id },
        include: {
          author: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.engineerUpdate.count({ where: { engineerId: params.id } }),
    ])

    return NextResponse.json({
      data: updates,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Error fetching updates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch updates' },
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
    const validationResult = engineerUpdateSchema.safeParse({
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

    const update = await prisma.engineerUpdate.create({
      data: {
        engineerId: params.id,
        authorUserId: session.user.id,
        content: data.content,
        visibility: data.visibility || 'INTERNAL',
      },
      include: {
        author: { select: { id: true, fullName: true } },
      },
    })

    return NextResponse.json({ data: update }, { status: 201 })
  } catch (error) {
    console.error('Error creating update:', error)
    return NextResponse.json(
      { error: 'Failed to create update' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const updateId = searchParams.get('updateId')

    if (!updateId) {
      return NextResponse.json(
        { error: 'updateId query parameter required' },
        { status: 400 }
      )
    }

    const update = await prisma.engineerUpdate.findUnique({
      where: { id: updateId },
    })

    if (!update) {
      return NextResponse.json({ error: 'Update not found' }, { status: 404 })
    }

    // Only author or admin can delete
    if (update.authorUserId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.engineerUpdate.delete({
      where: { id: updateId },
    })

    return NextResponse.json({ message: 'Update deleted successfully' })
  } catch (error) {
    console.error('Error deleting update:', error)
    return NextResponse.json(
      { error: 'Failed to delete update' },
      { status: 500 }
    )
  }
}
