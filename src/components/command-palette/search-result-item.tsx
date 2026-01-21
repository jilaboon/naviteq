'use client'

import { forwardRef } from 'react'
import {
  Building2,
  FolderKanban,
  UserSearch,
  UserCog,
  User,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  SearchResult,
  CustomerSearchResult,
  ProjectSearchResult,
  CandidateSearchResult,
  EngineerSearchResult,
  UserSearchResult,
} from '@/types/search'
import {
  projectStatusLabels,
  projectStatusColors,
  employmentStatusLabels,
  employmentStatusColors,
} from '@/types'
import { roleDisplayNames } from '@/lib/permissions'

interface SearchResultItemProps {
  result: SearchResult
  isSelected: boolean
  onClick: () => void
}

const iconMap = {
  customer: Building2,
  project: FolderKanban,
  candidate: UserSearch,
  engineer: UserCog,
  user: User,
}

const typeColorMap = {
  customer: 'text-blue-600',
  project: 'text-purple-600',
  candidate: 'text-green-600',
  engineer: 'text-orange-600',
  user: 'text-gray-600',
}

export const SearchResultItem = forwardRef<HTMLButtonElement, SearchResultItemProps>(
  function SearchResultItem({ result, isSelected, onClick }, ref) {
    const Icon = iconMap[result.type]
    const iconColor = typeColorMap[result.type]

    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        className={cn(
          'relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors',
          isSelected
            ? 'bg-accent text-accent-foreground'
            : 'hover:bg-accent hover:text-accent-foreground'
        )}
      >
        <Icon className={cn('h-4 w-4 flex-shrink-0', iconColor)} />
        <div className="min-w-0 flex-1">
          {renderResultContent(result)}
        </div>
      </button>
    )
  }
)

function renderResultContent(result: SearchResult) {
  switch (result.type) {
    case 'customer':
      return <CustomerResultContent result={result} />
    case 'project':
      return <ProjectResultContent result={result} />
    case 'candidate':
      return <CandidateResultContent result={result} />
    case 'engineer':
      return <EngineerResultContent result={result} />
    case 'user':
      return <UserResultContent result={result} />
    default:
      return null
  }
}

function CustomerResultContent({ result }: { result: CustomerSearchResult }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="truncate">{result.name}</div>
        {result.industry && (
          <div className="truncate text-xs text-muted-foreground">{result.industry}</div>
        )}
      </div>
    </div>
  )
}

function ProjectResultContent({ result }: { result: ProjectSearchResult }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="truncate">{result.title}</div>
        <div className="truncate text-xs text-muted-foreground">{result.customer.name}</div>
      </div>
      <Badge className={cn('flex-shrink-0 text-[10px]', projectStatusColors[result.status])}>
        {projectStatusLabels[result.status]}
      </Badge>
    </div>
  )
}

function CandidateResultContent({ result }: { result: CandidateSearchResult }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="truncate">{result.fullName}</span>
          {result.resumeMatch && (
            <span title="Found in resume">
              <FileText className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
            </span>
          )}
        </div>
        {result.title && (
          <div className="truncate text-xs text-muted-foreground">{result.title}</div>
        )}
      </div>
      {result.technologies.length > 0 && (
        <div className="flex flex-shrink-0 gap-1">
          {result.technologies.slice(0, 2).map((tech) => (
            <Badge key={tech} variant="secondary" className="text-[10px] px-1.5 py-0">
              {tech}
            </Badge>
          ))}
          {result.technologies.length > 2 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              +{result.technologies.length - 2}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

function EngineerResultContent({ result }: { result: EngineerSearchResult }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="truncate">{result.fullName}</div>
        {result.title && (
          <div className="truncate text-xs text-muted-foreground">{result.title}</div>
        )}
      </div>
      <Badge className={cn('flex-shrink-0 text-[10px]', employmentStatusColors[result.employmentStatus])}>
        {employmentStatusLabels[result.employmentStatus]}
      </Badge>
    </div>
  )
}

function UserResultContent({ result }: { result: UserSearchResult }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="truncate">{result.fullName}</div>
        <div className="truncate text-xs text-muted-foreground">{result.email}</div>
      </div>
      <Badge variant="outline" className="flex-shrink-0 text-[10px]">
        {roleDisplayNames[result.role]}
      </Badge>
    </div>
  )
}
