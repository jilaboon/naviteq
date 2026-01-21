import { Candidate, Project, Engineer, SeniorityLevel, EmploymentStatus, EngineerAssignment } from '@prisma/client'

// Legacy match result for backward compatibility
interface CandidateMatchResult {
  candidateId: string
  score: number
  reasons: string[]
}

// Engineer-specific match result
interface EngineerMatchResult {
  engineerId: string
  score: number
  reasons: string[]
}

// Unified match result for both candidates and engineers
interface UnifiedMatchResult {
  id: string
  talentType: 'CANDIDATE' | 'ENGINEER'
  candidateId?: string
  engineerId?: string
  fullName: string
  title: string | null
  technologies: string[]
  yearsExperience: number | null
  seniorityLevel: SeniorityLevel | null
  location: string | null
  employmentStatus?: EmploymentStatus
  score: number
  reasons: string[]
}

// Engineer with assignments for matching
interface EngineerWithAssignments extends Engineer {
  assignments?: EngineerAssignment[]
}

const seniorityOrder: Record<SeniorityLevel, number> = {
  JUNIOR: 1,
  MID: 2,
  SENIOR: 3,
  LEAD: 4,
}

// Availability boost for bench engineers
const availabilityBoost: Record<EmploymentStatus, number> = {
  BENCH: 15,       // Strong boost - immediately available
  ACTIVE: 10,      // Good - available
  ASSIGNED: 0,     // No boost - currently assigned
  ON_LEAVE: -5,    // Penalty - not available
  INACTIVE: -10,   // Strong penalty - not active
}

/**
 * Calculate match score for a Candidate against a Project
 * (Original function - kept for backward compatibility)
 */
export function calculateMatchScore(
  candidate: Candidate,
  project: Project
): CandidateMatchResult {
  let score = 0
  const reasons: string[] = []
  const maxScore = 100

  // 1. Technology overlap (40 points max)
  const projectTechs = project.technologies.map((t) => t.toLowerCase())
  const candidateTechs = candidate.technologies.map((t) => t.toLowerCase())
  const techOverlap = candidateTechs.filter((t) => projectTechs.includes(t))

  if (projectTechs.length > 0) {
    const techScore = Math.min(
      40,
      (techOverlap.length / projectTechs.length) * 40
    )
    score += techScore
    if (techOverlap.length > 0) {
      reasons.push(
        `Matches ${techOverlap.length}/${projectTechs.length} required technologies`
      )
    }
  }

  // 2. Must-have requirements (25 points max, penalty for missing)
  const mustHave = project.mustHave.map((m) => m.toLowerCase())
  if (mustHave.length > 0) {
    const candidateText = [
      candidate.resumeExtractedText || '',
      candidate.summaryPublic || '',
      candidate.summaryInternal || '',
      ...candidateTechs,
    ]
      .join(' ')
      .toLowerCase()

    const mustHaveMatches = mustHave.filter(
      (req) =>
        candidateText.includes(req) || candidateTechs.includes(req)
    )
    const mustHaveScore = (mustHaveMatches.length / mustHave.length) * 25
    score += mustHaveScore

    const missingMustHave = mustHave.filter(
      (req) =>
        !candidateText.includes(req) && !candidateTechs.includes(req)
    )

    if (mustHaveMatches.length === mustHave.length) {
      reasons.push('Has all must-have requirements')
    } else if (missingMustHave.length > 0) {
      reasons.push(
        `Missing must-have: ${missingMustHave.slice(0, 2).join(', ')}${missingMustHave.length > 2 ? '...' : ''}`
      )
    }
  } else {
    score += 25 // No must-haves = full points
  }

  // 3. Seniority alignment (15 points max)
  if (project.seniorityLevel && candidate.seniorityLevel) {
    const projectLevel = seniorityOrder[project.seniorityLevel]
    const candidateLevel = seniorityOrder[candidate.seniorityLevel]

    if (candidateLevel === projectLevel) {
      score += 15
      reasons.push(`Seniority level matches: ${candidate.seniorityLevel}`)
    } else if (candidateLevel > projectLevel) {
      score += 12 // Overqualified is still good
      reasons.push(`Seniority: ${candidate.seniorityLevel} (exceeds requirement)`)
    } else if (candidateLevel === projectLevel - 1) {
      score += 8 // One level below
      reasons.push(
        `Seniority: ${candidate.seniorityLevel} (below ${project.seniorityLevel} requirement)`
      )
    } else {
      score += 3 // Significantly under-qualified
    }
  } else {
    score += 10 // No seniority requirement = partial points
  }

  // 4. Years of experience (10 points max)
  if (project.yearsExperienceMin != null && candidate.yearsExperience != null) {
    if (candidate.yearsExperience >= project.yearsExperienceMin) {
      score += 10
      reasons.push(
        `Has ${candidate.yearsExperience}+ years experience (required: ${project.yearsExperienceMin}+)`
      )
    } else {
      const expRatio = candidate.yearsExperience / project.yearsExperienceMin
      score += Math.round(expRatio * 10)
      reasons.push(
        `Has ${candidate.yearsExperience} years experience (below ${project.yearsExperienceMin} required)`
      )
    }
  } else {
    score += 7 // No experience requirement
  }

  // 5. Nice-to-have bonus (10 points max)
  const niceToHave = project.niceToHave.map((n) => n.toLowerCase())
  if (niceToHave.length > 0) {
    const candidateText = [
      candidate.resumeExtractedText || '',
      candidate.summaryPublic || '',
      candidate.summaryInternal || '',
      ...candidateTechs,
    ]
      .join(' ')
      .toLowerCase()

    const niceToHaveMatches = niceToHave.filter(
      (req) =>
        candidateText.includes(req) || candidateTechs.includes(req)
    )

    const niceScore = Math.min(
      10,
      (niceToHaveMatches.length / niceToHave.length) * 10
    )
    score += niceScore

    if (niceToHaveMatches.length > 0) {
      reasons.push(
        `Has ${niceToHaveMatches.length} nice-to-have skills`
      )
    }
  }

  // Normalize score to 0-100
  const normalizedScore = Math.min(maxScore, Math.round(score))

  return {
    candidateId: candidate.id,
    score: normalizedScore,
    reasons: reasons.slice(0, 5), // Max 5 reasons
  }
}

/**
 * Calculate match score for an Engineer against a Project
 * Engineers get additional scoring based on availability and past assignments
 */
export function calculateEngineerMatchScore(
  engineer: EngineerWithAssignments,
  project: Project
): EngineerMatchResult {
  let score = 0
  const reasons: string[] = []
  const maxScore = 100

  // 1. Technology overlap (35 points max - slightly less than candidates because engineers are known quantities)
  const projectTechs = project.technologies.map((t) => t.toLowerCase())
  const engineerTechs = engineer.technologies.map((t) => t.toLowerCase())
  const techOverlap = engineerTechs.filter((t) => projectTechs.includes(t))

  if (projectTechs.length > 0) {
    const techScore = Math.min(
      35,
      (techOverlap.length / projectTechs.length) * 35
    )
    score += techScore
    if (techOverlap.length > 0) {
      reasons.push(
        `Matches ${techOverlap.length}/${projectTechs.length} required technologies`
      )
    }
  } else {
    score += 20 // No tech requirements = partial points
  }

  // 2. Must-have requirements (20 points max)
  const mustHave = project.mustHave.map((m) => m.toLowerCase())
  if (mustHave.length > 0) {
    const mustHaveMatches = mustHave.filter((req) => engineerTechs.includes(req))
    const mustHaveScore = (mustHaveMatches.length / mustHave.length) * 20
    score += mustHaveScore

    const missingMustHave = mustHave.filter((req) => !engineerTechs.includes(req))

    if (mustHaveMatches.length === mustHave.length) {
      reasons.push('Has all must-have requirements')
    } else if (missingMustHave.length > 0) {
      reasons.push(
        `Missing must-have: ${missingMustHave.slice(0, 2).join(', ')}${missingMustHave.length > 2 ? '...' : ''}`
      )
    }
  } else {
    score += 20 // No must-haves = full points
  }

  // 3. Seniority alignment (15 points max)
  if (project.seniorityLevel && engineer.seniorityLevel) {
    const projectLevel = seniorityOrder[project.seniorityLevel]
    const engineerLevel = seniorityOrder[engineer.seniorityLevel]

    if (engineerLevel === projectLevel) {
      score += 15
      reasons.push(`Seniority level matches: ${engineer.seniorityLevel}`)
    } else if (engineerLevel > projectLevel) {
      score += 12 // Overqualified is still good
      reasons.push(`Seniority: ${engineer.seniorityLevel} (exceeds requirement)`)
    } else if (engineerLevel === projectLevel - 1) {
      score += 8 // One level below
      reasons.push(
        `Seniority: ${engineer.seniorityLevel} (below ${project.seniorityLevel} requirement)`
      )
    } else {
      score += 3 // Significantly under-qualified
    }
  } else {
    score += 10 // No seniority requirement = partial points
  }

  // 4. Years of experience (10 points max)
  if (project.yearsExperienceMin != null && engineer.yearsExperience != null) {
    if (engineer.yearsExperience >= project.yearsExperienceMin) {
      score += 10
      reasons.push(
        `Has ${engineer.yearsExperience}+ years experience (required: ${project.yearsExperienceMin}+)`
      )
    } else {
      const expRatio = engineer.yearsExperience / project.yearsExperienceMin
      score += Math.round(expRatio * 10)
      reasons.push(
        `Has ${engineer.yearsExperience} years experience (below ${project.yearsExperienceMin} required)`
      )
    }
  } else {
    score += 7 // No experience requirement
  }

  // 5. Availability boost (15 points max - unique to engineers)
  const availBoost = availabilityBoost[engineer.employmentStatus]
  score += Math.max(0, availBoost) // Only add positive boost to base score

  if (engineer.employmentStatus === 'BENCH') {
    reasons.push('Currently on bench - immediately available')
  } else if (engineer.employmentStatus === 'ACTIVE') {
    reasons.push('Active employee - available for assignment')
  } else if (engineer.employmentStatus === 'ASSIGNED') {
    reasons.push('Currently assigned to another project')
  } else if (engineer.employmentStatus === 'ON_LEAVE') {
    reasons.push('Currently on leave')
  }

  // 6. Past assignment history bonus (5 points max)
  if (engineer.assignments && engineer.assignments.length > 0) {
    // Check if engineer worked with the same customer before
    const workedWithCustomer = engineer.assignments.some(
      (a) => a.customerId === project.customerId
    )
    if (workedWithCustomer) {
      score += 5
      reasons.push('Previously worked with this customer')
    }
  }

  // Normalize score to 0-100 and apply negative availability penalties
  let normalizedScore = Math.min(maxScore, Math.round(score))
  if (availBoost < 0) {
    normalizedScore = Math.max(0, normalizedScore + availBoost)
  }

  return {
    engineerId: engineer.id,
    score: normalizedScore,
    reasons: reasons.slice(0, 5), // Max 5 reasons
  }
}

/**
 * Rank candidates by match score (legacy function)
 */
export function rankCandidates(
  candidates: Candidate[],
  project: Project
): CandidateMatchResult[] {
  const results = candidates.map((candidate) =>
    calculateMatchScore(candidate, project)
  )

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score)
}

/**
 * Rank engineers by match score
 */
export function rankEngineers(
  engineers: EngineerWithAssignments[],
  project: Project
): EngineerMatchResult[] {
  const results = engineers.map((engineer) =>
    calculateEngineerMatchScore(engineer, project)
  )

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score)
}

/**
 * Unified matching function that combines candidates and engineers
 * Returns a unified list sorted by match score
 */
export function rankAllTalent(
  candidates: Candidate[],
  engineers: EngineerWithAssignments[],
  project: Project
): UnifiedMatchResult[] {
  const results: UnifiedMatchResult[] = []

  // Score candidates
  for (const candidate of candidates) {
    const matchResult = calculateMatchScore(candidate, project)
    results.push({
      id: candidate.id,
      talentType: 'CANDIDATE',
      candidateId: candidate.id,
      fullName: candidate.fullName,
      title: candidate.title,
      technologies: candidate.technologies,
      yearsExperience: candidate.yearsExperience,
      seniorityLevel: candidate.seniorityLevel,
      location: candidate.location,
      score: matchResult.score,
      reasons: matchResult.reasons,
    })
  }

  // Score engineers
  for (const engineer of engineers) {
    const matchResult = calculateEngineerMatchScore(engineer, project)
    results.push({
      id: engineer.id,
      talentType: 'ENGINEER',
      engineerId: engineer.id,
      fullName: engineer.fullName,
      title: engineer.title,
      technologies: engineer.technologies,
      yearsExperience: engineer.yearsExperience,
      seniorityLevel: engineer.seniorityLevel,
      location: engineer.location,
      employmentStatus: engineer.employmentStatus,
      score: matchResult.score,
      reasons: matchResult.reasons,
    })
  }

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score)
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-800'
  if (score >= 60) return 'bg-yellow-100 text-yellow-800'
  if (score >= 40) return 'bg-orange-100 text-orange-800'
  return 'bg-red-100 text-red-800'
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent Match'
  if (score >= 60) return 'Good Match'
  if (score >= 40) return 'Fair Match'
  return 'Low Match'
}

// Export types
export type { CandidateMatchResult, EngineerMatchResult, UnifiedMatchResult, EngineerWithAssignments }
