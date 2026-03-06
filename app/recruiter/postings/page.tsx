'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  LogOut,
  Settings,
  BarChart3,
  Plus,
  Search,
  Filter,
  ExternalLink,
  Eye,
  Edit2,
  Trash2,
  MoreVertical,
  Menu
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'

export default function JobPostingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { hasModuleAccess, loading: permissionsLoading } = usePermissions()
  const [jobs, setJobs] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editFormData, setEditFormData] = useState<any>({})
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, href: '/recruiter' },
    { id: 'postings', label: 'Job Postings', icon: Briefcase, href: '/recruiter/postings' },
    { id: 'applicants', label: 'Applicants', icon: Users, href: '/recruiter?tab=candidates' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/recruiter/analytics' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/recruiter/settings' },
  ]

  useEffect(() => {
    fetchJobs()
  }, [statusFilter])

  const fetchJobs = async () => {
    setLoading(true)
    const supabase = createClient()
    
    // Get logged-in recruiter info
    const userStr = localStorage.getItem('hyrix_user')
    let recruiterEmail = null
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        recruiterEmail = user.email
        console.log('[v0] Fetching jobs for recruiter:', recruiterEmail)
      } catch (e) {
        console.error('[v0] Error parsing user data:', e)
      }
    }
    
    let query = supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data, error } = await query

    if (error) {
      console.error('[v0] Error fetching jobs:', error)
    } else {
      // Filter jobs where recruiter is assigned OR where recruiter created the job
      let filteredJobs = data || []
      if (recruiterEmail) {
        filteredJobs = filteredJobs.filter(job => {
          const assignedRecruiters = job.assigned_recruiter || ''
          const createdBy = job.created_by || ''
          
          // Show job if recruiter is assigned OR if recruiter created it
          const isAssigned = assignedRecruiters.toLowerCase().includes(recruiterEmail.toLowerCase())
          const isCreator = createdBy.toLowerCase() === recruiterEmail.toLowerCase()
          
          return isAssigned || isCreator
        })
        console.log('[v0] Filtered jobs count (assigned or created):', filteredJobs.length)
      }
      
      // Fetch candidate count for each job
      const jobsWithCounts = await Promise.all(
        filteredJobs.map(async (job) => {
          const { count } = await supabase
            .from('candidates')
            .select('*', { count: 'exact', head: true })
            .eq('job_id', job.id)
          
          return { ...job, applicant_count: count || 0 }
        })
      )
      setJobs(jobsWithCounts)
    }
    setLoading(false)
  }

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.location?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleViewJob = (job: any) => {
    setSelectedJob(job)
    setEditFormData(job)
    setIsEditing(false)
    setViewDialogOpen(true)
  }

  const handleUpdateJob = async () => {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('jobs')
      .update({
        title: editFormData.title,
        description: editFormData.description,
        location: editFormData.location,
        employment_type: editFormData.employment_type,
        salary_range: editFormData.salary_range,
        requirements: editFormData.requirements,
        department: editFormData.department,
      })
      .eq('id', selectedJob.id)

    if (error) {
      console.log('[v0] Error updating job:', error)
      toast({
        title: 'Error',
        description: 'Failed to update job',
        variant: 'destructive'
      })
    } else {
      toast({
        title: 'Success',
        description: 'Job updated successfully'
      })
      setIsEditing(false)
      setViewDialogOpen(false)
      fetchJobs()
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!hasModuleAccess('Delete Job')) {
      toast({ title: 'Access Denied', description: 'You don\'t have permission to delete jobs.', variant: 'destructive' })
      return
    }
    if (!confirm('Are you sure you want to delete this job posting?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId)

    if (error) {
      console.log('[v0] Error deleting job:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete job',
        variant: 'destructive'
      })
    } else {
      toast({
        title: 'Success',
        description: 'Job deleted successfully'
      })
      fetchJobs()
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left Sidebar - Always Visible */}
      <aside className="w-64 border-r bg-white shadow-sm flex-shrink-0">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center gap-3 border-b px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white font-bold text-sm">
              JK
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent">
                Hyrix
              </span>
              <p className="text-xs text-muted-foreground">HR Portal</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = item.id === 'postings'
              return (
                <button
                  key={item.id}
                  onClick={() => router.push(item.href)}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              )
            })}
          </nav>

          <div className="border-t p-4">
            <button
              onClick={() => {
                localStorage.removeItem('hyrix_user')
                router.push('/login')
              }}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex-shrink-0 h-16 border-b bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80 shadow-sm z-10">
          <div className="flex h-full items-center justify-between px-4 lg:px-8">
            <h1 className="text-xl font-semibold">Job Postings</h1>
            {hasModuleAccess('Create Job') && (
            <Button
              onClick={() => router.push('/recruiter/postings/new')}
              className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Job
            </Button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-gradient-to-br from-blue-50/30 via-white to-purple-50/20">
          <Card className="p-6">
            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search job postings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter Status" />
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
              </div>
            </div>

            {/* Job List Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="border-b">
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Job ID</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Position</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Location</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Posted</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Close Date</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Assigned Recruiter</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Applicants</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Job Opening Status</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="text-center py-8 text-sm text-muted-foreground">
                          Loading job postings...
                        </td>
                      </tr>
                    ) : filteredJobs.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-8 text-sm text-muted-foreground">
                          No job postings found
                        </td>
                      </tr>
                    ) : (
                      filteredJobs.map((job) => (
                        <tr key={job.id} className="border-b hover:bg-accent/50 transition-colors">
                          <td className="px-3 py-3">
                            <div className="font-mono text-xs font-medium text-blue-600">
                              {job.job_id || job.id.split('-')[0].toUpperCase()}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="font-medium text-sm">{job.title || 'Untitled Position'}</div>
                            <div className="text-xs text-muted-foreground">{job.department || 'General'}</div>
                          </td>
                          <td className="px-3 py-3 text-xs text-muted-foreground">{job.location || 'Remote'}</td>
                          <td className="px-3 py-3 text-xs text-muted-foreground">
                            {job.created_at ? new Date(job.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            }) : 'N/A'}
                          </td>
                          <td className="px-3 py-3 text-xs text-muted-foreground">
                            {job.created_at ? (() => {
                              const closeDate = new Date(job.created_at)
                              closeDate.setDate(closeDate.getDate() + 30)
                              return closeDate.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })
                            })() : 'N/A'}
                          </td>
                          <td className="px-3 py-3 text-xs text-muted-foreground">
                            {job.assigned_recruiter || 'Not Assigned'}
                          </td>
                          <td className="px-3 py-3">
                            <Badge variant="secondary" className="text-xs px-2 py-0.5">
                              {job.applicant_count || 0}
                            </Badge>
                          </td>
                          <td className="px-3 py-3">
                            <Select 
                              value={job.job_opening_status || 'active'}
                              onValueChange={async (newStatus) => {
                                console.log('[v0] Updating job status:', job.id, 'to', newStatus)
                                const supabase = createClient()
                                const { error } = await supabase
                                  .from('jobs')
                                  .update({ job_opening_status: newStatus })
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
                                job.job_opening_status === 'active' 
                                  ? 'bg-green-50 text-green-700 border-green-200' 
                                  : job.job_opening_status === 'inactive'
                                  ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                  : job.job_opening_status === 'closed'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : job.job_opening_status === 'hold'
                                  ? 'bg-orange-50 text-orange-700 border-orange-200'
                                  : job.job_opening_status === 'draft'
                                  ? 'bg-gray-50 text-gray-700 border-gray-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
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
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/admin/jobs/${job.id}`)}
                                className="h-7 w-7"
                                title="View Job"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                  {hasModuleAccess('Edit Job') && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      router.push(`/recruiter/postings/new?id=${job.id}`)
                    }}
                    className="h-7 w-7"
                    title="Edit Job"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  )}
                              {hasModuleAccess('Delete Job') && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteJob(job.id)}
                                className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Delete Job"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </main>
      </div>

      {/* Job Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-[95vw] w-[95vw] max-h-[92vh] overflow-y-auto p-8">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Job Posting' : 'Job Details'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update the job posting details below' : 'View complete job posting information'}
            </DialogDescription>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-4 py-4">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Job Title *</Label>
                    <Input
                      id="edit-title"
                      value={editFormData.title || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-location">Location</Label>
                      <Input
                        id="edit-location"
                        value={editFormData.location || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-employment">Employment Type</Label>
                      <Select
                        value={editFormData.employment_type || ''}
                        onValueChange={(value) => setEditFormData({ ...editFormData, employment_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-department">Department</Label>
                      <Input
                        id="edit-department"
                        value={editFormData.department || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-salary">Salary Range</Label>
                      <Input
                        id="edit-salary"
                        value={editFormData.salary_range || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, salary_range: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={editFormData.description || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      rows={5}
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-requirements">Requirements</Label>
                    <Textarea
                      id="edit-requirements"
                      value={editFormData.requirements || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, requirements: e.target.value })}
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateJob}>
                      Update Job
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{selectedJob.title}</h3>
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <Badge variant="secondary" className="capitalize">
                          {selectedJob.employment_type}
                        </Badge>
                        <span>{selectedJob.location || 'Remote'}</span>
                        <span>•</span>
                        <span>{selectedJob.department || 'General'}</span>
                      </div>
                    </div>

                    {selectedJob.job_id && (
                      <div className="text-sm">
                        <span className="font-medium">Job ID: </span>
                        <span className="font-mono text-blue-600">{selectedJob.job_id}</span>
                      </div>
                    )}

                    {selectedJob.salary_range && (
                      <div className="text-sm">
                        <span className="font-medium">Salary: </span>
                        <span>{selectedJob.salary_range}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {selectedJob.created_at && (
                        <div>
                          <span className="font-medium">Posted Date: </span>
                          <span>{new Date(selectedJob.created_at).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}</span>
                        </div>
                      )}
                      {selectedJob.created_at && (
                        <div>
                          <span className="font-medium">Close Date: </span>
                          <span className="text-red-600 font-medium">{(() => {
                            const closeDate = new Date(selectedJob.created_at)
                            closeDate.setDate(closeDate.getDate() + 30)
                            return closeDate.toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          })()}</span>
                        </div>
                      )}
                    </div>

              {selectedJob.description && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Description</h4>
                  <div 
                    className="text-sm text-muted-foreground prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedJob.description }}
                  />
                </div>
              )}

                    {selectedJob.requirements && (
                      <div>
                        <h4 className="font-semibold mb-2 text-sm">Requirements</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {selectedJob.requirements}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-4 border-t">
                      <Badge
                        className={`capitalize ${
                          selectedJob.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : selectedJob.status === 'inactive'
                            ? 'bg-yellow-100 text-yellow-800'
                            : selectedJob.status === 'closed'
                            ? 'bg-red-100 text-red-800'
                            : selectedJob.status === 'hold'
                            ? 'bg-orange-100 text-orange-800'
                            : selectedJob.status === 'draft'
                            ? 'bg-gray-100 text-gray-800'
                            : ''
                        }`}
                      >
                        {selectedJob.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Posted on {new Date(selectedJob.created_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setViewDialogOpen(false)}
                    >
                      Close
                    </Button>
                  {hasModuleAccess('Edit Job') && (
                  <Button onClick={() => {
                    setViewDialogOpen(false)
                    router.push(`/recruiter/postings/new?id=${selectedJob?.id}`)
                  }}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Job
                  </Button>
                  )}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
