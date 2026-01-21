'use client'

import { useRef, useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { SearchResults as SearchResultsType, SearchResult, entityDisplayConfig } from '@/types/search'
import { SearchResultItem } from './search-result-item'

interface SearchResultsProps {
  results: SearchResultsType | null
  isLoading: boolean
  query: string
  selectedIndex: number
  onSelect: (result: SearchResult) => void
  onIndexChange: (index: number) => void
}

export function SearchResults({
  results,
  isLoading,
  query,
  selectedIndex,
  onSelect,
  onIndexChange,
}: SearchResultsProps) {
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Flatten results into a single array for navigation
  const flatResults = results ? flattenResults(results) : []
  const totalCount = flatResults.length

  // Scroll selected item into view
  useEffect(() => {
    const selectedItem = itemRefs.current[selectedIndex]
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedIndex])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (totalCount === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          onIndexChange((selectedIndex + 1) % totalCount)
          break
        case 'ArrowUp':
          e.preventDefault()
          onIndexChange((selectedIndex - 1 + totalCount) % totalCount)
          break
        case 'Enter':
          e.preventDefault()
          if (flatResults[selectedIndex]) {
            onSelect(flatResults[selectedIndex])
          }
          break
      }
    },
    [selectedIndex, totalCount, flatResults, onIndexChange, onSelect]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Reset selected index when results change
  useEffect(() => {
    onIndexChange(0)
  }, [results, onIndexChange])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
      </div>
    )
  }

  if (query.length < 2) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        Type at least 2 characters to search
      </div>
    )
  }

  if (!results || totalCount === 0) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        No results found for &quot;{query}&quot;
      </div>
    )
  }

  let globalIndex = 0

  return (
    <div className="max-h-[300px] overflow-y-auto overflow-x-hidden">
      {/* Customers */}
      {results.customers.length > 0 && (
        <ResultSection
          title={entityDisplayConfig.customer.label}
          results={results.customers}
          globalStartIndex={globalIndex}
          selectedIndex={selectedIndex}
          itemRefs={itemRefs}
          onSelect={onSelect}
        />
      )}
      {(globalIndex += results.customers.length) && null}

      {/* Projects */}
      {results.projects.length > 0 && (
        <ResultSection
          title={entityDisplayConfig.project.label}
          results={results.projects}
          globalStartIndex={globalIndex}
          selectedIndex={selectedIndex}
          itemRefs={itemRefs}
          onSelect={onSelect}
        />
      )}
      {(globalIndex += results.projects.length) && null}

      {/* Candidates */}
      {results.candidates.length > 0 && (
        <ResultSection
          title={entityDisplayConfig.candidate.label}
          results={results.candidates}
          globalStartIndex={globalIndex}
          selectedIndex={selectedIndex}
          itemRefs={itemRefs}
          onSelect={onSelect}
        />
      )}
      {(globalIndex += results.candidates.length) && null}

      {/* Engineers */}
      {results.engineers.length > 0 && (
        <ResultSection
          title={entityDisplayConfig.engineer.label}
          results={results.engineers}
          globalStartIndex={globalIndex}
          selectedIndex={selectedIndex}
          itemRefs={itemRefs}
          onSelect={onSelect}
        />
      )}
      {(globalIndex += results.engineers.length) && null}

      {/* Users */}
      {results.users.length > 0 && (
        <ResultSection
          title={entityDisplayConfig.user.label}
          results={results.users}
          globalStartIndex={globalIndex}
          selectedIndex={selectedIndex}
          itemRefs={itemRefs}
          onSelect={onSelect}
        />
      )}
    </div>
  )
}

interface ResultSectionProps {
  title: string
  results: SearchResult[]
  globalStartIndex: number
  selectedIndex: number
  itemRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>
  onSelect: (result: SearchResult) => void
}

function ResultSection({
  title,
  results,
  globalStartIndex,
  selectedIndex,
  itemRefs,
  onSelect,
}: ResultSectionProps) {
  return (
    <div className="px-1 py-1">
      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
        {title}
      </div>
      <div className="space-y-0.5">
        {results.map((result, index) => {
          const globalIdx = globalStartIndex + index
          return (
            <SearchResultItem
              key={`${result.type}-${result.id}`}
              ref={(el) => {
                itemRefs.current[globalIdx] = el
              }}
              result={result}
              isSelected={globalIdx === selectedIndex}
              onClick={() => onSelect(result)}
            />
          )
        })}
      </div>
    </div>
  )
}

function flattenResults(results: SearchResultsType): SearchResult[] {
  return [
    ...results.customers,
    ...results.projects,
    ...results.candidates,
    ...results.engineers,
    ...results.users,
  ]
}
