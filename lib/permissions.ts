import { createClient } from '@/lib/supabase/client'

export type UserRole = 'super_admin' | 'admin' | 'hiring_manager' | 'recruiter' | null

export interface Permission {
  key: string
  description: string
  module: string
}

export interface PermissionCheck {
  hasPermission: boolean
  reason?: string
}

/**
 * Get all permissions for a given role
 */
export async function getRolePermissions(role: UserRole): Promise<Permission[]> {
  if (!role) return []

  const supabase = createClient()

  const { data, error } = await supabase
    .from('role_permissions')
    .select(`
      permissions:permissions (
        key,
        description,
        module
      )
    `)
    .eq('roles.name', role)

  if (error) {
    console.error('[v0] Error fetching role permissions:', error)
    return []
  }

  return (data || []).map((item: any) => item.permissions).filter(Boolean)
}

/**
 * Check if a user has a specific permission
 */
export async function hasPermission(
  role: UserRole,
  permissionKey: string
): Promise<boolean> {
  if (!role) return false

  // Super admin has all permissions
  if (role === 'super_admin' || role === 'admin') return true

  const supabase = createClient()

  const { data, error } = await supabase
    .from('role_permissions')
    .select(`
      roles!inner(name),
      permissions!inner(key)
    `)
    .eq('roles.name', role)
    .eq('permissions.key', permissionKey)
    .single()

  if (error) {
    console.error('[v0] Error checking permission:', error)
    return false
  }

  return !!data
}

/**
 * Check if user can access a specific job
 */
export function canAccessJob(
  role: UserRole,
  userEmail: string,
  jobCreatedBy?: string,
  jobAssignedRecruiter?: string
): boolean {
  if (!role || !userEmail) return false

  // Super admin can access all jobs
  if (role === 'super_admin' || role === 'admin') return true

  // Hiring manager can access own jobs
  if (role === 'hiring_manager') {
    return jobCreatedBy === userEmail
  }

  // Recruiter can access assigned jobs
  if (role === 'recruiter') {
    return jobAssignedRecruiter === userEmail
  }

  return false
}

/**
 * Check if user can access a specific candidate
 */
export async function canAccessCandidate(
  role: UserRole,
  userEmail: string,
  candidateJobId?: string
): Promise<boolean> {
  if (!role || !userEmail) return false

  // Super admin can access all candidates
  if (role === 'super_admin' || role === 'admin') return true

  if (!candidateJobId) return false

  // Fetch the job to check ownership/assignment
  const supabase = createClient()
  const { data: job, error } = await supabase
    .from('jobs')
    .select('created_by, assigned_recruiter')
    .eq('id', candidateJobId)
    .single()

  if (error || !job) return false

  return canAccessJob(role, userEmail, job.created_by, job.assigned_recruiter)
}

/**
 * Get SQL filter for jobs based on user role
 */
export function getJobsFilter(role: UserRole, userEmail: string) {
  if (!role || !userEmail) {
    return { created_by: 'none' } // Return no results
  }

  // Super admin sees all jobs
  if (role === 'super_admin' || role === 'admin') {
    return {} // No filter
  }

  // Hiring manager sees own jobs
  if (role === 'hiring_manager') {
    return { created_by: userEmail }
  }

  // Recruiter sees assigned jobs
  if (role === 'recruiter') {
    return { assigned_recruiter: userEmail }
  }

  return { created_by: 'none' }
}

/**
 * Get SQL filter for candidates based on user role
 */
export async function getCandidatesFilter(role: UserRole, userEmail: string) {
  if (!role || !userEmail) {
    return { id: 'none' } // Return no results
  }

  // Super admin sees all candidates
  if (role === 'super_admin' || role === 'admin') {
    return {} // No filter
  }

  // Get job IDs the user can access
  const supabase = createClient()
  const jobsFilter = getJobsFilter(role, userEmail)

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id')
    .match(jobsFilter)

  if (error || !jobs || jobs.length === 0) {
    return { id: 'none' }
  }

  const jobIds = jobs.map((j) => j.id)
  return { job_id: jobIds }
}

/**
 * Permission keys for easy reference
 */
export const PERMISSIONS = {
  DASHBOARD: {
    VIEW_ALL: 'dashboard.view.all',
    VIEW_OWN: 'dashboard.view.own',
    VIEW_ASSIGNED: 'dashboard.view.assigned',
  },
  CLIENTS: {
    CREATE: 'clients.create',
    EDIT: 'clients.edit',
    DELETE: 'clients.delete',
    VIEW: 'clients.view',
  },
  USERS: {
    CREATE: 'users.create',
    EDIT: 'users.edit',
    DELETE: 'users.delete',
    VIEW: 'users.view',
  },
  SETTINGS: {
    ROLE_PERMISSIONS: 'settings.role_permissions',
    COMPANY: 'settings.company',
  },
  JOBS: {
    CREATE: 'jobs.create',
    EDIT_ALL: 'jobs.edit.all',
    EDIT_OWN: 'jobs.edit.own',
    EDIT_ASSIGNED: 'jobs.edit.assigned',
    DELETE: 'jobs.delete',
    VIEW_ALL: 'jobs.view.all',
    VIEW_OWN: 'jobs.view.own',
    VIEW_ASSIGNED: 'jobs.view.assigned',
  },
  CANDIDATES: {
    VIEW_ALL: 'candidates.view.all',
    VIEW_OWN: 'candidates.view.own',
    VIEW_ASSIGNED: 'candidates.view.assigned',
    ADD_ALL: 'candidates.add.all',
    ADD_OWN: 'candidates.add.own',
    ADD_ASSIGNED: 'candidates.add.assigned',
    MOVE_STAGE: 'candidates.move_stage',
  },
  INTERVIEWS: {
    SCHEDULE_ALL: 'interviews.schedule.all',
    SCHEDULE_OWN: 'interviews.schedule.own',
    SCHEDULE_ASSIGNED: 'interviews.schedule.assigned',
  },
  REPORTS: {
    VIEW: 'reports.view',
  },
  BILLING: {
    VIEW: 'billing.view',
    MANAGE: 'billing.manage',
  },
  ACTIVITY_LOGS: {
    VIEW: 'activity_logs.view',
  },
} as const
