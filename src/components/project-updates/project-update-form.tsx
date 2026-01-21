'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2, AtSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface User {
  id: string
  fullName: string
  email: string
}

interface ProjectUpdateFormProps {
  projectId: string
  onSuccess: () => void
}

export function ProjectUpdateForm({ projectId, onSuccess }: ProjectUpdateFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([])
  const [cursorPosition, setCursorPosition] = useState(0)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mentionListRef = useRef<HTMLDivElement>(null)

  // Fetch users for mentions
  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/users?pageSize=100')
        if (res.ok) {
          const data = await res.json()
          setUsers(data.data || [])
        }
      } catch (error) {
        console.error('Error fetching users:', error)
      }
    }
    fetchUsers()
  }, [])

  // Filter users based on mention search
  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(mentionSearch.toLowerCase()) ||
      user.email.toLowerCase().includes(mentionSearch.toLowerCase())
  )

  // Handle text change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const position = e.target.selectionStart

    setContent(value)
    setCursorPosition(position)

    // Check if we're typing a mention
    const textBeforeCursor = value.slice(0, position)
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@')

    if (lastAtSymbol !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtSymbol + 1)
      // Only show mentions if there's no space after @
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionSearch(textAfterAt)
        setShowMentions(true)
        return
      }
    }

    setShowMentions(false)
  }

  // Insert mention
  const insertMention = useCallback((user: User) => {
    const textBeforeCursor = content.slice(0, cursorPosition)
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@')
    const textAfterCursor = content.slice(cursorPosition)

    const mentionText = `@${user.fullName.replace(/\s+/g, '')} `
    const newContent =
      content.slice(0, lastAtSymbol) + mentionText + textAfterCursor

    setContent(newContent)
    setShowMentions(false)
    setMentionSearch('')

    // Add user to mentioned list if not already there
    if (!mentionedUserIds.includes(user.id)) {
      setMentionedUserIds((prev) => [...prev, user.id])
    }

    // Focus back on textarea
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 0)
  }, [content, cursorPosition, mentionedUserIds])

  // Handle keyboard navigation in mention list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions && filteredUsers.length > 0) {
      if (e.key === 'Escape') {
        setShowMentions(false)
        e.preventDefault()
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        insertMention(filteredUsers[0])
        e.preventDefault()
      }
    }
  }

  // Submit update
  const handleSubmit = async () => {
    if (!content.trim()) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          mentionedUserIds,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create update')
      }

      setContent('')
      setMentionedUserIds([])
      onSuccess()
    } catch (err) {
      console.error('Error creating update:', err)
      setError(err instanceof Error ? err.message : 'Failed to create update')
    } finally {
      setLoading(false)
    }
  }

  // Close mentions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        mentionListRef.current &&
        !mentionListRef.current.contains(e.target as Node)
      ) {
        setShowMentions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Write an update... Use @ to mention someone"
          className="min-h-[100px] resize-none pr-20"
          disabled={loading}
        />

        {/* Mention Dropdown */}
        {showMentions && filteredUsers.length > 0 && (
          <div
            ref={mentionListRef}
            className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-md border bg-white shadow-lg"
          >
            {filteredUsers.slice(0, 8).map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => insertMention(user)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100"
              >
                <AtSign className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="font-medium">{user.fullName}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="absolute bottom-3 right-3">
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={loading || !content.trim()}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
      {mentionedUserIds.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          Will notify: {mentionedUserIds.length} user(s)
        </div>
      )}
    </div>
  )
}
