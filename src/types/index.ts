import {
  User,
  Customer,
  Project,
  Candidate,
  ProjectCandidate,
  ActivityLog,
  Role,
  ProjectCategory,
  ProjectStatus,
  DevOpsStatus,
  ProjectPriority,
  SeniorityLevel,
  RemotePolicy,
  CandidateStage,
  ActivityAction,
  // New types
  Engineer,
  EngineerAssignment,
  EngineerUpdate,
  ProjectTalent,
  ProjectUpdate,
  Notification,
  EmploymentStatus,
  AssignmentStatus,
  TalentType,
  TalentStage,
  UpdateVisibility,
  ProjectUpdateVisibility,
} from '@prisma/client'

// Re-export Prisma types
export {
  Role,
  ProjectCategory,
  ProjectStatus,
  DevOpsStatus,
  ProjectPriority,
  SeniorityLevel,
  RemotePolicy,
  CandidateStage,
  ActivityAction,
  // New enums
  EmploymentStatus,
  AssignmentStatus,
  TalentType,
  TalentStage,
  UpdateVisibility,
  ProjectUpdateVisibility,
}

// Extended types with relations
export interface CustomerWithRelations extends Customer {
  owner?: User | null
  projects?: Project[]
  _count?: {
    projects: number
  }
}

export interface ProjectWithRelations extends Project {
  customer: Customer
  assignedUsers?: Array<{
    id: string
    user: User
  }>
  projectCandidates?: ProjectCandidateWithRelations[]
  projectTalents?: ProjectTalentWithRelations[]
  updates?: ProjectUpdateWithRelations[]
  _count?: {
    projectCandidates: number
    projectTalents: number
    updates: number
  }
}

export interface CandidateWithRelations extends Candidate {
  projectCandidates?: ProjectCandidateWithRelations[]
  projectTalents?: ProjectTalentWithRelations[]
  linkedEngineer?: Engineer | null
  _count?: {
    projectCandidates: number
    projectTalents: number
  }
}

export interface ProjectCandidateWithRelations extends ProjectCandidate {
  project?: Project
  candidate?: Candidate
  recruiterOwner?: User | null
}

export interface ActivityLogWithRelations extends ActivityLog {
  performedBy?: User | null
}

// ============================================
// NEW: Engineer types
// ============================================
export interface EngineerWithRelations extends Engineer {
  linkedCandidate?: Candidate | null
  manager?: Engineer | null
  directReports?: Engineer[]
  assignments?: EngineerAssignmentWithRelations[]
  updates?: EngineerUpdateWithRelations[]
  projectTalents?: ProjectTalentWithRelations[]
  _count?: {
    assignments: number
    updates: number
    projectTalents: number
  }
}

export interface EngineerAssignmentWithRelations extends EngineerAssignment {
  engineer?: Engineer
  project?: Project | null
  customer?: Customer | null
}

export interface EngineerUpdateWithRelations extends EngineerUpdate {
  engineer?: Engineer
  author?: User
}

export interface ProjectTalentWithRelations extends ProjectTalent {
  project?: Project
  candidate?: Candidate | null
  engineer?: Engineer | null
  owner?: User | null
}

// ============================================
// NEW: Project Update types
// ============================================
export interface ProjectUpdateWithRelations extends ProjectUpdate {
  project?: Project
  author?: User
  mentionedUsers?: User[]
}

export interface NotificationWithRelations extends Notification {
  projectUpdate?: ProjectUpdateWithRelations | null
}

// Contact type (stored as JSON in Customer)
export interface Contact {
  name: string
  title?: string
  email?: string
  phone?: string
}

// Interview note type (stored as JSON in Candidate)
export interface InterviewNote {
  interviewerName: string
  date: string
  notes: string
  score?: number
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Match result type (updated to support both candidates and engineers)
export interface MatchResult {
  id: string
  talentType: 'CANDIDATE' | 'ENGINEER'
  candidateId?: string
  engineerId?: string
  score: number
  reasons: string[]
}

// Legacy match result for backward compatibility
export interface CandidateMatchResult {
  candidateId: string
  score: number
  reasons: string[]
}

// Filter types
export interface CustomerFilters {
  search?: string
  industry?: string
  ownerUserId?: string
  tags?: string[]
}

export interface ProjectFilters {
  search?: string
  customerId?: string
  status?: ProjectStatus
  priority?: ProjectPriority
  assignedUserId?: string
}

export interface CandidateFilters {
  search?: string
  technologies?: string[]
  seniorityLevel?: SeniorityLevel
  minYearsExperience?: number
  maxYearsExperience?: number
  location?: string
  tags?: string[]
}

export interface EngineerFilters {
  search?: string
  technologies?: string[]
  seniorityLevel?: SeniorityLevel
  employmentStatus?: EmploymentStatus
  minYearsExperience?: number
  maxYearsExperience?: number
  location?: string
}

// Display label mappings
export const projectStatusLabels: Record<ProjectStatus, string> = {
  INITIAL: 'Initial',
  SOURCING: 'Sourcing',
  INTERVIEWS: 'Interviews',
  CLOSED_WON: 'Closed Won',
  CLOSED_LOST: 'Closed Lost',
}

export const projectStatusColors: Record<ProjectStatus, string> = {
  INITIAL: 'bg-gray-100 text-gray-800',
  SOURCING: 'bg-blue-100 text-blue-800',
  INTERVIEWS: 'bg-yellow-100 text-yellow-800',
  CLOSED_WON: 'bg-green-100 text-green-800',
  CLOSED_LOST: 'bg-red-100 text-red-800',
}

export const priorityLabels: Record<ProjectPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
}

export const priorityColors: Record<ProjectPriority, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
}

export const seniorityLabels: Record<SeniorityLevel, string> = {
  JUNIOR: 'Junior',
  MID: 'Mid',
  SENIOR: 'Senior',
  LEAD: 'Lead',
}

export const remotePolicyLabels: Record<RemotePolicy, string> = {
  ONSITE: 'On-site',
  HYBRID: 'Hybrid',
  REMOTE: 'Remote',
}

export const candidateStageLabels: Record<CandidateStage, string> = {
  SHORTLISTED: 'Shortlisted',
  CONTACTED: 'Contacted',
  SUBMITTED_TO_CLIENT: 'Submitted to Client',
  INTERVIEWING: 'Interviewing',
  REJECTED: 'Rejected',
  HIRED: 'Hired',
}

export const candidateStageColors: Record<CandidateStage, string> = {
  SHORTLISTED: 'bg-gray-100 text-gray-800',
  CONTACTED: 'bg-blue-100 text-blue-800',
  SUBMITTED_TO_CLIENT: 'bg-purple-100 text-purple-800',
  INTERVIEWING: 'bg-yellow-100 text-yellow-800',
  REJECTED: 'bg-red-100 text-red-800',
  HIRED: 'bg-green-100 text-green-800',
}

// ============================================
// NEW: Engineer labels and colors
// ============================================
export const employmentStatusLabels: Record<EmploymentStatus, string> = {
  ACTIVE: 'Active',
  BENCH: 'Bench',
  ASSIGNED: 'Assigned',
  ON_LEAVE: 'On Leave',
  INACTIVE: 'Inactive',
}

export const employmentStatusColors: Record<EmploymentStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  BENCH: 'bg-yellow-100 text-yellow-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  ON_LEAVE: 'bg-orange-100 text-orange-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
}

export const assignmentStatusLabels: Record<AssignmentStatus, string> = {
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export const assignmentStatusColors: Record<AssignmentStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export const talentTypeLabels: Record<TalentType, string> = {
  CANDIDATE: 'Candidate',
  ENGINEER: 'Engineer',
}

export const talentTypeColors: Record<TalentType, string> = {
  CANDIDATE: 'bg-purple-100 text-purple-800',
  ENGINEER: 'bg-teal-100 text-teal-800',
}

export const talentStageLabels: Record<TalentStage, string> = {
  SHORTLISTED: 'Shortlisted',
  CONTACTED: 'Contacted',
  SUBMITTED_TO_CLIENT: 'Submitted to Client',
  INTERVIEWING: 'Interviewing',
  REJECTED: 'Rejected',
  HIRED: 'Hired',
  ASSIGNED: 'Assigned',
}

export const talentStageColors: Record<TalentStage, string> = {
  SHORTLISTED: 'bg-gray-100 text-gray-800',
  CONTACTED: 'bg-blue-100 text-blue-800',
  SUBMITTED_TO_CLIENT: 'bg-purple-100 text-purple-800',
  INTERVIEWING: 'bg-yellow-100 text-yellow-800',
  REJECTED: 'bg-red-100 text-red-800',
  HIRED: 'bg-green-100 text-green-800',
  ASSIGNED: 'bg-teal-100 text-teal-800',
}

export const updateVisibilityLabels: Record<UpdateVisibility, string> = {
  INTERNAL: 'Internal',
  MANAGER_ONLY: 'Manager Only',
}

// ============================================
// NEW: Project Category labels and colors
// ============================================
export const projectCategoryLabels: Record<ProjectCategory, string> = {
  PIPELINE: 'Pipeline',
  DEVOPS: 'DevOps',
  DEVELOPERS: 'Developers',
}

export const projectCategoryColors: Record<ProjectCategory, string> = {
  PIPELINE: 'bg-purple-100 text-purple-800',
  DEVOPS: 'bg-teal-100 text-teal-800',
  DEVELOPERS: 'bg-indigo-100 text-indigo-800',
}

export const devOpsStatusLabels: Record<DevOpsStatus, string> = {
  ACTIVE: 'Active',
  AT_RISK: 'At Risk',
  BLOCKED: 'Blocked',
  COMPLETED: 'Completed',
}

export const devOpsStatusColors: Record<DevOpsStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  AT_RISK: 'bg-orange-100 text-orange-800',
  BLOCKED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
}

export const projectUpdateVisibilityLabels: Record<ProjectUpdateVisibility, string> = {
  INTERNAL: 'Internal',
  CUSTOMER_FACING: 'Customer Facing',
}
