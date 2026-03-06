'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Briefcase, 
  Calendar,
  Download,
  FileText,
  Filter,
  Lock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePermissions } from '@/hooks/use-permissions'

interface ReportStats {
  totalJobs: number
  activeJobs: number
  totalCandidates: number
  shortlisted: number
  interviewed: number
  hired: number
  avgTimeToHire: number
  topDepartments: { department: string; count: number }[]
}

interface AdminReportsProps {
  userRole?: 'admin' | 'recruiter' | 'super_admin' | 'hiring_manager'
  userEmail?: string | null
}

export function AdminReports({ userRole = 'admin', userEmail }: AdminReportsProps) {
  // CRITICAL: All hooks MUST be called before any conditional returns
  // Move all useState hooks to the top to comply with React Rules of Hooks
  const [stats, setStats] = useState<ReportStats>({
    totalJobs: 0,
    activeJobs: 0,
    totalCandidates: 0,
    shortlisted: 0,
    interviewed: 0,
    hired: 0,
    avgTimeToHire: 0,
    topDepartments: []
  })
  const [loading, setLoading] = useState(true)
  const [organizationName, setOrganizationName] = useState<string>('Organization')
  const [activeRecruiters, setActiveRecruiters] = useState<number>(0)
  const [recruitersList, setRecruitersList] = useState<Array<{ name: string; email: string; user_id: string | null }>>([])
  const [selectedRecruiter, setSelectedRecruiter] = useState<string>('all')
  
  // Call usePermissions hook AFTER all useState hooks
  const { getAccessLevel, hasModuleAccess, loading: permissionsLoading } = usePermissions()
  const reportsAccessLevel = getAccessLevel('Reports & Analytics')

  useEffect(() => {
    if (!permissionsLoading && hasModuleAccess('Reports & Analytics')) {
      fetchReportData()
    } else if (!permissionsLoading) {
      setLoading(false)
    }
  }, [userRole, userEmail, selectedRecruiter, permissionsLoading])

  const fetchReportData = async () => {
    const supabase = createClient()
    
    // Get logged-in user's organization
    const userStr = localStorage.getItem('hyrix_user')
    console.log('[v0] AdminReports: User data from localStorage:', userStr ? 'Found' : 'NOT FOUND')
    let organizationId = null
    let currentUserEmail = userEmail
    
    if (userStr) {
      const user = JSON.parse(userStr)
      currentUserEmail = currentUserEmail || user.email
      console.log('[v0] AdminReports: User email:', currentUserEmail, 'userRole:', userRole)
      
      // For recruiters, get organization from org_team table
      if (userRole === 'recruiter') {
        const { data: teamData } = await supabase
          .from('org_team')
          .select('organization_id')
          .eq('email', currentUserEmail)
          .maybeSingle()
        organizationId = teamData?.organization_id
        console.log('[v0] AdminReports (recruiter): Organization ID from org_team:', organizationId)
      } else {
        const { data: orgData } = await supabase
          .from('organization')
          .select('id')
          .eq('email', currentUserEmail)
          .maybeSingle()
        organizationId = orgData?.id
        console.log('[v0] AdminReports (admin): Organization ID from organization:', organizationId)
      }
      
      // Fetch organization name
      if (organizationId) {
        const { data: orgDetails } = await supabase
          .from('organization')
          .select('name')
          .eq('id', organizationId)
          .maybeSingle()
        console.log('[v0] AdminReports: Organization Name:', orgDetails?.name)
        if (orgDetails?.name) {
          setOrganizationName(orgDetails.name)
        }
      }
    }
    
    if (!organizationId) {
      console.log('[v0] AdminReports: No organization found, showing empty stats')
      setLoading(false)
      return
    }
    
    // Fetch recruiters list for filter (admin only)
    if (userRole === 'admin' || userRole === 'super_admin') {
      const { data: recruiters } = await supabase
        .from('org_team')
        .select('name, email, user_id')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
      
      console.log('[v0] AdminReports: Fetched', recruiters?.length || 0, 'recruiters for dropdown')
      console.log('[v0] AdminReports: Recruiters list:', JSON.stringify(recruiters))
      setRecruitersList(recruiters || [])
    }

    // Fetch jobs data filtered by organization and recruiter if applicable
    let jobsQuery = supabase
      .from('jobs')
      .select('*')
      .eq('organization_id', organizationId)
    
    // If recruiter role, filter by assigned recruiter
    if (userRole === 'recruiter' && currentUserEmail) {
      jobsQuery = jobsQuery.eq('assigned_recruiter', currentUserEmail)
      console.log('[v0] AdminReports: Filtering jobs by assigned_recruiter:', currentUserEmail)
    }
    // If admin selected a specific recruiter from dropdown, fetch their details
    let selectedRecruiterData = null
    if ((userRole === 'admin' || userRole === 'super_admin') && selectedRecruiter !== 'all') {
      console.log('[v0] AdminReports: Looking up recruiter with email:', selectedRecruiter, 'in org:', organizationId)
      const { data: recruiterDetails, error: recruiterError } = await supabase
        .from('org_team')
        .select('name, email, user_id')
        .eq('email', selectedRecruiter)
        .eq('organization_id', organizationId)
        .maybeSingle()
      
      if (recruiterError) {
        console.error('[v0] AdminReports: Error fetching recruiter details:', recruiterError)
      }
      
      selectedRecruiterData = recruiterDetails
      console.log('[v0] AdminReports: Selected recruiter details:', selectedRecruiterData)
      
      if (selectedRecruiterData?.name) {
        jobsQuery = jobsQuery.eq('assigned_recruiter', selectedRecruiterData.name)
        console.log('[v0] AdminReports: Filtering jobs by selected recruiter name:', selectedRecruiterData.name)
      }
    }
    
    const { data: jobs } = await jobsQuery
    console.log('[v0] AdminReports: Fetched', jobs?.length || 0, 'jobs for organization')
    const activeJobs = jobs?.filter(j => j.status === 'active') || []

    // Fetch candidates data filtered by organization and recruiter if applicable
    let candidatesQuery = supabase
      .from('candidates')
      .select('*')
      .eq('organization_id', organizationId)
    
    // If recruiter role, filter by assigned recruiter UUID
    if (userRole === 'recruiter' && currentUserEmail) {
      // Get recruiter's UUID from org_team table
      const { data: recruiterData } = await supabase
        .from('org_team')
        .select('user_id')
        .eq('email', currentUserEmail)
        .maybeSingle()
      
      const recruiterUserId = recruiterData?.user_id
      console.log('[v0] AdminReports: Recruiter user_id from org_team:', recruiterUserId)
      
      if (recruiterUserId) {
        candidatesQuery = candidatesQuery.eq('assigned_to', recruiterUserId)
        console.log('[v0] AdminReports: Filtering candidates by assigned_to UUID:', recruiterUserId)
      }
    }
    // If admin selected a specific recruiter from dropdown
    else if ((userRole === 'admin' || userRole === 'super_admin') && selectedRecruiter !== 'all' && selectedRecruiterData) {
      // Get the recruiter's UUID from org_team using their email
      const { data: recruiterInfo } = await supabase
        .from('org_team')
        .select('id')
        .eq('email', selectedRecruiter)
        .eq('organization_id', organizationId)
        .maybeSingle()
      
      if (recruiterInfo?.id) {
        candidatesQuery = candidatesQuery.eq('assigned_to', recruiterInfo.id)
        console.log('[v0] AdminReports: Filtering candidates by assigned_to UUID:', recruiterInfo.id)
      } else {
        // Recruiter not found, return empty
        candidatesQuery = candidatesQuery.eq('id', '00000000-0000-0000-0000-000000000000')
        console.log('[v0] AdminReports: Recruiter not found, returning 0 candidates')
      }
    }
    
    const { data: candidates } = await candidatesQuery
    console.log('[v0] AdminReports: Fetched', candidates?.length || 0, 'candidates for organization')
    const shortlisted = candidates?.filter(c => c.status === 'shortlisted') || []
    const interviewed = candidates?.filter(c => c.status === 'interview scheduled') || []
    const hired = candidates?.filter(c => c.status === 'hired') || []
    
    // Fetch team members count for active recruiters
    // If a specific recruiter is selected, count should be 1, otherwise count all active team members
    let activeTeamCount = 0
    if ((userRole === 'admin' || userRole === 'super_admin') && selectedRecruiter !== 'all' && selectedRecruiterData) {
      activeTeamCount = 1 // Only the selected recruiter
      console.log('[v0] AdminReports: Active team members for selected recruiter:', activeTeamCount)
    } else {
      const { data: teamMembers } = await supabase
        .from('org_team')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
      
      activeTeamCount = teamMembers?.length || 0
      console.log('[v0] AdminReports: Fetched', activeTeamCount, 'active team members for organization')
    }
    
    setActiveRecruiters(activeTeamCount)

    // Calculate department stats
    const deptCount: { [key: string]: number } = {}
    jobs?.forEach(job => {
      const dept = job.department || 'General'
      deptCount[dept] = (deptCount[dept] || 0) + 1
    })

    const topDepartments = Object.entries(deptCount)
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    setStats({
      totalJobs: jobs?.length || 0,
      activeJobs: activeJobs.length,
      totalCandidates: candidates?.length || 0,
      shortlisted: shortlisted.length,
      interviewed: interviewed.length,
      hired: hired.length,
      avgTimeToHire: 14,
      topDepartments
    })

    setLoading(false)
  }

  // Show loading while permissions are being fetched
  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-gray-600">Loading permissions...</div>
      </div>
    )
  }
  
  // Check if user has no access to reports
  if (!hasModuleAccess('Reports & Analytics')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Lock className="h-16 w-16 text-gray-400" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-sm text-gray-600">You don't have permission to view Reports & Analytics.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">{organizationName} recruitment performance overview</p>
        </div>
        <div className="flex items-center gap-3">
          {(userRole === 'admin' || userRole === 'super_admin') && recruitersList.length > 0 && (
            <Select value={selectedRecruiter} onValueChange={setSelectedRecruiter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Recruiters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Recruiters</SelectItem>
                {recruitersList.map((recruiter) => (
                  <SelectItem key={recruiter.email} value={recruiter.email}>
                    {recruiter.name || recruiter.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Jobs</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalJobs}</p>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {stats.activeJobs} active
              </p>
            </div>
            <Briefcase className="h-10 w-10 text-blue-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Candidates</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCandidates}</p>
              <p className="text-xs text-gray-600 mt-1">All applications</p>
            </div>
            <Users className="h-10 w-10 text-purple-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Shortlisted</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.shortlisted}</p>
              <p className="text-xs text-gray-600 mt-1">
                {stats.totalCandidates > 0 ? Math.round((stats.shortlisted / stats.totalCandidates) * 100) : 0}% conversion
              </p>
            </div>
            <FileText className="h-10 w-10 text-green-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Hired</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.hired}</p>
              <p className="text-xs text-gray-600 mt-1">This period</p>
            </div>
            <TrendingUp className="h-10 w-10 text-orange-500 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Hiring Funnel */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Hiring Funnel
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Applications</span>
                <span className="font-medium">{stats.totalCandidates}</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: '100%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Shortlisted</span>
                <span className="font-medium">{stats.shortlisted}</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500" 
                  style={{ width: `${stats.totalCandidates > 0 ? (stats.shortlisted / stats.totalCandidates) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Interviewed</span>
                <span className="font-medium">{stats.interviewed}</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500" 
                  style={{ width: `${stats.totalCandidates > 0 ? (stats.interviewed / stats.totalCandidates) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Hired</span>
                <span className="font-medium">{stats.hired}</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500" 
                  style={{ width: `${stats.totalCandidates > 0 ? (stats.hired / stats.totalCandidates) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </Card>

        {/* Top Departments */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-purple-600" />
            Top Hiring Departments
          </h3>
          {stats.topDepartments.length > 0 ? (
            <div className="space-y-4">
              {stats.topDepartments.map((dept, index) => (
                <div key={dept.department}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{dept.department}</span>
                    <span className="font-medium">{dept.count} jobs</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        index === 0 ? 'bg-blue-500' :
                        index === 1 ? 'bg-purple-500' :
                        index === 2 ? 'bg-green-500' :
                        index === 3 ? 'bg-orange-500' :
                        'bg-gray-500'
                      }`}
                      style={{ width: `${(dept.count / stats.totalJobs) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No department data available</p>
          )}
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-semibold">Avg. Time to Hire</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.avgTimeToHire} days</p>
          <p className="text-sm text-gray-500 mt-1">Industry avg: 30 days</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-semibold">Success Rate</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.totalCandidates > 0 ? Math.round((stats.hired / stats.totalCandidates) * 100) : 0}%
          </p>
          <p className="text-sm text-gray-500 mt-1">Applications to hire</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="font-semibold">Active Recruiters</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">{activeRecruiters}</p>
                <p className="text-sm text-gray-500 mt-1">{organizationName} team</p>
              </Card>
      </div>
    </div>
  )
}
