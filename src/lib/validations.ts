import { z } from 'zod'

// User validations
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const createUserSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['ADMIN', 'SALES', 'RECRUITER', 'CLIENT_MANAGER']),
})

export const updateUserSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .optional()
    .or(z.literal('')),
  role: z.enum(['ADMIN', 'SALES', 'RECRUITER', 'CLIENT_MANAGER']).optional(),
  isActive: z.boolean().optional(),
})

// Customer validations
export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  industry: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  description: z.string().optional(),
  contacts: z
    .array(
      z.object({
        name: z.string(),
        title: z.string().optional(),
        email: z.string().email().optional().or(z.literal('')),
        phone: z.string().optional(),
      })
    )
    .optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  ownerUserId: z.string().optional(),
})

// Project validations
export const projectSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  projectCategory: z.enum(['PIPELINE', 'DEVOPS', 'DEVELOPERS']).optional(),
  technologies: z.array(z.string()).optional(),
  mustHave: z.array(z.string()).optional(),
  niceToHave: z.array(z.string()).optional(),
  seniorityLevel: z.enum(['JUNIOR', 'MID', 'SENIOR', 'LEAD']).optional().nullable(),
  yearsExperienceMin: z.number().int().min(0).optional().nullable(),
  location: z.string().optional(),
  remotePolicy: z.enum(['ONSITE', 'HYBRID', 'REMOTE']).optional().nullable(),
  languageRequirements: z.array(z.string()).optional(),
  headcount: z.number().int().min(1).optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z
    .enum(['INITIAL', 'SOURCING', 'INTERVIEWS', 'CLOSED_WON', 'CLOSED_LOST'])
    .optional(),
  devOpsStatus: z.enum(['ACTIVE', 'AT_RISK', 'BLOCKED', 'COMPLETED']).optional().nullable(),
  assignedUserIds: z.array(z.string()).optional(),
})

// Candidate validations
export const candidateSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  location: z.string().optional(),
  title: z.string().optional(),
  summaryPublic: z.string().optional(),
  summaryInternal: z.string().optional(),
  technologies: z.array(z.string()).optional(),
  yearsExperience: z.number().int().min(0).optional().nullable(),
  seniorityLevel: z.enum(['JUNIOR', 'MID', 'SENIOR', 'LEAD']).optional().nullable(),
  languages: z.array(z.string()).optional(),
  availability: z.string().optional(),
  salaryExpectation: z.string().optional(),
  tags: z.array(z.string()).optional(),
  resumeExtractedText: z.string().optional(),
  resumeFileUrl: z.string().optional().nullable(),
  resumeOriginalName: z.string().optional().nullable(),
})

// Interview note validation
export const interviewNoteSchema = z.object({
  interviewerName: z.string().min(1, 'Interviewer name is required'),
  date: z.string(),
  notes: z.string().min(1, 'Notes are required'),
  score: z.number().int().min(1).max(5).optional(),
})

// Project candidate validations (legacy)
export const projectCandidateSchema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  candidateId: z.string().min(1, 'Candidate is required'),
  stage: z
    .enum([
      'SHORTLISTED',
      'CONTACTED',
      'SUBMITTED_TO_CLIENT',
      'INTERVIEWING',
      'REJECTED',
      'HIRED',
    ])
    .optional(),
  notes: z.string().optional(),
  clientFeedback: z.string().optional(),
  recruiterOwnerUserId: z.string().optional(),
})

export const updateProjectCandidateStageSchema = z.object({
  stage: z.enum([
    'SHORTLISTED',
    'CONTACTED',
    'SUBMITTED_TO_CLIENT',
    'INTERVIEWING',
    'REJECTED',
    'HIRED',
  ]),
})

// ============================================
// NEW: Engineer validations
// ============================================
export const engineerSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  location: z.string().optional(),
  title: z.string().optional(),
  technologies: z.array(z.string()).optional(),
  yearsExperience: z.number().int().min(0).optional().nullable(),
  seniorityLevel: z.enum(['JUNIOR', 'MID', 'SENIOR', 'LEAD']).optional().nullable(),
  employmentStatus: z.enum(['ACTIVE', 'BENCH', 'ASSIGNED', 'ON_LEAVE', 'INACTIVE']).optional(),
  employmentStartDate: z.string().optional().nullable(),
  managerEngineerId: z.string().optional().nullable(),
})

// Engineer assignment validations
export const engineerAssignmentSchema = z.object({
  engineerId: z.string().min(1, 'Engineer is required'),
  projectId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  roleTitle: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  notes: z.string().optional(),
})

// Engineer update validations
export const engineerUpdateSchema = z.object({
  engineerId: z.string().min(1, 'Engineer is required'),
  content: z.string().min(1, 'Content is required'),
  visibility: z.enum(['INTERNAL', 'MANAGER_ONLY']).optional(),
})

// ============================================
// NEW: Project Talent validations (unified)
// ============================================
export const projectTalentSchema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  talentType: z.enum(['CANDIDATE', 'ENGINEER']),
  candidateId: z.string().optional().nullable(),
  engineerId: z.string().optional().nullable(),
  stage: z
    .enum([
      'SHORTLISTED',
      'CONTACTED',
      'SUBMITTED_TO_CLIENT',
      'INTERVIEWING',
      'REJECTED',
      'HIRED',
      'ASSIGNED',
    ])
    .optional(),
  notes: z.string().optional(),
  clientFeedback: z.string().optional(),
  ownerUserId: z.string().optional(),
}).refine(
  (data) => {
    if (data.talentType === 'CANDIDATE' && !data.candidateId) return false
    if (data.talentType === 'ENGINEER' && !data.engineerId) return false
    return true
  },
  { message: 'Must provide candidateId for CANDIDATE or engineerId for ENGINEER' }
)

export const updateProjectTalentStageSchema = z.object({
  stage: z.enum([
    'SHORTLISTED',
    'CONTACTED',
    'SUBMITTED_TO_CLIENT',
    'INTERVIEWING',
    'REJECTED',
    'HIRED',
    'ASSIGNED',
  ]),
})

// Convert candidate to engineer validation
export const convertToEngineerSchema = z.object({
  employmentStartDate: z.string().optional(),
  employmentStatus: z.enum(['ACTIVE', 'BENCH', 'ASSIGNED', 'ON_LEAVE', 'INACTIVE']).optional(),
  managerEngineerId: z.string().optional().nullable(),
})

// Search validation
export const searchQuerySchema = z.object({
  q: z.string().min(2, 'Search query must be at least 2 characters'),
  limit: z.coerce.number().int().min(1).max(20).optional().default(5),
})

export type SearchQueryInput = z.infer<typeof searchQuerySchema>

// Project Update validation
export const projectUpdateSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  visibility: z.enum(['INTERNAL', 'CUSTOMER_FACING']).optional(),
  tags: z.array(z.string()).optional(),
  mentionedUserIds: z.array(z.string()).optional(),
})

export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>

// Type exports
export type LoginInput = z.infer<typeof loginSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type CustomerInput = z.infer<typeof customerSchema>
export type ProjectInput = z.infer<typeof projectSchema>
export type CandidateInput = z.infer<typeof candidateSchema>
export type InterviewNoteInput = z.infer<typeof interviewNoteSchema>
export type ProjectCandidateInput = z.infer<typeof projectCandidateSchema>
export type EngineerInput = z.infer<typeof engineerSchema>
export type EngineerAssignmentInput = z.infer<typeof engineerAssignmentSchema>
export type EngineerUpdateInput = z.infer<typeof engineerUpdateSchema>
export type ProjectTalentInput = z.infer<typeof projectTalentSchema>
export type ConvertToEngineerInput = z.infer<typeof convertToEngineerSchema>
