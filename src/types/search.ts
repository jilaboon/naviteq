import { Role, ProjectStatus, EmploymentStatus, SeniorityLevel } from '@prisma/client'

// Base search result interface
export interface BaseSearchResult {
  id: string
  type: SearchEntityType
}

// Entity types that can be searched
export type SearchEntityType = 'customer' | 'project' | 'candidate' | 'engineer' | 'user'

// Individual search result types
export interface CustomerSearchResult extends BaseSearchResult {
  type: 'customer'
  name: string
  industry: string | null
  description: string | null
}

export interface ProjectSearchResult extends BaseSearchResult {
  type: 'project'
  title: string
  status: ProjectStatus
  customer: {
    id: string
    name: string
  }
}

export interface CandidateSearchResult extends BaseSearchResult {
  type: 'candidate'
  fullName: string
  title: string | null
  technologies: string[]
  resumeMatch?: boolean // True if match came from resume text
}

export interface EngineerSearchResult extends BaseSearchResult {
  type: 'engineer'
  fullName: string
  title: string | null
  employmentStatus: EmploymentStatus
  technologies: string[]
}

export interface UserSearchResult extends BaseSearchResult {
  type: 'user'
  fullName: string
  email: string
  role: Role
}

// Union type for any search result
export type SearchResult =
  | CustomerSearchResult
  | ProjectSearchResult
  | CandidateSearchResult
  | EngineerSearchResult
  | UserSearchResult

// Categorized search results
export interface SearchResults {
  customers: CustomerSearchResult[]
  projects: ProjectSearchResult[]
  candidates: CandidateSearchResult[]
  engineers: EngineerSearchResult[]
  users: UserSearchResult[]
}

// Search API response
export interface SearchResponse {
  results: SearchResults
  meta: {
    totalCount: number
    queryTimeMs: number
  }
}

// Search parameters
export interface SearchParams {
  q: string
  limit?: number
}

// Entity display configuration for the command palette
export interface EntityDisplayConfig {
  icon: string
  label: string
  color: string
  route: (id: string) => string
}

export const entityDisplayConfig: Record<SearchEntityType, EntityDisplayConfig> = {
  customer: {
    icon: 'Building2',
    label: 'Customers',
    color: 'text-blue-600',
    route: (id) => `/customers/${id}`,
  },
  project: {
    icon: 'FolderKanban',
    label: 'Projects',
    color: 'text-purple-600',
    route: (id) => `/projects/${id}`,
  },
  candidate: {
    icon: 'UserSearch',
    label: 'Candidates',
    color: 'text-green-600',
    route: (id) => `/candidates/${id}`,
  },
  engineer: {
    icon: 'UserCog',
    label: 'Engineers',
    color: 'text-orange-600',
    route: (id) => `/engineers/${id}`,
  },
  user: {
    icon: 'User',
    label: 'Users',
    color: 'text-gray-600',
    route: (id) => `/users/${id}`,
  },
}
