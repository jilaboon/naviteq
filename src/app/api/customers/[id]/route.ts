import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { customerSchema } from '@/lib/validations'
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

    if (!hasPermission(session.user.role, 'customers:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        owner: {
          select: { id: true, fullName: true, email: true },
        },
        projects: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json({ data: customer })
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
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

    if (!hasPermission(session.user.role, 'customers:write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existing = await prisma.customer.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const body = await request.json()
    const validationResult = customerSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        name: data.name,
        industry: data.industry || null,
        website: data.website || null,
        description: data.description || null,
        contacts: data.contacts || [],
        notes: data.notes || null,
        tags: data.tags || [],
        ownerUserId: data.ownerUserId,
      },
      include: {
        owner: {
          select: { id: true, fullName: true, email: true },
        },
      },
    })

    const diff = createDiff(
      existing as unknown as Record<string, unknown>,
      customer as unknown as Record<string, unknown>
    )

    await logActivity({
      entityType: 'Customer',
      entityId: customer.id,
      action: 'UPDATED',
      performedByUserId: session.user.id,
      diff: diff || undefined,
    })

    return NextResponse.json({ data: customer })
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { error: 'Failed to update customer' },
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

    if (!hasPermission(session.user.role, 'customers:delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existing = await prisma.customer.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    await prisma.customer.delete({
      where: { id: params.id },
    })

    await logActivity({
      entityType: 'Customer',
      entityId: params.id,
      action: 'DELETED',
      performedByUserId: session.user.id,
    })

    return NextResponse.json({ message: 'Customer deleted successfully' })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    )
  }
}
