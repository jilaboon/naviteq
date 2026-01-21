'use client'

import { formatDateTime, getInitials } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ProjectUpdateWithRelations, projectUpdateVisibilityLabels } from '@/types'

interface ProjectUpdateItemProps {
  update: ProjectUpdateWithRelations
}

export function ProjectUpdateItem({ update }: ProjectUpdateItemProps) {
  // Parse content to highlight mentions
  const renderContent = (content: string) => {
    // Simple @mention parsing - matches @username patterns
    const mentionRegex = /@(\w+)/g
    const parts = content.split(mentionRegex)

    return parts.map((part, index) => {
      // Every odd index is a username after @
      if (index % 2 === 1) {
        const mentionedUser = update.mentionedUsers?.find(
          (u) => u.fullName.toLowerCase().replace(/\s+/g, '') === part.toLowerCase() ||
                 u.email.split('@')[0].toLowerCase() === part.toLowerCase()
        )

        return (
          <span
            key={index}
            className="inline-flex items-center rounded bg-indigo-100 px-1 py-0.5 text-sm font-medium text-indigo-800"
          >
            @{mentionedUser?.fullName || part}
          </span>
        )
      }

      return <span key={index}>{part}</span>
    })
  }

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-start gap-3">
        {/* Author Avatar */}
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-indigo-600 text-white text-sm">
            {update.author ? getInitials(update.author.fullName) : '?'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-900">
                {update.author?.fullName || 'Unknown'}
              </span>
              <span className="text-sm text-gray-500">
                {formatDateTime(update.createdAt)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {update.visibility === 'CUSTOMER_FACING' && (
                <Badge variant="outline" className="text-xs">
                  {projectUpdateVisibilityLabels[update.visibility]}
                </Badge>
              )}
              {update.tags && update.tags.length > 0 && (
                <div className="flex gap-1">
                  {update.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="mt-2 text-gray-700 whitespace-pre-wrap">
            {renderContent(update.content)}
          </div>

          {/* Mentioned Users */}
          {update.mentionedUsers && update.mentionedUsers.length > 0 && (
            <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
              <span>Mentioned:</span>
              {update.mentionedUsers.map((user, index) => (
                <span key={user.id}>
                  {user.fullName}
                  {index < update.mentionedUsers!.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
