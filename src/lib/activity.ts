import prisma from './prisma'
import { ActivityAction } from '@prisma/client'

interface LogActivityParams {
  entityType: 'Customer' | 'Project' | 'Candidate' | 'ProjectCandidate' | 'User' | 'Engineer' | 'EngineerAssignment' | 'EngineerUpdate' | 'ProjectTalent'
  entityId: string
  action: ActivityAction
  performedByUserId?: string
  diff?: Record<string, unknown>
}

export async function logActivity({
  entityType,
  entityId,
  action,
  performedByUserId,
  diff,
}: LogActivityParams) {
  try {
    await prisma.activityLog.create({
      data: {
        entityType,
        entityId,
        action,
        performedByUserId,
        diff: diff ? JSON.parse(JSON.stringify(diff)) : undefined,
      },
    })
  } catch (error) {
    console.error('Failed to log activity:', error)
    // Don't throw - activity logging shouldn't break main operations
  }
}

export function createDiff(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>
): Record<string, { old: unknown; new: unknown }> | null {
  const diff: Record<string, { old: unknown; new: unknown }> = {}
  let hasDiff = false

  for (const key of Object.keys(newData)) {
    // Skip internal fields
    if (['updatedAt', 'createdAt', 'id'].includes(key)) continue

    const oldValue = oldData[key]
    const newValue = newData[key]

    // Compare JSON stringified values for deep comparison
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      diff[key] = { old: oldValue, new: newValue }
      hasDiff = true
    }
  }

  return hasDiff ? diff : null
}

export function formatActionLabel(action: ActivityAction): string {
  const labels: Record<ActivityAction, string> = {
    CREATED: 'Created',
    UPDATED: 'Updated',
    DELETED: 'Deleted',
    STAGE_CHANGED: 'Stage Changed',
    UPLOADED_RESUME: 'Uploaded Resume',
    ASSIGNED: 'Assigned',
    UNASSIGNED: 'Unassigned',
    LOGIN: 'Logged In',
    CONVERTED: 'Converted to Engineer',
    UPDATE_ADDED: 'Added Update',
  }
  return labels[action] || action
}
