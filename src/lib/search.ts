import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import {
  CustomerSearchResult,
  ProjectSearchResult,
  CandidateSearchResult,
  EngineerSearchResult,
  UserSearchResult,
} from '@/types/search'

/**
 * Search customers by name or description using ILIKE
 */
export async function searchCustomers(
  query: string,
  limit: number
): Promise<CustomerSearchResult[]> {
  const customers = await prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      industry: true,
      description: true,
    },
    take: limit,
    orderBy: { updatedAt: 'desc' },
  })

  return customers.map((c) => ({
    id: c.id,
    type: 'customer' as const,
    name: c.name,
    industry: c.industry,
    description: c.description,
  }))
}

/**
 * Search projects by title or description using ILIKE
 */
export async function searchProjects(
  query: string,
  limit: number
): Promise<ProjectSearchResult[]> {
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      title: true,
      status: true,
      customer: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    take: limit,
    orderBy: { updatedAt: 'desc' },
  })

  return projects.map((p) => ({
    id: p.id,
    type: 'project' as const,
    title: p.title,
    status: p.status,
    customer: p.customer,
  }))
}

/**
 * Search candidates using PostgreSQL full-text search for resume content
 * Falls back to ILIKE for name/title/technologies if no full-text matches
 */
export async function searchCandidates(
  query: string,
  limit: number
): Promise<CandidateSearchResult[]> {
  // First, try full-text search on the resume content
  // This will work after the migration adds the resume_search_vector column
  // For now, use a simpler approach that works with the current schema
  try {
    // Try full-text search with tsvector (if column exists)
    const fullTextResults = await prisma.$queryRaw<
      Array<{
        id: string
        fullName: string
        title: string | null
        technologies: string[]
        rank: number
      }>
    >`
      SELECT
        id,
        "fullName",
        title,
        technologies,
        ts_rank(resume_search_vector, websearch_to_tsquery('english', ${query})) as rank
      FROM candidates
      WHERE resume_search_vector @@ websearch_to_tsquery('english', ${query})
      ORDER BY rank DESC
      LIMIT ${limit}
    `

    if (fullTextResults.length > 0) {
      return fullTextResults.map((c) => ({
        id: c.id,
        type: 'candidate' as const,
        fullName: c.fullName,
        title: c.title,
        technologies: c.technologies || [],
        resumeMatch: true,
      }))
    }
  } catch {
    // Full-text column doesn't exist yet - fall through to ILIKE search
  }

  // Fall back to ILIKE search
  const candidates = await prisma.candidate.findMany({
    where: {
      OR: [
        { fullName: { contains: query, mode: 'insensitive' } },
        { title: { contains: query, mode: 'insensitive' } },
        { technologies: { hasSome: [query] } },
        { summaryPublic: { contains: query, mode: 'insensitive' } },
        { resumeExtractedText: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      fullName: true,
      title: true,
      technologies: true,
      resumeExtractedText: true,
    },
    take: limit,
    orderBy: { updatedAt: 'desc' },
  })

  return candidates.map((c) => ({
    id: c.id,
    type: 'candidate' as const,
    fullName: c.fullName,
    title: c.title,
    technologies: c.technologies || [],
    resumeMatch: c.resumeExtractedText?.toLowerCase().includes(query.toLowerCase()) || false,
  }))
}

/**
 * Search engineers by name, title, or technologies
 */
export async function searchEngineers(
  query: string,
  limit: number
): Promise<EngineerSearchResult[]> {
  const engineers = await prisma.engineer.findMany({
    where: {
      OR: [
        { fullName: { contains: query, mode: 'insensitive' } },
        { title: { contains: query, mode: 'insensitive' } },
        { technologies: { hasSome: [query] } },
      ],
    },
    select: {
      id: true,
      fullName: true,
      title: true,
      employmentStatus: true,
      technologies: true,
    },
    take: limit,
    orderBy: { updatedAt: 'desc' },
  })

  return engineers.map((e) => ({
    id: e.id,
    type: 'engineer' as const,
    fullName: e.fullName,
    title: e.title,
    employmentStatus: e.employmentStatus,
    technologies: e.technologies || [],
  }))
}

/**
 * Search users by name or email
 */
export async function searchUsers(
  query: string,
  limit: number
): Promise<UserSearchResult[]> {
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      OR: [
        { fullName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
    },
    take: limit,
    orderBy: { fullName: 'asc' },
  })

  return users.map((u) => ({
    id: u.id,
    type: 'user' as const,
    fullName: u.fullName,
    email: u.email,
    role: u.role,
  }))
}
