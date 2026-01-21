'use client'

import { useEffect, useState } from 'react'
import { formatDateTime } from '@/lib/utils'
import { formatActionLabel } from '@/lib/activity'
import { ActivityAction } from '@prisma/client'

interface ActivityLog {
  id: string
  entityType: string
  entityId: string
  action: ActivityAction
  performedBy: { fullName: string; email: string } | null
  diff: Record<string, { old: unknown; new: unknown }> | null
  createdAt: string
}

interface ActivityListProps {
  entityType: string
  entityId: string
}

export function ActivityList({ entityType, entityId }: ActivityListProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(
          `/api/activity?entityType=${entityType}&entityId=${entityId}`
        )
        const data = await res.json()
        setLogs(data.data || [])
      } catch (error) {
        console.error('Error fetching activity logs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [entityType, entityId])

  if (loading) {
    return <div className="text-gray-500">Loading activity...</div>
  }

  if (logs.length === 0) {
    return <div className="text-gray-500">No activity recorded</div>
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div key={log.id} className="flex gap-3 border-b pb-3 last:border-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
            <span className="text-xs font-medium text-gray-600">
              {log.performedBy?.fullName?.charAt(0) || '?'}
            </span>
          </div>
          <div className="flex-1">
            <div className="text-sm">
              <span className="font-medium">
                {log.performedBy?.fullName || 'System'}
              </span>{' '}
              <span className="text-gray-600">
                {formatActionLabel(log.action).toLowerCase()}
              </span>
            </div>
            {log.diff && Object.keys(log.diff).length > 0 && (
              <div className="mt-1 text-xs text-gray-500">
                {Object.entries(log.diff).map(([key, value]) => (
                  <div key={key}>
                    <span className="font-medium">{key}:</span>{' '}
                    <span className="line-through">
                      {JSON.stringify(value.old)}
                    </span>{' '}
                    → {JSON.stringify(value.new)}
                  </div>
                ))}
              </div>
            )}
            <div className="mt-1 text-xs text-gray-400">
              {formatDateTime(log.createdAt)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
