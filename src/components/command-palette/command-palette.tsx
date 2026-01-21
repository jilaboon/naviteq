'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'
import { useCommandPalette } from './command-palette-context'
import { SearchResults } from './search-results'
import { SearchResults as SearchResultsType, SearchResult, entityDisplayConfig } from '@/types/search'

const DEBOUNCE_MS = 300

export function CommandPalette() {
  const { isOpen, close } = useCommandPalette()
  const router = useRouter()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResultsType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure dialog is rendered
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }
  }, [isOpen])

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setResults(null)
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults(null)
      return
    }

    const timeoutId = setTimeout(async () => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()
      setIsLoading(true)

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&limit=5`,
          { signal: abortControllerRef.current.signal }
        )

        if (!response.ok) {
          throw new Error('Search failed')
        }

        const data = await response.json()
        setResults(data.results)
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Search error:', error)
          setResults(null)
        }
      } finally {
        setIsLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [query])

  // Handle result selection
  const handleSelect = useCallback(
    (result: SearchResult) => {
      const route = entityDisplayConfig[result.type].route(result.id)
      close()
      router.push(route)
    },
    [close, router]
  )

  // Handle index change from keyboard navigation
  const handleIndexChange = useCallback((index: number) => {
    setSelectedIndex(index)
  }, [])

  // Keyboard shortcuts for closing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, close])

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-[50%] top-[15%] z-50 w-full max-w-lg translate-x-[-50%] overflow-hidden rounded-md border bg-background shadow-lg',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
            'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
            'duration-200'
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            Search
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Search across customers, projects, candidates, engineers, and users
          </DialogPrimitive.Description>

          {/* Search Input */}
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customers, projects, candidates..."
              className="flex h-11 w-full bg-transparent py-3 px-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <SearchResults
            results={results}
            isLoading={isLoading}
            query={query}
            selectedIndex={selectedIndex}
            onSelect={handleSelect}
            onIndexChange={handleIndexChange}
          />

          {/* Footer */}
          <div className="flex items-center justify-between border-t px-3 py-2">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center rounded border bg-muted px-1 font-mono text-[10px] font-medium">↑</kbd>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center rounded border bg-muted px-1 font-mono text-[10px] font-medium">↓</kbd>
                <span className="text-muted-foreground">navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">↵</kbd>
                <span className="text-muted-foreground">select</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">esc</kbd>
                <span className="text-muted-foreground">close</span>
              </span>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
