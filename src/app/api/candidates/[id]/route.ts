import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { candidateSchema } from '@/lib/validations'
import { logActivity, createDiff } from '@/lib/activity'
import { hasPermission, canAccessFullCandidateInfo } from '@/lib/permissions'

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

    const canSeeFullInfo = canAccessFullCandidateInfo(session.user.role)

    // For client managers, check if they're assigned to any project this candidate is in
    if (session.user.role === 'CLIENT_MANAGER') {
      const candidateInAssignedProject = await prisma.projectCandidate.findFirst({
        where: {
          candidateId: params.id,
          project: {
            assignedUsers: {
              some: { userId: session.user.id },
            },
          },
        },
      })

      if (!candidateInAssignedProject) {
        // Return limited info only
        const candidate = await prisma.candidate.findUnique({
          where: { id: params.id },
          select: {
            id: true,
            fullName: true,
            location: true,
            title: true,
            summaryPublic: true,
            technologies: true,
            yearsExperience: true,
            seniorityLevel: true,
            tags: true,
          },
        })

        if (!candidate) {
          return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
        }

        return NextResponse.json({ data: candidate })
      }
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: params.id },
      include: {
        projectCandidates: canSeeFullInfo
          ? {
              include: {
                project: {
                  select: { id: true, title: true, status: true },
                },
                recruiterOwner: {
                  select: { id: true, fullName: true },
                },
              },
              orderBy: { createdAt: 'desc' },
            }
          : false,
      },
    })

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    // Filter out sensitive fields for non-full-access roles
    if (!canSeeFullInfo) {
      const {
        email,
        phone,
        summaryInternal,
        availability,
        salaryExpectation,
        resumeFileUrl,
        resumeOriginalName,
        resumeExtractedText,
        interviewNotes,
        ...publicData
      } = candidate
      return NextResponse.json({ data: publicData })
    }

    return NextResponse.json({ data: candidate })
  } catch (error) {
    console.error('Error fetching candidate:', error)
    return NextResponse.json(
      { error: 'Failed to fetch candidate' },
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

    const existing = await prisma.candidate.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    const body = await request.json()
    const validationResult = candidateSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    const candidate = await prisma.candidate.update({
      where: { id: params.id },
      data: {
        fullName: data.fullName,
        email: data.email || null,
        phone: data.phone || null,
        location: data.location || null,
        title: data.title || null,
        summaryPublic: data.summaryPublic || null,
        summaryInternal: data.summaryInternal || null,
        technologies: data.technologies || [],
        yearsExperience: data.yearsExperience ?? null,
        seniorityLevel: data.seniorityLevel || null,
        languages: data.languages || [],
        availability: data.availability || null,
        salaryExpectation: data.salaryExpectation || null,
        tags: data.tags || [],
        resumeExtractedText: data.resumeExtractedText || null,
        resumeFileUrl: data.resumeFileUrl || null,
        resumeOriginalName: data.resumeOriginalName || null,
        resumeUploadedAt: data.resumeFileUrl && !existing.resumeFileUrl ? new Date() : existing.resumeUploadedAt,
      },
    })

    const diff = createDiff(
      existing as unknown as Record<string, unknown>,
      candidate as unknown as Record<string, unknown>
    )

    await logActivity({
      entityType: 'Candidate',
      entityId: candidate.id,
      action: 'UPDATED',
      performedByUserId: session.user.id,
      diff: diff || undefined,
    })

    return NextResponse.json({ data: candidate })
  } catch (error) {
    console.error('Error updating candidate:', error)
    return NextResponse.json(
      { error: 'Failed to update candidate' },
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

    const existing = await prisma.candidate.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    await prisma.candidate.delete({
      where: { id: params.id },
    })

    await logActivity({
      entityType: 'Candidate',
      entityId: params.id,
      action: 'DELETED',
      performedByUserId: session.user.id,
    })

    return NextResponse.json({ message: 'Candidate deleted successfully' })
  } catch (error) {
    console.error('Error deleting candidate:', error)
    return NextResponse.json(
      { error: 'Failed to delete candidate' },
      { status: 500 }
    )
  }
}
