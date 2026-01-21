'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { ProjectUpdateWithRelations } from '@/types'
import { ProjectUpdateItem } from './project-update-item'
import { ProjectUpdateForm } from './project-update-form'

interface ProjectUpdatesTimelineProps {
  projectId: string
}

export function ProjectUpdatesTimeline({ projectId }: ProjectUpdatesTimelineProps) {
  const [updates, setUpdates] = useState<ProjectUpdateWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)

  const fetchUpdates = useCallback(async (pageNum: number, append = false) => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/projects/${projectId}/updates?page=${pageNum}&pageSize=10`)
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to fetch updates')
      }

      const data = await res.json()

      if (append) {
        setUpdates((prev) => [...prev, ...data.data])
      } else {
        setUpdates(data.data)
      }

      setTotal(data.total)
      setHasMore(pageNum < data.totalPages)
    } catch (err) {
      console.error('Error fetching updates:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch updates')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchUpdates(1)
  }, [fetchUpdates])

  const handleUpdateCreated = () => {
    // Refresh the list from the beginning
    setPage(1)
    fetchUpdates(1)
  }

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchUpdates(nextPage, true)
  }

  return (
    <div className="space-y-6">
      {/* Update Form */}
      <ProjectUpdateForm projectId={projectId} onSuccess={handleUpdateCreated} />

      {/* Updates List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-500">
            {total > 0 ? `${total} Update${total === 1 ? '' : 's'}` : 'No updates yet'}
          </h3>
        </div>

        {error ? (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        ) : loading && updates.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {updates.map((update) => (
                <ProjectUpdateItem key={update.id} update={update} />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
