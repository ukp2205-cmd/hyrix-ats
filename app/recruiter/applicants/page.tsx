'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  LogOut,
  Settings,
  BarChart3,
  Search,
  Filter,
  Mail,
  Phone,
  MapPin,
  Briefcase as BriefcaseIcon,
  Star,
  MoreVertical,
  Download,
  Edit,
  Trash2,
  Menu
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'

export default function ApplicantsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { hasModuleAccess } = usePermissions()
  const [candidates, setCandidates] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeView, setActiveView] = useState<'card' | 'table'>('card') // Declare activeView and setActiveView

  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, href: '/recruiter' },
    { id: 'postings', label: 'Job Postings', icon: Briefcase, href: '/recruiter/postings' },
    { id: 'applicants', label: 'Applicants', icon: Users, href: '/recruiter?tab=candidates' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/recruiter/analytics' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/recruiter/settings' },
  ]

  useEffect(() => {
    fetchCandidates()
  }, [statusFilter])

  const fetchCandidates = async () => {
    setLoading(true)
    const supabase = createClient()
    
    // Get logged-in recruiter info and their UUID from org_team
    const userStr = localStorage.getItem('hyrix_user')
    let recruiterUserId = null
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        
        // Look up team member UUID from org_team table
        const { data: teamData } = await supabase
          .from('org_team')
          .select('id')
          .eq('email', user.email)
          .maybeSingle()
        
        recruiterUserId = teamData?.id
        console.log('[v0] Fetching candidates for recruiter UUID:', recruiterUserId, 'Email:', user.email)
      } catch (e) {
        console.error('[v0] Error parsing user data or fetching team member:', e)
      }
    }
    
    let query = supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false })

    // Filter by recruiter's assigned candidates only
    if (recruiterUserId) {
      query = query.eq('assigned_to', recruiterUserId)
    }

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data, error } = await query

    if (error) {
      console.error('[v0] Error fetching candidates:', error)
    } else {
      console.log('[v0] Fetched candidates count:', data?.length || 0)
      setCandidates(data || [])
    }
    setLoading(false)
  }

  const filteredCandidates = candidates.filter(candidate =>
    candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    candidate.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleSelectCandidate = (id: string) => {
    setSelectedCandidates(prev =>
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedCandidates.length === filteredCandidates.length) {
      setSelectedCandidates([])
    } else {
      setSelectedCandidates(filteredCandidates.map(c => c.id))
    }
  }

  const handleDeleteCandidate = async (candidateId: string, candidateName: string) => {
    if (!confirm(`Are you sure you want to delete ${candidateName}? This action cannot be undone.`)) {
      return
    }

    const supabase = createClient()
    const { error } = await supabase
      .from('candidates')
      .delete()
      .eq('id', candidateId)

    if (error) {
      console.error('[v0] Error deleting candidate:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete candidate. Please try again.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: `${candidateName} has been deleted successfully.`,
      })
      fetchCandidates()
    }
  }

  const handleDownloadResume = async (candidate: any) => {
    if (!candidate.cv_url) {
      toast({
        title: 'No Resume Available',
        description: 'This candidate has not uploaded a resume',
        variant: 'destructive'
      })
      return
    }

    try {
      // Fetch the resume file
      const response = await fetch(candidate.cv_url)
      const blob = await response.blob()
      
      // Get file extension from URL
      const urlParts = candidate.cv_url.split('.')
      const extension = urlParts[urlParts.length - 1].split('?')[0] || 'pdf'
      
      // Create filename in format: candidatename_hirix
      const sanitizedName = candidate.name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '')
      const filename = `${sanitizedName}_hirix.${extension}`
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      console.log('[v0] Resume downloaded:', filename)
      
      toast({
        title: 'Success',
        description: `Resume downloaded as ${filename}`
      })
    } catch (error) {
      console.error('[v0] Error downloading resume:', error)
      toast({
        title: 'Download Failed',
        description: 'Failed to download resume. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleEditCandidate = (candidateId: string) => {
    router.push(`/recruiter/applicants/${candidateId}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'shortlisted':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'ringing':
        return 'bg-blue-100 text-blue-800'
      case 'linedup':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRatingStars = (status: string) => {
    // Simple rating based on status
    const ratings: Record<string, number> = {
      'shortlisted': 5,
      'linedup': 4,
      'ringing': 3,
      'rejected': 2
    }
    return ratings[status] || 3
  }

  const handleExportToExcel = () => {
    // Create CSV content
    const headers = ['Name', 'Email', 'Phone', 'Location', 'Skills', 'Industry', 'Experience', 'Current CTC', 'Expected CTC', 'Notice Period', 'Status', 'Applied Date']
    
    const csvRows = [
      headers.join(','),
      ...filteredCandidates.map(candidate => [
        `"${candidate.name || ''}"`,
        `"${candidate.email || ''}"`,
        `"${candidate.mobile_number || ''}"`,
        `"${candidate.current_location || ''}"`,
        `"${candidate.skills || ''}"`,
        `"${candidate.industry || ''}"`,
        `"${candidate.experience_years || ''}"`,
        `"${candidate.current_ctc || ''}"`,
        `"${candidate.expected_ctc || ''}"`,
        `"${candidate.notice_period || ''}"`,
        `"${candidate.status || ''}"`,
        `"${new Date(candidate.created_at).toLocaleDateString()}"`,
      ].join(','))
    ]

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `candidates_export_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)

    toast({
      title: 'Export Successful',
      description: `Exported ${filteredCandidates.length} candidates to Excel`,
    })
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
            <p className="text-xs text-muted-foreground">Recruiter Portal</p>
          </div>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = item.id === 'applicants'
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex-shrink-0 h-16 border-b bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80 shadow-sm z-10">
          <div className="flex h-full items-center justify-between px-4 lg:px-8">
            <div>
              <h1 className="text-lg font-semibold">All Applicants</h1>
              <p className="text-xs text-muted-foreground">{filteredCandidates.length} total candidates</p>
            </div>
            <div className="flex items-center gap-2">
              {selectedCandidates.length > 0 && (
                <>
                  <Badge variant="secondary">{selectedCandidates.length} selected</Badge>
                  <Button variant="outline" size="sm">
                    Bulk Actions
                  </Button>
                </>
              )}
              {hasModuleAccess('Add Candidate') && (
              <Button 
                onClick={() => router.push('/recruiter/applicants/new')}
                size="sm"
                className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90"
              >
                <Users className="mr-2 h-4 w-4" />
                Add Candidate
              </Button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-gradient-to-br from-blue-50/30 via-white to-purple-50/20">
          <div className="max-w-7xl mx-auto">
            <Card className="p-6 shadow-sm">
              {/* Filters and Search */}
              <div className="flex flex-col md:flex-row gap-3 mb-5 justify-between">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search applicants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-9 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px] h-9 text-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="shortlisted">Shortlisted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="ringing">Ringing</SelectItem>
                      <SelectItem value="linedup">Lined Up</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleExportToExcel}
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 bg-transparent"
                  >
                    <Download className="h-4 w-4" />
                    Export to Excel
                  </Button>
                </div>
              </div>

              {/* Applicants Table */}
              <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr className="border-b">
                            <th className="px-3 py-2.5 text-left w-10">
                              <Checkbox
                                checked={selectedCandidates.length === filteredCandidates.length && filteredCandidates.length > 0}
                                onCheckedChange={toggleSelectAll}
                              />
                            </th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold">Candidate</th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold">Date</th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold">Status</th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold">Contact</th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold">Email</th>
                            <th className="px-3 py-2.5 w-10"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            <tr>
                              <td colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
                                Loading applicants...
                              </td>
                            </tr>
                          ) : filteredCandidates.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
                                No applicants found
                              </td>
                            </tr>
                          ) : (
                            filteredCandidates.map((candidate) => (
                              <tr 
                                key={candidate.id} 
                                className="border-b hover:bg-accent/50 transition-colors"
                              >
                                <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                                  <Checkbox
                                    checked={selectedCandidates.includes(candidate.id)}
                                    onCheckedChange={() => toggleSelectCandidate(candidate.id)}
                                  />
                                </td>
                                <td className="px-3 py-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-sm text-gray-900">
                      {candidate.name}
                    </span>
                    <button
                      onClick={() => router.push(`/recruiter/applicants/${candidate.id}`)}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline text-left w-fit"
                    >
                      View Profile
                    </button>
                  </div>
                                </td>
                                <td className="px-3 py-3 text-xs text-muted-foreground">
                                  {new Date(candidate.created_at).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                  })}
                                </td>
                                <td className="px-3 py-3">
                                  <Badge 
                                    variant="secondary"
                                    className={`${getStatusColor(candidate.status)} text-xs px-2 py-0.5`}
                                  >
                                    {candidate.status}
                                  </Badge>
                                </td>
                                <td className="px-3 py-3">
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    {candidate.mobile_number || 'N/A'}
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-xs text-muted-foreground max-w-[180px] truncate">
                                  {candidate.email}
                                </td>
                                <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 bg-transparent">
                                        <MoreVertical className="h-3.5 w-3.5" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDownloadResume(candidate)
                                        }}
                                        className="cursor-pointer"
                                        disabled={!candidate.cv_url}
                                      >
                                        <Download className="mr-2 h-4 w-4" />
                                        Download Resume
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleEditCandidate(candidate.id)
                                        }}
                                        className="cursor-pointer"
                                      >
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDeleteCandidate(candidate.id, candidate.name)
                                        }}
                                        className="cursor-pointer text-red-600 focus:text-red-600"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-muted-foreground">
                  Showing {filteredCandidates.length} of {candidates.length} applicants
                </p>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
