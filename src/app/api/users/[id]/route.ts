import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, hashPassword } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { updateUserSchema } from '@/lib/validations'
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

    // Users can view their own profile
    if (params.id !== session.user.id && !hasPermission(session.user.role, 'users:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ data: user })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
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

    // Users can update their own profile (limited fields), admins can update anyone
    const isSelf = params.id === session.user.id
    if (!isSelf && !hasPermission(session.user.role, 'users:write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existing = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const validationResult = updateUserSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Non-admins can only update their own name and password
    if (!hasPermission(session.user.role, 'users:write') && isSelf) {
      if (data.role || data.isActive !== undefined || data.email) {
        return NextResponse.json(
          { error: 'You can only update your name and password' },
          { status: 403 }
        )
      }
    }

    // Check if new email is already in use
    if (data.email && data.email !== existing.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      })
      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}

    if (data.fullName) updateData.fullName = data.fullName
    if (data.email) updateData.email = data.email
    if (data.role) updateData.role = data.role
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.password) {
      updateData.passwordHash = await hashPassword(data.password)
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    })

    await logActivity({
      entityType: 'User',
      entityId: user.id,
      action: 'UPDATED',
      performedByUserId: session.user.id,
    })

    return NextResponse.json({ data: user })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
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

    if (!hasPermission(session.user.role, 'users:delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Prevent self-deletion
    if (params.id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Soft delete - just deactivate
    await prisma.user.update({
      where: { id: params.id },
      data: { isActive: false },
    })

    await logActivity({
      entityType: 'User',
      entityId: params.id,
      action: 'DELETED',
      performedByUserId: session.user.id,
    })

    return NextResponse.json({ message: 'User deactivated successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
