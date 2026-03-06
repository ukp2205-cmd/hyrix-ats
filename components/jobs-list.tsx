'use client'

import { useEffect } from "react"

import { useState } from "react"
import { useRouter } from 'next/navigation'

import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { DropdownMenuContent } from "@/components/ui/dropdown-menu"
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DropdownMenu } from "@/components/ui/dropdown-menu"
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { MoreVertical } from 'lucide-react' // Import MoreVertical
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Briefcase, MapPin, Search, Eye, Edit, Edit2, Download, ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from '@/components/ui/pagination'
import { usePermissions } from '@/hooks/use-permissions'

interface Job {
  id: string
  title: string
  department: string
  location: string
  employment_type: string
  salary_range: string
  status: string
  assigned_recruiter: string
  created_at: string
  close_date: string
  client_name: string
}

interface JobsListProps {
  userRole?: 'admin' | 'recruiter' | 'super_admin' | 'hiring_manager'
  userEmail?: string | null
}

export function JobsList({ userRole = 'admin', userEmail }: JobsListProps) {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [applicantCounts, setApplicantCounts] = useState<Record<string, number>>({})
  const [recruiterName, setRecruiterName] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const { toast } = useToast()
  const { getAccessLevel, hasModuleAccess, loading: permissionsLoading } = usePermissions()

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter])

  useEffect(() => {
    if (!permissionsLoading) {
      const access = getAccessLevel('View All Jobs')
      if (hasModuleAccess('View All Jobs') && access !== 'No Access') {
        fetchJobs()
      } else {
        setLoading(false)
      }
    }
  }, [userRole, userEmail, permissionsLoading])

  async function fetchJobs() {
    const supabase = createClient()
    const currentUserEmail = userEmail || null
    let organizationId = null
    let recruiterNameForFiltering = ''

    if (!currentUserEmail) {
      setLoading(false)
      return
    }

    // For recruiters and hiring managers, get organization and name from org_team table
    if (userRole === 'recruiter' || userRole === 'hiring_manager') {
      const { data: userData } = await supabase
        .from('org_team')
        .select('organization_id, name')
        .eq('email', currentUserEmail)
        .maybeSingle()
      organizationId = userData?.organization_id
      recruiterNameForFiltering = userData?.name || ''
      setRecruiterName(recruiterNameForFiltering)
    } else {
      const { data: orgData } = await supabase
        .from('organization')
        .select('id')
        .eq('email', currentUserEmail)
        .maybeSingle()
      organizationId = orgData?.id
    }
    
    // If no organizationId found, don't attempt to fetch (user not logged in or no org)
    if (!organizationId) {
      setLoading(false)
      return
    }
    
    // Build jobs query based on role
    // super_admin → all org jobs
    // recruiter / hiring_manager → only jobs they created OR are assigned to
    let query = supabase
      .from('jobs')
      .select('*, created_by')
      .eq('organization_id', organizationId)

    if (userRole === 'recruiter' || userRole === 'hiring_manager') {
      // First fetch all org jobs to filter client-side (assigned_recruiter stores name, not email)
      const { data: allJobs } = await supabase
        .from('jobs')
        .select('id, created_by, assigned_recruiter')
        .eq('organization_id', organizationId)

      const matchedIds = (allJobs || [])
        .filter(j => {
          const isCreator = (j.created_by || '').toLowerCase().trim() === (currentUserEmail || '').toLowerCase().trim()
          const ar = (j.assigned_recruiter || '').toLowerCase().trim()
          const isAssigned =
            ar === (recruiterNameForFiltering || '').toLowerCase().trim() ||
            ar === (currentUserEmail || '').toLowerCase().trim()
          return isCreator || isAssigned
        })
        .map(j => j.id)

      if (matchedIds.length === 0) {
        setJobs([])
        setLoading(false)
        return
      }
      query = query.in('id', matchedIds)
    }

    query = query.order('created_at', { ascending: false })
    
    const { data, error } = await query

    if (error) {
      console.error('[v0] Error fetching jobs:', error)
    } else {

      setJobs(data || [])
      
      // Fetch applicant counts for each job
      if (data && data.length > 0) {
        const counts: Record<string, number> = {}
        for (const job of data) {
          const { count } = await supabase
            .from('candidates')
            .select('*', { count: 'exact', head: true })
            .eq('job_id', job.id)
          counts[job.id] = count || 0
        }
        setApplicantCounts(counts)
      }
    }
    setLoading(false)
  }


  const exportToCSV = () => {
    // Prepare CSV headers
    const headers = ['Job ID', 'Title', 'Department', 'Location', 'Employment Type', 'Salary Range', 'Status', 'Assigned Recruiter', 'Applicants', 'Posted Date', 'Close Date']
    
    // Prepare CSV rows
    const rows = jobs.map(job => [
      job.id,
      job.title,
      job.department || '-',
      job.location || '-',
      job.employment_type || '-',
      job.salary_range || '-',
      job.status || '-',
      job.assigned_recruiter || '-',
      applicantCounts[job.id] || 0,
      new Date(job.created_at).toLocaleDateString(),
      (() => {
        const cd = job.close_date
          ? new Date(job.close_date)
          : new Date(new Date(job.created_at).getTime() + 30 * 24 * 60 * 60 * 1000)
        return cd.toLocaleDateString()
      })()
    ])
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `jobs_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: 'Success',
      description: `Exported ${jobs.length} jobs to CSV`,
    })
  }

  // Permission checks for job actions
  const canEditJob = hasModuleAccess('Edit Job')

  // Show loading while permissions are loading
  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-gray-600">Loading permissions...</div>
      </div>
    )
  }
  
  // Check if user has no access
  const viewJobsAccess = getAccessLevel('View All Jobs')
  if (!hasModuleAccess('View All Jobs') || viewJobsAccess === 'No Access') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Lock className="h-16 w-16 text-gray-400" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-sm text-gray-600">You don't have permission to view jobs.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  // Filter jobs based on status, search, and recruiter access
  const filteredJobs = jobs.filter((job) => {
    // Status filter - case insensitive comparison
    const jobStatusNormalized = job.status ? job.status.toLowerCase().replace(/[^a-z0-9]/g, '') : ''
    const filterStatusNormalized = statusFilter.toLowerCase().replace(/[^a-z0-9]/g, '')
    
    const matchesStatus = statusFilter === 'all' || jobStatusNormalized === filterStatusNormalized
    
    // Search filter — includes Company Name (client_name), job title, department, location, ID
    const q = searchQuery.toLowerCase()
    const matchesSearch = searchQuery === '' || 
      job.title?.toLowerCase().includes(q) ||
      job.client_name?.toLowerCase().includes(q) ||
      job.department?.toLowerCase().includes(q) ||
      job.location?.toLowerCase().includes(q) ||
      job.id?.toLowerCase().includes(q)
    
    // Recruiter filter - only show jobs created by or assigned to the logged-in recruiter
    let matchesRecruiter = true
    if (userRole === 'recruiter') {
      const createdByRecruiter = (job as any).created_by === userEmail
      const assignedToRecruiterByEmail = job.assigned_recruiter === userEmail
      const assignedToRecruiterByName = job.assigned_recruiter === recruiterName
      matchesRecruiter = createdByRecruiter || assignedToRecruiterByEmail || assignedToRecruiterByName
    }
    
    return matchesStatus && matchesSearch && matchesRecruiter
  })

  // Calculate pagination
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex)

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Job Postings</h2>
        </div>

        {/* Jobs Count Display */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-700">
            {statusFilter === 'all' ? (
              `Total Jobs: ${filteredJobs.length}`
            ) : (
              `Total ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Jobs: ${filteredJobs.length}`
            )}
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search job postings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm border-gray-200 focus:border-gray-300 focus:ring-gray-300"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] h-9 text-sm border-gray-200">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="hold">Hold</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          {/* Export CSV - Admin Only */}
          {(userRole === 'admin' || userRole === 'super_admin') && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportToCSV}
              className="h-9 gap-2 bg-transparent"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          )}
        </div>


      </div>

      {/* Table Section */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200 bg-gray-50/50">
              <TableHead className="font-semibold text-gray-700 text-[13px] w-[100px]">Job ID</TableHead>
              <TableHead className="font-semibold text-gray-700 text-[13px]">Position</TableHead>
              <TableHead className="font-semibold text-gray-700 text-[13px]">Company Name</TableHead>
              <TableHead className="font-semibold text-gray-700 text-[13px]">Location</TableHead>
              <TableHead className="font-semibold text-gray-700 text-[13px]">Posted</TableHead>
              <TableHead className="font-semibold text-gray-700 text-[13px]">Close Date</TableHead>
              <TableHead className="font-semibold text-gray-700 text-[13px]">Recruiter</TableHead>
              <TableHead className="font-semibold text-gray-700 text-[13px] text-center">Applicants</TableHead>
              <TableHead className="font-semibold text-gray-700 text-[13px]">Status</TableHead>
              <TableHead className="font-semibold text-gray-700 text-[13px] text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12 text-gray-500">
                  {filteredJobs.length === 0 ? 'No jobs found matching your filters' : 'No jobs on this page'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedJobs.map((job) => (
                <TableRow 
                  key={job.id} 
                  className="border-b border-gray-100 hover:bg-purple-50/30 transition-colors"
                >
                  <TableCell className="text-[#4F46E5] font-medium text-[13px]">
                    <button
                      onClick={() => {
                        const route = userRole === 'hiring_manager' 
                          ? `/hiring-manager/jobs/${job.id}` 
                          : `/admin/jobs/${job.id}`
                        router.push(route)
                      }}
                      className="hover:underline hover:text-[#6366F1] transition-colors cursor-pointer"
                      title="View job details"
                    >
                      {job.id.substring(0, 8)}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => {
                          const route = userRole === 'hiring_manager' 
                            ? `/hiring-manager/jobs/${job.id}` 
                            : `/admin/jobs/${job.id}`
                          router.push(route)
                        }}
                        className="text-[#4F46E5] font-medium text-[13px] hover:text-[#6366F1] hover:underline transition-colors cursor-pointer text-left"
                        title="View job details"
                      >
                        {job.title}
                      </button>
                      <span className="text-gray-500 text-[12px]">
                        {job.department || 'General'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600 text-[13px]">
                    {job.client_name || '-'}
                  </TableCell>
                  <TableCell className="text-[13px]">
                    <button
                      onClick={() => {
                        const route = userRole === 'hiring_manager' 
                          ? `/hiring-manager/jobs/${job.id}` 
                          : `/admin/jobs/${job.id}`
                        router.push(route)
                      }}
                      className="text-[#4F46E5] hover:underline hover:text-[#6366F1] transition-colors cursor-pointer"
                      title="View applicant pipeline"
                    >
                      {job.location || 'Remote'}
                    </button>
                  </TableCell>
                  <TableCell className="text-gray-600 text-[13px]">
                    {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </TableCell>
                  <TableCell className="text-gray-600 text-[13px]">
                    {(() => {
                      const closeDate = job.close_date
                        ? new Date(job.close_date)
                        : new Date(new Date(job.created_at).getTime() + 30 * 24 * 60 * 60 * 1000)
                      return closeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    })()}
                  </TableCell>
                  <TableCell className="text-gray-600 text-[13px]">
                    {(() => {
                      if (!job.assigned_recruiter) return 'Not Assigned'
                      
                      let value = job.assigned_recruiter
                      
                      // Keep parsing until we get a non-string value or can't parse anymore
                      while (typeof value === 'string') {
                        try {
                          const parsed = JSON.parse(value)
                          if (parsed === value) break // Prevent infinite loop
                          value = parsed
                        } catch {
                          // Not valid JSON, stop parsing
                          break
                        }
                      }
                      
                      // If it's an array, join with commas
                      if (Array.isArray(value)) {
                        return value.join(', ')
                      }
                      
                      // Return as string
                      return String(value)
                    })()}
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      onClick={() => {
                        const route = userRole === 'hiring_manager' 
                          ? `/hiring-manager/jobs/${job.id}` 
                          : `/admin/jobs/${job.id}`
                        router.push(route)
                      }}
                      className="text-[#4F46E5] font-medium text-[13px] hover:text-[#6366F1] hover:underline transition-colors cursor-pointer"
                      title="View applicants"
                    >
                      {applicantCounts[job.id] || 0}
                    </button>
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={job.status || 'active'}
                      onValueChange={async (newStatus) => {
                        console.log('[v0] Updating job status:', job.id, 'to', newStatus)
                        const supabase = createClient()
                        const { error } = await supabase
                          .from('jobs')
                          .update({ status: newStatus })
                          .eq('id', job.id)
                        
                        if (error) {
                          console.error('[v0] Error updating job status:', error)
                          toast({
                            title: 'Error',
                            description: 'Failed to update job status',
                            variant: 'destructive'
                          })
                        } else {
                          console.log('[v0] Job status updated successfully')
                          toast({
                            title: 'Success',
                            description: 'Job status updated successfully'
                          })
                          fetchJobs()
                        }
                      }}
                    >
                      <SelectTrigger className={`h-8 text-xs w-[120px] capitalize border ${
                        job.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                        job.status === 'inactive' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        job.status === 'closed' ? 'bg-red-50 text-red-700 border-red-200' :
                        job.status === 'hold' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        job.status === 'draft' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="hold">Hold</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem 
                            onClick={() => {
                              const route = userRole === 'hiring_manager' 
                                ? `/hiring-manager/jobs/${job.id}` 
                                : `/admin/jobs/${job.id}`
                              router.push(route)
                            }}
                            className="cursor-pointer"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                {canEditJob && (
                <DropdownMenuItem
                  onClick={() => router.push(`/admin/jobs-new?id=${job.id}`)}
                  className="cursor-pointer"
                  >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                  </DropdownMenuItem>
                  )}
                  </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Navigation - Below Table */}
      {filteredJobs.length > 0 && totalPages > 1 && (
        <div className="flex justify-center py-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
