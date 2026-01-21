import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { convertToEngineerSchema } from '@/lib/validations'
import { logActivity } from '@/lib/activity'
import { hasPermission } from '@/lib/permissions'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only Admin and Recruiter can convert candidates to engineers
    if (!['ADMIN', 'RECRUITER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id: params.id },
      include: {
        linkedEngineer: true,
      },
    })

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    // Check if already converted
    if (candidate.linkedEngineer) {
      return NextResponse.json(
        { error: 'Candidate has already been converted to an engineer', engineerId: candidate.linkedEngineer.id },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validationResult = convertToEngineerSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Create engineer from candidate data
    const engineer = await prisma.engineer.create({
      data: {
        linkedCandidateId: candidate.id,
        fullName: candidate.fullName,
        email: candidate.email,
        phone: candidate.phone,
        location: candidate.location,
        title: candidate.title,
        technologies: candidate.technologies,
        yearsExperience: candidate.yearsExperience,
        seniorityLevel: candidate.seniorityLevel,
        employmentStatus: data.employmentStatus || 'ACTIVE',
        employmentStartDate: data.employmentStartDate
          ? new Date(data.employmentStartDate)
          : new Date(),
        managerEngineerId: data.managerEngineerId || null,
      },
    })

    // Log activity for both candidate and engineer
    await Promise.all([
      logActivity({
        entityType: 'Candidate',
        entityId: candidate.id,
        action: 'CONVERTED',
        performedByUserId: session.user.id,
        diff: { convertedToEngineerId: engineer.id },
      }),
      logActivity({
        entityType: 'Engineer',
        entityId: engineer.id,
        action: 'CREATED',
        performedByUserId: session.user.id,
        diff: { convertedFromCandidateId: candidate.id },
      }),
    ])

    return NextResponse.json({
      data: engineer,
      message: 'Candidate successfully converted to engineer',
    }, { status: 201 })
  } catch (error) {
    console.error('Error converting candidate to engineer:', error)
    return NextResponse.json(
      { error: 'Failed to convert candidate to engineer' },
      { status: 500 }
    )
  }
}
