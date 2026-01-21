import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { logActivity } from '@/lib/activity'
import { hasPermission } from '@/lib/permissions'

// POST /api/projects/[id]/convert
// Converts a Pipeline project to a DevOps project
export async function POST(
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

    const body = await request.json()
    const { createNew = false, newTitle } = body

    // Get the source pipeline project
    const sourceProject = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        assignedUsers: {
          include: { user: true },
        },
        projectCandidates: {
          where: { stage: 'HIRED' },
          include: {
            candidate: {
              include: { linkedEngineer: true },
            },
          },
        },
        projectTalents: {
          where: { stage: 'HIRED' },
          include: {
            engineer: true,
          },
        },
      },
    })

    if (!sourceProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (sourceProject.projectCategory !== 'PIPELINE') {
      return NextResponse.json(
        { error: 'Only Pipeline projects can be converted to DevOps' },
        { status: 400 }
      )
    }

    // Collect hired engineers from the pipeline
    const hiredEngineers: string[] = []

    // From projectCandidates (candidates who were hired and converted to engineers)
    for (const pc of sourceProject.projectCandidates) {
      if (pc.candidate.linkedEngineer) {
        hiredEngineers.push(pc.candidate.linkedEngineer.id)
      }
    }

    // From projectTalents (engineers who were hired/assigned)
    for (const pt of sourceProject.projectTalents) {
      if (pt.engineer && !hiredEngineers.includes(pt.engineer.id)) {
        hiredEngineers.push(pt.engineer.id)
      }
    }

    let devOpsProject

    if (createNew) {
      // Create a new DevOps project linked to the source pipeline project
      devOpsProject = await prisma.project.create({
        data: {
          customerId: sourceProject.customerId,
          title: newTitle || `${sourceProject.title} - Delivery`,
          description: sourceProject.description,
          projectCategory: 'DEVOPS',
          devOpsStatus: 'ACTIVE',
          technologies: sourceProject.technologies,
          priority: sourceProject.priority,
          sourcePipelineProjectId: sourceProject.id,
          assignedUsers: {
            create: sourceProject.assignedUsers.map((au) => ({
              userId: au.userId,
            })),
          },
          // Create engineer assignments for hired engineers
          engineerAssignments: hiredEngineers.length > 0
            ? {
                create: hiredEngineers.map((engineerId) => ({
                  engineerId,
                  customerId: sourceProject.customerId,
                  startDate: new Date(),
                  status: 'ACTIVE',
                })),
              }
            : undefined,
        },
        include: {
          customer: true,
          assignedUsers: {
            include: { user: true },
          },
          engineerAssignments: {
            include: { engineer: true },
          },
        },
      })

      // Update source project status to Closed Won
      await prisma.project.update({
        where: { id: sourceProject.id },
        data: { status: 'CLOSED_WON' },
      })

      await logActivity({
        entityType: 'Project',
        entityId: devOpsProject.id,
        action: 'CREATED',
        performedByUserId: session.user.id,
        diff: { convertedFrom: sourceProject.id },
      })

      await logActivity({
        entityType: 'Project',
        entityId: sourceProject.id,
        action: 'STAGE_CHANGED',
        performedByUserId: session.user.id,
        diff: {
          status: { old: sourceProject.status, new: 'CLOSED_WON' },
          convertedTo: devOpsProject.id,
        },
      })
    } else {
      // Convert the project in place (change category)
      devOpsProject = await prisma.project.update({
        where: { id: params.id },
        data: {
          projectCategory: 'DEVOPS',
          devOpsStatus: 'ACTIVE',
          status: 'CLOSED_WON', // Mark as won since we're converting
          // Create engineer assignments for hired engineers
          engineerAssignments: hiredEngineers.length > 0
            ? {
                create: hiredEngineers.map((engineerId) => ({
                  engineerId,
                  customerId: sourceProject.customerId,
                  startDate: new Date(),
                  status: 'ACTIVE',
                })),
              }
            : undefined,
        },
        include: {
          customer: true,
          assignedUsers: {
            include: { user: true },
          },
          engineerAssignments: {
            include: { engineer: true },
          },
        },
      })

      await logActivity({
        entityType: 'Project',
        entityId: devOpsProject.id,
        action: 'UPDATED',
        performedByUserId: session.user.id,
        diff: {
          projectCategory: { old: 'PIPELINE', new: 'DEVOPS' },
          message: 'Converted from Pipeline to DevOps',
        },
      })
    }

    return NextResponse.json({
      data: devOpsProject,
      message: createNew
        ? 'Created new DevOps project from Pipeline'
        : 'Converted Pipeline project to DevOps',
    })
  } catch (error) {
    console.error('Error converting project:', error)
    return NextResponse.json(
      { error: 'Failed to convert project' },
      { status: 500 }
    )
  }
}
