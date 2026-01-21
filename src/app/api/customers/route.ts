import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { customerSchema } from '@/lib/validations'
import { logActivity } from '@/lib/activity'
import { hasPermission } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'customers:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const industry = searchParams.get('industry') || ''
    const ownerUserId = searchParams.get('ownerUserId') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (industry) {
      where.industry = industry
    }

    if (ownerUserId) {
      where.ownerUserId = ownerUserId
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          owner: {
            select: { id: true, fullName: true, email: true },
          },
          _count: {
            select: { projects: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.customer.count({ where }),
    ])

    return NextResponse.json({
      data: customers,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
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

    if (!hasPermission(session.user.role, 'customers:write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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

    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        industry: data.industry || null,
        website: data.website || null,
        description: data.description || null,
        contacts: data.contacts || [],
        notes: data.notes || null,
        tags: data.tags || [],
        ownerUserId: data.ownerUserId || session.user.id,
      },
      include: {
        owner: {
          select: { id: true, fullName: true, email: true },
        },
      },
    })

    await logActivity({
      entityType: 'Customer',
      entityId: customer.id,
      action: 'CREATED',
      performedByUserId: session.user.id,
    })

    return NextResponse.json({ data: customer }, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}
