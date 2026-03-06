'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  Clock,
  ArrowUpRight,
  UserCheck,
  FileText,
  Lock
} from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'
import { useAuth } from '@/lib/auth-context'
import { DashboardDateFilter, DateRange } from '@/components/dashboard-date-filter'

interface DashboardStats {
  newApplicants: number
  totalHired: number
  pendingReview: number
  activePostings: number
}

interface RecentJob {
  id: string
  title: string
  department: string
  location: string
  created_at: string
  status: string
}

interface AdminDashboardOverviewProps {
  userRole?: 'admin' | 'recruiter' | 'super_admin'
}

export function AdminDashboardOverview({ userRole = 'admin' }: AdminDashboardOverviewProps) {
  const { getAccessLevel, hasModuleAccess, loading: permissionsLoading } = usePermissions()
  const { userEmail: authUserEmail } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    newApplicants: 0,
    totalHired: 0,
    pendingReview: 0,
    activePostings: 0
  })
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([])
  const [loading, setLoading] = useState(true)
  
  // Initialize with today's date (start and end of today)
  const getTodayRange = (): DateRange => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return { from: today, to: today }
  }
  
  const [dateRange, setDateRange] = useState<DateRange>(getTodayRange())

  const fetchDashboardData = async (customDateRange?: DateRange) => {
    const filterDateRange = customDateRange || dateRange
    const supabase = createClient()
    
    // Get dynamic dashboard access level from permissions
    const currentDashboardAccess = getAccessLevel('Dashboard')
    console.log('[v0] Dashboard: Access level from permissions:', currentDashboardAccess)
    
    // Get logged-in user's organization from auth context
    const userEmail = authUserEmail
    let organizationId = null
    let recruiterName = ''

    if (!userEmail) {
      setLoading(false)
      return
    }

    // For recruiters/hiring managers, get organization from org_team table
    if (userRole === 'recruiter' || userRole === 'hiring_manager') {
      const { data: userData } = await supabase
        .from('org_team')
        .select('organization_id, name')
        .eq('email', userEmail)
        .maybeSingle()
      organizationId = userData?.organization_id
      recruiterName = userData?.name || ''
    } else {
      const { data: orgData } = await supabase
        .from('organization')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle()
      organizationId = orgData?.id
    }

    if (!organizationId) {
      setLoading(false)
      return
    }
    
    // Helper: get job IDs based on access level
    const getJobIdsByAccess = async (access: string): Promise<string[] | null> => {
      console.log('[v0] Dashboard getJobIdsByAccess: access=', access, 'orgId=', organizationId, 'userEmail=', userEmail, 'recruiterName=', recruiterName, 'userRole=', userRole)
      
      // Full/Yes = all jobs, return null to skip filtering
      if (access === 'Full' || access === 'Yes') {
        console.log('[v0] Dashboard: Full access - showing all jobs')
        return null
      }
      
      if (access === 'Own Jobs') {
        // Only jobs created by this user
        const { data: ownJobs } = await supabase
          .from('jobs')
          .select('id')
          .eq('organization_id', organizationId!)
          .eq('created_by', userEmail!)
        console.log('[v0] Dashboard: Own Jobs access - found', ownJobs?.length || 0, 'own jobs')
        return ownJobs?.map(j => j.id) || []
      }
      
      if (access === 'Assigned Only' || access === 'Assigned Jobs') {
        // Only jobs assigned to this user - fetch all org jobs and filter client-side
        // to avoid Supabase .or() parsing issues with spaces/special chars in names
        const { data: allOrgJobs } = await supabase
          .from('jobs')
          .select('id, assigned_recruiter')
          .eq('organization_id', organizationId!)
        
        const matched = (allOrgJobs || []).filter(j => {
          const ar = (j.assigned_recruiter || '').toLowerCase().trim()
          return ar === (recruiterName || '').toLowerCase().trim() || ar === (userEmail || '').toLowerCase().trim()
        })
        console.log('[v0] Dashboard: Assigned access - matched', matched.length, 'of', allOrgJobs?.length || 0, 'jobs for recruiter:', recruiterName, 'email:', userEmail)
        return matched.map(j => j.id)
      }
      
      if (access === 'Assigned & Own') {
        // Own + Assigned jobs - fetch all org jobs and filter client-side
        const { data: allOrgJobs } = await supabase
          .from('jobs')
          .select('id, created_by, assigned_recruiter')
          .eq('organization_id', organizationId!)
        
        console.log('[v0] Dashboard Assigned & Own: Total org jobs:', allOrgJobs?.length || 0)
        console.log('[v0] Dashboard Assigned & Own: Filtering for userEmail:', userEmail, 'recruiterName:', recruiterName)
        
        const matched = (allOrgJobs || []).filter(j => {
          const isOwn = (j.created_by || '').toLowerCase().trim() === (userEmail || '').toLowerCase().trim()
          const ar = (j.assigned_recruiter || '').toLowerCase().trim()
          const isAssigned = ar === (recruiterName || '').toLowerCase().trim() || ar === (userEmail || '').toLowerCase().trim()
          
          console.log('[v0] Dashboard Assigned & Own: Job', j.id, '- created_by:', j.created_by, 'assigned_recruiter:', j.assigned_recruiter, 'isOwn:', isOwn, 'isAssigned:', isAssigned)
          
          return isOwn || isAssigned
        })
        console.log('[v0] Dashboard: Assigned & Own access - matched', matched.length, 'of', allOrgJobs?.length || 0, 'jobs (own + assigned)')
        return matched.map(j => j.id)
      }
      
      if (access === 'Limited') {
        // Own + Assigned jobs - fetch all org jobs and filter client-side
        const { data: allOrgJobs } = await supabase
          .from('jobs')
          .select('id, created_by, assigned_recruiter')
          .eq('organization_id', organizationId!)
        
        const matched = (allOrgJobs || []).filter(j => {
          const isOwn = (j.created_by || '').toLowerCase().trim() === (userEmail || '').toLowerCase().trim()
          const ar = (j.assigned_recruiter || '').toLowerCase().trim()
          const isAssigned = ar === (recruiterName || '').toLowerCase().trim() || ar === (userEmail || '').toLowerCase().trim()
          return isOwn || isAssigned
        })
        console.log('[v0] Dashboard: Limited access - matched', matched.length, 'of', allOrgJobs?.length || 0, 'jobs (own + assigned)')
        return matched.map(j => j.id)
      }
      
      // No Access or unknown
      return []
    }
    
    // Get filtered job IDs based on dashboard access level
    console.log('[v0] Dashboard: About to call getJobIdsByAccess with currentDashboardAccess:', currentDashboardAccess)
    const filteredJobIds = await getJobIdsByAccess(currentDashboardAccess)
    console.log('[v0] Dashboard: filteredJobIds result:', filteredJobIds?.length || 'null (all jobs)')
    
    // Fetch candidates stats filtered by access level and date range
    let candidates: any[] = []
    
    const fromDate = filterDateRange.from.toISOString()
    const toDate = new Date(filterDateRange.to)
    toDate.setHours(23, 59, 59, 999)
    const toDateISO = toDate.toISOString()
    
    if (filteredJobIds !== null && filteredJobIds.length === 0) {
      // Access level returned empty job list - no data to show
      console.log('[v0] Dashboard: No jobs found for access level, showing empty stats')
      candidates = []
    } else if (filteredJobIds !== null) {
      // Filtered by specific job IDs and date range
      const { data: candidatesData } = await supabase
        .from('candidates')
        .select('status, created_at')
        .eq('organization_id', organizationId)
        .in('job_id', filteredJobIds)
        .gte('created_at', fromDate)
        .lte('created_at', toDateISO)
      candidates = candidatesData || []
    } else {
      // Full access - fetch all candidates with date filter
      const { data: candidatesData } = await supabase
        .from('candidates')
        .select('status, created_at')
        .eq('organization_id', organizationId)
        .gte('created_at', fromDate)
        .lte('created_at', toDateISO)
      candidates = candidatesData || []
    }
    
    console.log('[v0] Dashboard: Fetched', candidates.length, 'candidates for access level:', currentDashboardAccess)
    
    const newApplicants = candidates.filter(c => {
      const createdDate = new Date(c.created_at)
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      return createdDate > monthAgo
    }).length || 0

    const totalHired = candidates.filter(c => c.status === 'hired').length || 0
    const pendingReview = candidates.filter(c => c.status === 'shortlisted' || c.status === 'under review').length || 0

    // Fetch recent active jobs filtered by access level
    let allJobs: any[] = []
    
    if (filteredJobIds !== null && filteredJobIds.length === 0) {
      // No jobs to show
      allJobs = []
    } else if (filteredJobIds !== null) {
      // Fetch only filtered jobs
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .in('id', filteredJobIds)
        .order('created_at', { ascending: false })
        .limit(5)
      allJobs = jobs || []
    } else {
      // Full access - fetch all jobs
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5)
      allJobs = jobs || []
    }

    console.log('[v0] Dashboard: Fetched', allJobs.length, 'active jobs for access level:', currentDashboardAccess)

    setStats({
      newApplicants,
      totalHired,
      pendingReview,
      activePostings: allJobs.length
    })

    setRecentJobs(allJobs)
    setLoading(false)
  }

  useEffect(() => {
    if (!permissionsLoading) {
      const dashAccess = getAccessLevel('Dashboard')
      if (hasModuleAccess('Dashboard') && dashAccess !== 'No Access') {
        fetchDashboardData()
      } else {
        setLoading(false)
      }
    }
  }, [permissionsLoading])
  
  const handleDateChange = (newRange: DateRange) => {
    console.log('[v0] Dashboard: Date range changed:', newRange)
    setDateRange(newRange)
    setLoading(true)
    fetchDashboardData(newRange)
  }

  // Show loading while permissions are loading
  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }
  
  // Check if user has access to dashboard
  const dashboardAccess = getAccessLevel('Dashboard')
  if (!hasModuleAccess('Dashboard') || dashboardAccess === 'No Access') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Lock className="h-16 w-16 text-gray-400" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-sm text-gray-600">You don't have permission to view the dashboard.</p>
        </div>
      </div>
    )
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header with Date Filter */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-sm text-gray-500 mt-1">Welcome back! Here's what's happening with your recruitment.</p>
        </div>
        <DashboardDateFilter onDateChange={handleDateChange} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* New Applicants */}
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">New Applicants</CardTitle>
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">{stats.newApplicants}</p>
              <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                This month
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Active Postings */}
        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Active Postings</CardTitle>
              <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">{stats.activePostings}</p>
              <Badge className="bg-green-50 text-green-700 hover:bg-green-100 text-xs">
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Pending Review */}
        <Card className="border-l-4 border-l-yellow-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Review</CardTitle>
              <div className="h-10 w-10 rounded-full bg-yellow-50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">{stats.pendingReview}</p>
              <Badge className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100 text-xs">
                Awaiting
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Total Hired */}
        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Hired</CardTitle>
              <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">{stats.totalHired}</p>
              <Badge className="bg-green-50 text-green-700 hover:bg-green-100 text-xs">
                Success
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Job Postings */}
      <Card className="shadow-sm">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50/50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Job Postings</CardTitle>
              <CardDescription className="mt-1">Your most recent active job listings</CardDescription>
            </div>
            {hasModuleAccess('Create Job') && (
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2 bg-transparent"
              onClick={() => {
                const basePath = userRole === 'recruiter' ? '/recruiter' : '/admin'
                window.location.href = `${basePath}/jobs-new`
              }}
            >
              <FileText className="h-4 w-4" />
              Post New Job
            </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {recentJobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium mb-2">No active job postings</p>
              <p className="text-sm text-gray-400 mb-4">Create your first job posting to start receiving applications</p>
              {hasModuleAccess('Create Job') && (
              <Button onClick={() => {
                const basePath = userRole === 'recruiter' ? '/recruiter' : '/admin'
                window.location.href = `${basePath}/jobs-new`
              }}>
                Create Job Posting
              </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer"
                  onClick={() => {
                    const basePath = userRole === 'recruiter' ? '/recruiter' : '/admin'
                    window.location.href = `${basePath}/jobs/${job.id}`
                  }}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">{job.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {job.department || 'General'}
                        </span>
                        <span>•</span>
                        <span>{job.location || 'Remote'}</span>
                        <span>•</span>
                        <span>{new Date(job.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-green-50 text-green-700 border border-green-200">
                      {job.status}
                    </Badge>
                    <Button variant="ghost" size="sm" className="gap-2">
                      View Details
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
