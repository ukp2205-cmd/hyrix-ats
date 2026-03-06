'use server'

/**
 * Centralized Candidate Scoring Algorithm
 * 
 * Evaluates candidates on a 0-10 scale based on multiple weighted factors:
 * - Skills Match: 40%
 * - Experience Level: 25%
 * - Location Match: 10%
 * - Salary Expectation: 15%
 * - Notice Period: 10%
 */

interface Job {
  id: string
  title: string
  location?: string
  requirements?: string
  description?: string
  salary_range?: string
}

interface Candidate {
  id: string
  name: string
  email: string
  skills?: string
  years_of_experience?: number
  current_location?: string
  preferred_location?: string
  current_ctc?: string
  expected_ctc?: string
  notice_period?: string
}

interface ScoringResult {
  totalScore: number
  breakdown: {
    skillsScore: number
    experienceScore: number
    locationScore: number
    salaryScore: number
    noticePeriodScore: number
  }
  details: {
    matchedSkills: string[]
    totalSkillsRequired: number
    experienceMatch: string
    locationMatch: string
    salaryMatch: string
    availabilityMatch: string
  }
}

/**
 * Extract skills from text (requirements, description, or skills field)
 */
function extractSkills(text: string): string[] {
  if (!text) return []
  
  // Common technical skills and keywords
  const skillPatterns = [
    /\b(javascript|typescript|react|node\.?js|python|java|c\+\+|ruby|php|swift|kotlin)\b/gi,
    /\b(html|css|sql|mongodb|postgresql|mysql|redis|graphql)\b/gi,
    /\b(aws|azure|gcp|docker|kubernetes|jenkins|git|ci\/cd)\b/gi,
    /\b(api|rest|microservices|agile|scrum|devops)\b/gi,
    /\b(technical support|help desk|troubleshooting|networking|firewall)\b/gi,
    /\b(customer service|communication|problem solving|team work)\b/gi,
  ]
  
  const skills = new Set<string>()
  
  skillPatterns.forEach(pattern => {
    const matches = text.match(pattern)
    if (matches) {
      matches.forEach(match => skills.add(match.toLowerCase()))
    }
  })
  
  // Also split by commas and extract individual skills
  const commaSeparated = text.split(/[,;]/).map(s => s.trim().toLowerCase())
  commaSeparated.forEach(skill => {
    if (skill.length > 2 && skill.length < 30) {
      skills.add(skill)
    }
  })
  
  return Array.from(skills)
}

/**
 * Calculate skills match score (0-10)
 * Weight: 40% of total score
 */
function calculateSkillsScore(candidateSkills: string, jobRequirements: string, jobDescription: string): {
  score: number
  matched: string[]
  total: number
} {
  const requiredSkills = extractSkills(`${jobRequirements} ${jobDescription}`)
  const candidateSkillsList = extractSkills(candidateSkills)
  
  if (requiredSkills.length === 0) {
    return { score: 7.0, matched: [], total: 0 } // Default score if no requirements specified
  }
  
  const matchedSkills = candidateSkillsList.filter(skill => 
    requiredSkills.some(req => 
      req.includes(skill) || skill.includes(req)
    )
  )
  
  const matchPercentage = (matchedSkills.length / requiredSkills.length) * 100
  
  // Score calculation:
  // 90-100% match = 9.0-10.0
  // 70-89% match = 7.5-8.9
  // 50-69% match = 6.0-7.4
  // 30-49% match = 4.0-5.9
  // 0-29% match = 0.0-3.9
  
  let score: number
  if (matchPercentage >= 90) {
    score = 9.0 + (matchPercentage - 90) / 10
  } else if (matchPercentage >= 70) {
    score = 7.5 + ((matchPercentage - 70) / 20) * 1.4
  } else if (matchPercentage >= 50) {
    score = 6.0 + ((matchPercentage - 50) / 20) * 1.4
  } else if (matchPercentage >= 30) {
    score = 4.0 + ((matchPercentage - 30) / 20) * 1.9
  } else {
    score = (matchPercentage / 30) * 3.9
  }
  
  return {
    score: Math.min(10, Math.max(0, score)),
    matched: matchedSkills,
    total: requiredSkills.length
  }
}

/**
 * Calculate experience level score (0-10)
 * Weight: 25% of total score
 */
function calculateExperienceScore(candidateYears: number | undefined, jobRequirements: string): {
  score: number
  match: string
} {
  if (!candidateYears) {
    return { score: 5.0, match: 'Unknown experience' }
  }
  
  // Try to extract required experience from job requirements
  const expMatch = jobRequirements?.match(/(\d+)\+?\s*(?:to|-)?\s*(\d+)?\s*(?:years?|yrs?)/i)
  
  if (!expMatch) {
    // No specific requirement, score based on general experience
    if (candidateYears >= 5) return { score: 9.0, match: 'Senior level' }
    if (candidateYears >= 3) return { score: 8.0, match: 'Mid-level' }
    if (candidateYears >= 1) return { score: 7.0, match: 'Junior level' }
    return { score: 6.0, match: 'Entry level' }
  }
  
  const minRequired = Number.parseInt(expMatch[1])
  const maxRequired = expMatch[2] ? Number.parseInt(expMatch[2]) : minRequired + 3
  
  if (candidateYears >= minRequired && candidateYears <= maxRequired) {
    return { score: 9.5, match: 'Perfect match' }
  } else if (candidateYears >= minRequired - 1 && candidateYears <= maxRequired + 2) {
    return { score: 8.0, match: 'Good match' }
  } else if (candidateYears > maxRequired + 2) {
    return { score: 7.5, match: 'Overqualified' }
  } else {
    return { score: 5.0, match: 'Below requirements' }
  }
}

/**
 * Calculate location match score (0-10)
 * Weight: 10% of total score
 */
function calculateLocationScore(
  candidateLocation: string | undefined,
  preferredLocation: string | undefined,
  jobLocation: string | undefined
): {
  score: number
  match: string
} {
  if (!jobLocation) {
    return { score: 8.0, match: 'No location requirement' }
  }
  
  const jobLoc = jobLocation.toLowerCase()
  const currentLoc = candidateLocation?.toLowerCase() || ''
  const prefLoc = preferredLocation?.toLowerCase() || ''
  
  // Remote jobs always get high score
  if (jobLoc.includes('remote')) {
    return { score: 10.0, match: 'Remote - Perfect' }
  }
  
  // Exact match with current or preferred location
  if (currentLoc.includes(jobLoc) || jobLoc.includes(currentLoc)) {
    return { score: 10.0, match: 'Current location match' }
  }
  
  if (prefLoc.includes(jobLoc) || jobLoc.includes(prefLoc)) {
    return { score: 9.0, match: 'Preferred location match' }
  }
  
  // Same state/region (rough match)
  const jobWords = jobLoc.split(/[\s,]+/)
  const hasPartialMatch = jobWords.some(word => 
    word.length > 3 && (currentLoc.includes(word) || prefLoc.includes(word))
  )
  
  if (hasPartialMatch) {
    return { score: 7.0, match: 'Same region' }
  }
  
  return { score: 5.0, match: 'Different location' }
}

/**
 * Calculate salary expectation score (0-10)
 * Weight: 15% of total score
 */
function calculateSalaryScore(
  expectedCtc: string | undefined,
  salaryRange: string | undefined
): {
  score: number
  match: string
} {
  if (!expectedCtc || !salaryRange) {
    return { score: 7.0, match: 'No salary data' }
  }
  
  // Extract numbers from strings (handles formats like "5-7 LPA", "₹500000-700000", etc.)
  const extractAmount = (str: string): number => {
    const normalized = str.toLowerCase().replace(/[₹,]/g, '')
    const match = normalized.match(/(\d+(?:\.\d+)?)\s*(?:lpa|lakhs?|lacs?)?/)
    if (!match) return 0
    
    const amount = Number.parseFloat(match[1])
    // Convert LPA to actual amount if needed
    if (normalized.includes('lpa') || normalized.includes('lakh') || normalized.includes('lac')) {
      return amount * 100000
    }
    return amount
  }
  
  const expected = extractAmount(expectedCtc)
  
  // Extract range from salary string
  const rangeMatch = salaryRange.match(/(\d+(?:\.\d+)?)\s*(?:to|-)\s*(\d+(?:\.\d+)?)/)
  if (!rangeMatch) {
    return { score: 7.0, match: 'Cannot parse salary range' }
  }
  
  const minSalary = extractAmount(rangeMatch[1])
  const maxSalary = extractAmount(rangeMatch[2])
  
  if (expected >= minSalary && expected <= maxSalary) {
    return { score: 10.0, match: 'Within budget' }
  } else if (expected < minSalary) {
    return { score: 9.0, match: 'Below budget (flexible)' }
  } else if (expected <= maxSalary * 1.15) {
    return { score: 7.5, match: 'Slightly above budget' }
  } else if (expected <= maxSalary * 1.3) {
    return { score: 6.0, match: 'Above budget' }
  } else {
    return { score: 4.0, match: 'Well above budget' }
  }
}

/**
 * Calculate notice period score (0-10)
 * Weight: 10% of total score
 */
function calculateNoticePeriodScore(noticePeriod: string | undefined): {
  score: number
  match: string
} {
  if (!noticePeriod) {
    return { score: 7.0, match: 'Unknown availability' }
  }
  
  const period = noticePeriod.toLowerCase()
  
  // Extract days/months from notice period
  const daysMatch = period.match(/(\d+)\s*days?/)
  const monthsMatch = period.match(/(\d+)\s*months?/)
  
  let days = 0
  if (daysMatch) {
    days = Number.parseInt(daysMatch[1])
  } else if (monthsMatch) {
    days = Number.parseInt(monthsMatch[1]) * 30
  } else if (period.includes('immediate') || period.includes('immediately')) {
    days = 0
  }
  
  // Scoring based on availability
  if (days === 0) {
    return { score: 10.0, match: 'Immediate joiner' }
  } else if (days <= 15) {
    return { score: 9.5, match: 'Available in 2 weeks' }
  } else if (days <= 30) {
    return { score: 9.0, match: 'Available in 1 month' }
  } else if (days <= 45) {
    return { score: 8.0, match: 'Available in 1.5 months' }
  } else if (days <= 60) {
    return { score: 7.0, match: 'Available in 2 months' }
  } else if (days <= 90) {
    return { score: 6.0, match: 'Available in 3 months' }
  } else {
    return { score: 5.0, match: 'Long notice period' }
  }
}

/**
 * Main scoring function
 * Calculates overall candidate score based on weighted factors
 */
export async function calculateCandidateScore(
  candidate: Candidate,
  job: Job
): Promise<ScoringResult> {
  console.log('[v0] Calculating score for candidate:', candidate.name, 'for job:', job.title)
  
  // Calculate individual scores
  const skillsResult = calculateSkillsScore(
    candidate.skills || '',
    job.requirements || '',
    job.description || ''
  )
  
  const experienceResult = calculateExperienceScore(
    candidate.years_of_experience,
    job.requirements || ''
  )
  
  const locationResult = calculateLocationScore(
    candidate.current_location,
    candidate.preferred_location,
    job.location
  )
  
  const salaryResult = calculateSalaryScore(
    candidate.expected_ctc,
    job.salary_range
  )
  
  const noticePeriodResult = calculateNoticePeriodScore(
    candidate.notice_period
  )
  
  // Apply weights and calculate total score
  const weights = {
    skills: 0.40,
    experience: 0.25,
    location: 0.10,
    salary: 0.15,
    noticePeriod: 0.10
  }
  
  const totalScore = (
    skillsResult.score * weights.skills +
    experienceResult.score * weights.experience +
    locationResult.score * weights.location +
    salaryResult.score * weights.salary +
    noticePeriodResult.score * weights.noticePeriod
  )
  
  // Round to 1 decimal place
  const finalScore = Math.round(totalScore * 10) / 10
  
  console.log('[v0] Score breakdown:', {
    skills: skillsResult.score,
    experience: experienceResult.score,
    location: locationResult.score,
    salary: salaryResult.score,
    noticePeriod: noticePeriodResult.score,
    total: finalScore
  })
  
  return {
    totalScore: finalScore,
    breakdown: {
      skillsScore: skillsResult.score,
      experienceScore: experienceResult.score,
      locationScore: locationResult.score,
      salaryScore: salaryResult.score,
      noticePeriodScore: noticePeriodResult.score
    },
    details: {
      matchedSkills: skillsResult.matched,
      totalSkillsRequired: skillsResult.total,
      experienceMatch: experienceResult.match,
      locationMatch: locationResult.match,
      salaryMatch: salaryResult.match,
      availabilityMatch: noticePeriodResult.match
    }
  }
}
