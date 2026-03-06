import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/utils/supabase/client'
import { type UserRole } from '@/lib/permissions'

export function usePermissions() {
  const { userRole, userEmail, loading: authLoading } = useAuth()
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [permissionsMap, setPermissionsMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    
    async function loadPermissions() {
      // Wait for auth to finish loading before resolving permissions
      if (authLoading) return

      // Auth is done but no role means unauthenticated — deny all
      if (!userRole) {
        if (isMounted) setLoading(false)
        return
      }

      // super_admin, admin, and recruiter always have known access — no DB lookup needed
      if (userRole === 'super_admin' || userRole === 'admin' || userRole === 'recruiter' || userRole === 'hiring_manager') {
        if (!isMounted) return
        const fullAccess = 'Full'
        const allModules = [
          'Dashboard',
          'View All Jobs', 'Create Job', 'Edit Job', 'Delete Job',
          'View All Candidates', 'Add Candidate', 'Move Candidate Stage',
          'Reports & Analytics', 'Manage Users', 'Manage Clients',
          'Role & Permission Settings', 'Company Settings',
          'Billing / Subscription', 'Activity Logs',
          'Schedule Interview', 'Delete Candidate', 'Export Data',
        ]
        const map: Record<string, string> = {}
        allModules.forEach(m => { map[m] = fullAccess })
        setPermissionsMap(map)
        setPermissions({
          canManageClients: true, canEditClients: true, canManageUsers: true,
          canManageRolePermissions: true, canManageCompanySettings: true,
          canCreateJobs: true, canEditOwnJobs: true, canEditAssignedJobs: true,
          canDeleteJobs: true, canMoveCandidateStage: true, canViewReports: true,
          canViewBilling: true, canViewActivityLogs: true,
        })
        setLoading(false)
        return
      }

      try {
        // Fetch permissions from database for non-admin roles
        const supabase = createClient()
        const { data, error } = await supabase
          .from('role_permissions')
          .select('module, access_level')
          .eq('role', userRole)

        // Check if component is still mounted before updating state
        if (!isMounted) return

        if (error) {
          console.error('[v0] usePermissions: Error fetching permissions:', error)
          setLoading(false)
          return
        }

        // Build permissions map
        const dbPermissions: Record<string, string> = {}
        data?.forEach((perm) => {
          dbPermissions[perm.module] = perm.access_level
        })
        setPermissionsMap(dbPermissions)

        console.log('[v0] usePermissions: Loaded permissions:', dbPermissions)

        // Convert to boolean checks for common permissions
        const hasAccess = (module: string) => {
          const level = dbPermissions[module]
          return level && level !== 'No Access'
        }

        setPermissions({
          canManageClients: hasAccess('Manage Clients'),
          canEditClients: hasAccess('Manage Clients'),
          canManageUsers: hasAccess('Manage Users'),
          canManageRolePermissions: hasAccess('Role & Permission Settings'),
          canManageCompanySettings: hasAccess('Company Settings'),
          canCreateJobs: hasAccess('Create Job'),
          canEditOwnJobs: hasAccess('Edit Job'),
          canEditAssignedJobs: hasAccess('Edit Job'),
          canDeleteJobs: hasAccess('Delete Job'),
          canMoveCandidateStage: hasAccess('Move Candidate Stage'),
          canViewReports: hasAccess('Reports & Analytics'),
          canViewBilling: hasAccess('Billing / Subscription'),
          canViewActivityLogs: hasAccess('Activity Logs'),
        })

        setLoading(false)
      } catch (error) {
        // Silently catch abort errors during cleanup
        if (isMounted && error instanceof Error && error.name !== 'AbortError') {
          console.error('[v0] usePermissions: Error fetching permissions:', error)
          setLoading(false)
        }
      }
    }

    loadPermissions()
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false
    }
  }, [userRole, authLoading])

  /**
   * Check if user has access to a specific module
   */
  const hasModuleAccess = (module: string): boolean => {
    const level = permissionsMap[module]
    return level !== undefined && level !== 'No Access'
  }

  /**
   * Get access level for a specific module
   */
  const getAccessLevel = (module: string): string => {
    return permissionsMap[module] || 'No Access'
  }

  /**
   * Check if user can edit a specific job
   */
  const canEditJob = (jobCreatedBy?: string, jobAssignedRecruiter?: string) => {
    if (!userRole || !userEmail) return false

    const editLevel = permissionsMap['Edit Job']
    
    // No access
    if (!editLevel || editLevel === 'No Access') return false
    
    // Full access
    if (editLevel === 'Full' || userRole === 'super_admin' || userRole === 'admin') return true

    // Own Jobs only
    if (editLevel === 'Own Jobs') {
      return jobCreatedBy === userEmail
    }

    // Assigned Jobs only
    if (editLevel === 'Assigned Jobs') {
      return jobAssignedRecruiter === userEmail || jobCreatedBy === userEmail
    }

    return false
  }

  /**
   * Check if user can view a specific job
   */
  const canViewJob = (jobCreatedBy?: string, jobAssignedRecruiter?: string) => {
    if (!userRole || !userEmail) return false

    const viewLevel = permissionsMap['View All Jobs']
    
    // No access
    if (!viewLevel || viewLevel === 'No Access') return false
    
    // Full access
    if (viewLevel === 'Full' || viewLevel === 'Yes' || userRole === 'super_admin' || userRole === 'admin') return true

    // Own Jobs only
    if (viewLevel === 'Own Jobs') {
      return jobCreatedBy === userEmail
    }

    // Assigned Only
    if (viewLevel === 'Assigned Only') {
      return jobAssignedRecruiter === userEmail || jobCreatedBy === userEmail
    }

    return false
  }

  /**
   * Check if user can add candidates to a job
   */
  const canAddCandidate = (jobCreatedBy?: string, jobAssignedRecruiter?: string) => {
    if (!userRole || !userEmail) return false

    const addLevel = permissionsMap['Add Candidate']
    
    // No access
    if (!addLevel || addLevel === 'No Access') return false
    
    // Full access
    if (addLevel === 'Full' || addLevel === 'Yes' || userRole === 'super_admin' || userRole === 'admin') return true

    // Own Jobs only
    if (addLevel === 'Own Jobs') {
      return jobCreatedBy === userEmail
    }

    // Assigned Jobs only
    if (addLevel === 'Assigned Jobs') {
      return jobAssignedRecruiter === userEmail || jobCreatedBy === userEmail
    }

    return false
  }

  return {
    ...permissions,
    hasModuleAccess,
    getAccessLevel,
    canEditJob,
    canViewJob,
    canAddCandidate,
    loading,
    userRole,
    userEmail,
  }
}
