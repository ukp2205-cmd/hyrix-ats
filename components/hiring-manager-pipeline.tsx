'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, User, ChevronLeft, ChevronRight, GripVertical, LayoutGrid, Table2, Building2, Settings2, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Mail, Phone, MapPin, Briefcase, Award, FileText, DollarSign, Clock, Target, UserCircle2, Download, StickyNote } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface Candidate {
  id: string
  name: string
  status: string
  email: string
  mobile_number: string
  skills: string | string[]
  experience_years: string | number
  current_location?: string
  preferred_location?: string
  current_ctc?: string
  expected_ctc?: string
  notice_period?: string
  industry?: string
  cv_url?: string
  feedback?: string
}

interface HiringManagerPipelineProps {
  jobId: string
  jobTitle?: string
  jobLocation?: string
}

const PIPELINE_STAGES = [
  { id: 'screening', label: 'Screening', color: 'bg-blue-500', order: 0, dbStatus: 'ringing', applicationStage: 'screening' },
  { id: 'shortlisted', label: 'Shortlisted', color: 'bg-indigo-500', order: 1, dbStatus: 'shortlisted', applicationStage: 'screening' },
  { id: 'interview', label: 'Interview', color: 'bg-teal-500', order: 2, dbStatus: 'callback', applicationStage: 'interview' },
  { id: 'selection', label: 'Selection', color: 'bg-amber-500', order: 3, dbStatus: 'selection', applicationStage: 'offer', isSelection: true },
  { id: 'offer', label: 'Offer', color: 'bg-purple-500', order: 4, dbStatus: 'final_select', applicationStage: 'offer' },
  { id: 'closed', label: 'Closed', color: 'bg-gray-500', order: 5, dbStatus: 'closed', applicationStage: 'hired', isClosed: true }
]

// Selection stage sub-statuses
// Note: Selected candidates can move to Offer, Rejected candidates can only move backward
const SELECTION_STATUSES = [
  { id: 'selected', label: 'Selected', color: 'bg-green-500', dbStatus: 'selected', applicationStage: 'offer', canMoveForward: true },
  { id: 'selection_rejected', label: 'Rejected', color: 'bg-red-500', dbStatus: 'selection_rejected', applicationStage: 'offer', canMoveForward: false },
  { id: 'selection_hold', label: 'Hold', color: 'bg-orange-500', dbStatus: 'selection_hold', applicationStage: 'offer', canMoveForward: false }
]

// Closed stage sub-statuses
// Note: Both use 'hired' as applicationStage because the applications table constraint 
// only allows: applied, screening, interview, offer, hired
// The actual distinction is stored in candidates.status (hired vs rejected)
const CLOSED_STATUSES = [
  { id: 'offer_accepted', label: 'Offer Accepted', color: 'bg-green-500', dbStatus: 'hired', applicationStage: 'hired' },
  { id: 'offer_rejected', label: 'Offer Rejected', color: 'bg-red-500', dbStatus: 'rejected', applicationStage: 'hired' }
]

export default function HiringManagerPipeline({ jobId, jobTitle, jobLocation }: HiringManagerPipelineProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { userEmail } = useAuth()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [hiredCount, setHiredCount] = useState(0)
  const [rejectedCount, setRejectedCount] = useState(0)
  const [companyName, setCompanyName] = useState<string>('')
  const [draggedCandidate, setDraggedCandidate] = useState<{ id: string; fromStage: string } | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')
  const [showClosedDialog, setShowClosedDialog] = useState(false)
  const [pendingClosedCandidate, setPendingClosedCandidate] = useState<{ id: string, name: string } | null>(null)
  const [showSelectionDialog, setShowSelectionDialog] = useState(false)
  const [pendingSelectionCandidate, setPendingSelectionCandidate] = useState<{ id: string, name: string } | null>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [loadingCandidateDetails, setLoadingCandidateDetails] = useState(false)
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState({
  name: true,
  email: true,
  phone: true,
  skills: false,
  currentStage: false,
  dateJoined: false,
  stageDate: false,
  recruiterName: false,
  experience: false,
  industry: false,
  source: false,
  currentLocation: false,
  preferredLocation: false,
  currentCtc: false,
  expectedCtc: false,
  noticePeriod: false,
  area: false,
  feedback: false
  })
  const [columnOrder, setColumnOrder] = useState<string[]>([
  'name', 'email', 'phone', 'skills', 'currentStage', 'dateJoined', 'stageDate',
  'recruiterName', 'experience', 'industry', 'source', 'currentLocation',
  'preferredLocation', 'currentCtc', 'expectedCtc', 'noticePeriod', 'area', 'feedback'
  ])
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState<Date | null>(null)
  const [datePreset, setDatePreset] = useState<'24h' | '7d' | '30d' | 'custom' | null>(null)
  const [recruiterMap, setRecruiterMap] = useState<Record<string, string>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [feedbackCandidate, setFeedbackCandidate] = useState<{ id: string, name: string, feedback?: string } | null>(null)
  const [feedbackText, setFeedbackText] = useState('')

  // Load column settings from localStorage on mount
  useEffect(() => {
    // Clear stale old cache keys from previous versions
    localStorage.removeItem('hiringPipeline_visibleColumns_v2')
    localStorage.removeItem('hiringPipeline_columnOrder_v2')

    const savedColumns = localStorage.getItem('hiringPipeline_visibleColumns_v3')
    const savedOrder   = localStorage.getItem('hiringPipeline_columnOrder_v3')

    const defaultCols = {
      name: true, email: true, phone: true, skills: false,
      currentStage: false, dateJoined: false, stageDate: false,
      recruiterName: false, experience: false, industry: false,
      source: false, currentLocation: false, preferredLocation: false,
      currentCtc: false, expectedCtc: false, noticePeriod: false,
      area: false, feedback: false
    }
    const defaultOrder = [
      'name', 'email', 'phone', 'skills', 'currentStage', 'dateJoined', 'stageDate',
      'recruiterName', 'experience', 'industry', 'source', 'currentLocation',
      'preferredLocation', 'currentCtc', 'expectedCtc', 'noticePeriod', 'area', 'feedback'
    ]

    if (savedColumns) {
      try {
        const parsed = JSON.parse(savedColumns)
        // Merge: always include new keys like 'feedback' even if not in old saved data
        setVisibleColumns({ ...defaultCols, ...parsed })
      } catch { /* ignore */ }
    }

    if (savedOrder) {
      try {
        const parsed: string[] = JSON.parse(savedOrder)
        // Append any columns missing from old saved order
        const missing = defaultOrder.filter(c => !parsed.includes(c))
        setColumnOrder([...parsed, ...missing])
      } catch { /* ignore */ }
    }
  }, [])
  
  // Save column settings to localStorage whenever they change
  useEffect(() => {
  localStorage.setItem('hiringPipeline_visibleColumns_v3', JSON.stringify(visibleColumns))
  }, [visibleColumns])
  
  useEffect(() => {
  localStorage.setItem('hiringPipeline_columnOrder_v3', JSON.stringify(columnOrder))
  }, [columnOrder])

  // Reset to page 1 when date filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [dateFilter])

  useEffect(() => {
    fetchCandidates()
  }, [jobId])

  const fetchCandidateDetails = async (candidateId: string) => {
    setLoadingCandidateDetails(true)
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .single()

    if (error) {
      console.error('[v0] Error fetching candidate details:', error)
      toast({
        title: 'Error',
        description: 'Failed to load candidate details',
        variant: 'destructive'
      })
    } else {
      setSelectedCandidate(data)
    }
    setLoadingCandidateDetails(false)
  }

  async function fetchCandidates() {
    const supabase = createClient()
    
    // Fetch job details to get client_name
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select('client_name')
      .eq('id', jobId)
      .maybeSingle()
    
    if (jobData?.client_name) {

      setCompanyName(jobData.client_name)
    }
    
    // Fetch all candidates for this job from manager_pipeline table
    // Hiring managers see ALL candidates for their jobs, regardless of which recruiter they're assigned to

    
    const { data: pipelineData, error: pipelineError} = await supabase
      .from('manager_pipeline')
      .select('*')
      .eq('job_id', jobId)
      .order('updated_at', { ascending: false })
    

    
    if (!pipelineError && pipelineData) {
      // Map manager_pipeline entries to candidate format
      const candidatesWithStage = pipelineData.map((entry: any) => ({
        id: entry.candidate_id,
        name: entry.candidate_name,
        email: entry.email,
        mobile_number: entry.mobile_number,
        skills: entry.skills,
        experience_years: entry.experience_years,
        current_ctc: entry.current_ctc,
        expected_ctc: entry.expected_ctc,
        notice_period: entry.notice_period,
        current_location: entry.current_location,
        preferred_location: entry.preferred_location,
        feedback: entry.feedback,
        status: entry.selection_status || entry.stage, // Use selection_status for Selection stage, stage for others
        pipelineId: entry.id,
        stage: entry.stage,
        stageOrder: entry.stage_order,
        assigned_to: entry.assigned_recruiter,
        created_at: entry.created_at, // Date when candidate was added to pipeline
        updated_at: entry.updated_at  // Date when candidate stage/status was last updated
      }))
      
      // Filter out candidates with unavailable statuses
      // Show candidates who are actively in the hiring pipeline OR in closed stages (hired/rejected)
      // NOTE: "selection_hold" is different from "on hold" - it means candidate is in selection stage with hold status
      const excludedStatuses = [
        'not reachable',
        'not interested',
        'linedup', // Initial stage before screening
        'withdrawn'
      ]
      
      const activeCandidates = candidatesWithStage.filter(c => {
        const status = (c.status?.toLowerCase() || '').replace(/_/g, ' ')
        // Include hired and rejected candidates, exclude others in the list
        return !excludedStatuses.some(excluded => status.includes(excluded))
      })
      

      
      // Fetch recruiter names for assigned candidates
      const recruiterIds = [...new Set(activeCandidates.map(c => c.assigned_to).filter(Boolean))]
      if (recruiterIds.length > 0) {
        const { data: recruitersData } = await supabase
          .from('org_team')
          .select('id, name')
          .in('id', recruiterIds)
        
        if (recruitersData) {
          const recruiterMapping: Record<string, string> = {}
          recruitersData.forEach((r: any) => {
            recruiterMapping[r.id] = r.name
          })
          setRecruiterMap(recruiterMapping)
    
        }
      }
      
      setCandidates(activeCandidates)
      
      // Count hired and rejected candidates from all candidates
      const hired = candidatesWithStage.filter(c => c.status?.toLowerCase() === 'hired').length
      const rejected = candidatesWithStage.filter(c => c.status?.toLowerCase() === 'rejected').length
      setHiredCount(hired)
      setRejectedCount(rejected)
    } else {
      console.error('[v0] Error fetching manager pipeline:', pipelineError)
    }
    
    setLoading(false)
  }

  const getCandidatesForStage = (stageId: string) => {
    // Filter candidates based on their stage field (the actual stage they're in)
    // The status field contains either selection_status (for selection/closed) or stage value
    return candidates.filter(c => {
      const candidateStage = c.stage?.toLowerCase()
      const candidateStatus = c.status?.toLowerCase()
      
      // For regular stages (screening, shortlisted, interview, offer), match by stage
      if (stageId === 'screening' || stageId === 'shortlisted' || stageId === 'interview' || stageId === 'offer') {
        return candidateStage === stageId
      }
      
      // Selection stage shows all candidates where stage='selection'
      if (stageId === 'selection') {
        return candidateStage === 'selection'
      }
      
      // Closed stage shows all candidates where stage='closed'
      if (stageId === 'closed') {
        return candidateStage === 'closed'
      }
      
      return false
    })
  }

  const handleDragStart = (candidateId: string, stageId: string) => {

    setDraggedCandidate({ id: candidateId, fromStage: stageId })
  }

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    setDragOverStage(stageId)
  }

  const handleDragLeave = () => {
    setDragOverStage(null)
  }

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault()
    setDragOverStage(null)

    if (!draggedCandidate) return

    const fromStageIndex = PIPELINE_STAGES.findIndex(s => s.id === draggedCandidate.fromStage)
    const toStageIndex = PIPELINE_STAGES.findIndex(s => s.id === targetStageId)

    // Check if movement is only 1 step forward or backward
    const stageDiff = toStageIndex - fromStageIndex
    
    if (Math.abs(stageDiff) !== 1) {
      toast({
        title: 'Invalid Move',
        description: 'You can only move candidates one stage forward or backward',
        variant: 'destructive'
      })
      setDraggedCandidate(null)
      return
    }

    // Check if candidate is rejected from selection and trying to move forward
    const candidate = candidates.find(c => c.id === draggedCandidate.id)
    if (candidate && candidate.status === 'selection_rejected' && stageDiff > 0) {
      toast({
        title: 'Invalid Move',
        description: 'Rejected candidates cannot move forward. They can only be moved backward.',
        variant: 'destructive'
      })
      setDraggedCandidate(null)
      return
    }

    // If dropping into selection stage, show dialog to choose Selected/Rejected
    const targetStageData = PIPELINE_STAGES.find(s => s.id === targetStageId)
    if (targetStageData?.isSelection) {
      if (candidate) {
        setPendingSelectionCandidate({ id: candidate.id, name: candidate.name })
        setShowSelectionDialog(true)
      }
      setDraggedCandidate(null)
      return
    }

    // If dropping into closed stage, show dialog to choose Offer Accepted/Rejected
    if (targetStageData?.isClosed) {
      if (candidate) {
        setPendingClosedCandidate({ id: candidate.id, name: candidate.name })
        setShowClosedDialog(true)
      }
      setDraggedCandidate(null)
      return
    }

    // Get the database status for the target stage
    const targetStage = PIPELINE_STAGES.find(s => s.id === targetStageId)
    if (!targetStage) return

    const newStatus = targetStage.dbStatus




    const supabase = createClient()

  
  // Update manager_pipeline table (separate from recruiter's applications table)
  const { data: pipelineUpdate, error: pipelineError } = await supabase
    .from('manager_pipeline')
    .update({
      stage: targetStageId,
      stage_order: toStageIndex,
      selection_status: null, // Clear selection status when moving out of selection stage
      updated_at: new Date().toISOString()
    })
    .eq('candidate_id', draggedCandidate.id)
    .eq('job_id', jobId)
    .select()
  
  console.log('[v0] Manager pipeline update result:', pipelineUpdate)
  
  if (pipelineError) {
    console.error('[v0] Database update error:', pipelineError)
    toast({
      title: 'Error',
      description: 'Failed to update candidate stage',
      variant: 'destructive'
    })
  } else {

      toast({
        title: 'Success',
        description: `Candidate moved to ${targetStage.label}`,
      })
      // Refresh candidates
      fetchCandidates()
    }

    setDraggedCandidate(null)
  }

  const moveCandidate = async (candidateId: string, currentStage: string, direction: 'forward' | 'backward') => {
    const currentStageIndex = PIPELINE_STAGES.findIndex(s => s.id === currentStage)
    if (currentStageIndex === -1) return

    const newStageIndex = direction === 'forward' ? currentStageIndex + 1 : currentStageIndex - 1
    
    // Prevent moving beyond boundaries (excluding closed stages)
    const maxNonClosedIndex = PIPELINE_STAGES.findIndex(s => s.isClosed) - 1
    if (newStageIndex < 0 || newStageIndex > maxNonClosedIndex) {
      toast({
        title: 'Cannot move',
        description: 'Candidate is at the boundary of the pipeline. Use dropdown to close.',
        variant: 'destructive'
      })
      return
    }

    const newStage = PIPELINE_STAGES[newStageIndex]
    
    // If moving to selection or closed stage, show dialog
    if (newStage.isSelection) {
      const candidate = candidates.find(c => c.id === candidateId)
      if (candidate) {
        setPendingSelectionCandidate({ id: candidate.id, name: candidate.name })
        setShowSelectionDialog(true)
      }
      return
    }
    
    if (newStage.isClosed) {
      const candidate = candidates.find(c => c.id === candidateId)
      if (candidate) {
        setPendingClosedCandidate({ id: candidate.id, name: candidate.name })
        setShowClosedDialog(true)
      }
      return
    }



    const supabase = createClient()
    
    // Update manager_pipeline table (the source of truth for hiring manager view)
    const { data: pipelineUpdate, error: pipelineError } = await supabase
      .from('manager_pipeline')
      .update({
        stage: newStage.id,
        stage_order: newStageIndex,
        selection_status: null, // Clear selection status when moving out of selection stage
        updated_at: new Date().toISOString()
      })
      .eq('candidate_id', candidateId)
      .eq('job_id', jobId)
      .select()



    if (pipelineError) {
      console.error('[v0] Error moving candidate:', pipelineError)
      toast({
        title: 'Error',
        description: `Failed to move candidate: ${pipelineError.message}`,
        variant: 'destructive'
      })
    } else {

      toast({
        title: 'Success',
        description: `Candidate moved to ${newStage.label}`,
      })
      // Refresh candidates
      fetchCandidates()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading pipeline...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Job Details Header */}
      <div className="space-y-6">
        {/* Job Title with Back Arrow */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/hiring-manager')}
            className="p-2 h-auto text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            {companyName && `${companyName} - `}{jobTitle || 'Job Details'}
          </h1>
        </div>

        {/* Job Info */}
        <div className="flex items-center gap-4 text-sm text-gray-600 ml-14">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-500">Job ID:</span>
            <Badge variant="outline" className="font-mono text-xs">
              {jobId.substring(0, 8)}
            </Badge>
          </div>
          {jobLocation && (
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-500">Location:</span>
              <span className="text-gray-700">{jobLocation}</span>
            </div>
          )}
        </div>

        {/* Pipeline Title and View Toggle */}
        <div className="ml-14 pt-2 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Hiring Manager Pipeline</h2>
            <p className="text-sm text-gray-600 mt-1">Track and manage candidates through the hiring process</p>
          </div>
          
          {/* View Toggle Icons */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('card')}
                className={`h-8 px-3 ${
                  viewMode === 'card'
                    ? 'bg-white shadow-sm text-black hover:bg-white hover:text-black'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-black'
                }`}
                title="Card View"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('table')}
                className={`h-8 px-3 ${
                  viewMode === 'table'
                    ? 'bg-white shadow-sm text-black hover:bg-white hover:text-black'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-black'
                }`}
                title="Table View"
              >
                <Table2 className="h-4 w-4" />
              </Button>
            </div>
            
            {viewMode === 'table' && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 gap-2"
                  onClick={() => setShowColumnCustomizer(true)}
                >
                  <Settings2 className="h-4 w-4" />
                  Customize Columns
                </Button>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-2">
                      <Calendar className="h-4 w-4" />
                      {datePreset === '24h' && 'Last 24 Hours'}
                      {datePreset === '7d' && 'Last 7 Days'}
                      {datePreset === '30d' && 'Last 30 Days'}
                      {datePreset === 'custom' && dateFilter ? new Date(dateFilter).toLocaleDateString() : ''}
                      {!datePreset && 'Filter by Date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3" align="end">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm mb-3">Date Filter</h4>
                      <Button
                        variant={datePreset === '24h' ? 'default' : 'outline'}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          setDatePreset('24h')
                          const yesterday = new Date()
                          yesterday.setHours(yesterday.getHours() - 24)
                    
                          setDateFilter(yesterday)
                          setCurrentPage(1)
                        }}
                      >
                        Last 24 Hours
                      </Button>
                      <Button
                        variant={datePreset === '7d' ? 'default' : 'outline'}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          setDatePreset('7d')
                          const weekAgo = new Date()
                          weekAgo.setDate(weekAgo.getDate() - 7)
                          weekAgo.setHours(0, 0, 0, 0)
                    
                          setDateFilter(weekAgo)
                          setCurrentPage(1)
                        }}
                      >
                        Last 7 Days
                      </Button>
                      <Button
                        variant={datePreset === '30d' ? 'default' : 'outline'}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          setDatePreset('30d')
                          const monthAgo = new Date()
                          monthAgo.setDate(monthAgo.getDate() - 30)
                          monthAgo.setHours(0, 0, 0, 0)
                    
                          setDateFilter(monthAgo)
                          setCurrentPage(1)
                        }}
                      >
                        Last 30 Days
                      </Button>
                      
                      <div className="border-t pt-3 mt-3">
                        <label className="text-xs font-medium text-gray-600 mb-2 block">Custom Date Range</label>
                        <div className="space-y-2">
                          <input
                            type="date"
                            onChange={(e) => {
                              if (e.target.value) {
                                const selectedDate = new Date(e.target.value)
                                selectedDate.setHours(0, 0, 0, 0)
                          
                                setDateFilter(selectedDate)
                                setDatePreset('custom')
                                setCurrentPage(1)
                              }
                            }}
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Select date"
                          />
                          <p className="text-xs text-gray-500">Shows candidates on this specific date</p>
                        </div>
                      </div>
                      
                      {dateFilter && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDateFilter(null)
                            setDatePreset(null)
                          }}
                          className="w-full mt-2"
                        >
                          Clear Filter
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </>
            )}
          </div>
        </div>

        {/* Customize Columns Sheet */}
        <Sheet open={showColumnCustomizer} onOpenChange={setShowColumnCustomizer}>
          <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Customize Columns</SheetTitle>
              <SheetDescription>
                Select which columns to display and drag to reorder them
              </SheetDescription>
            </SheetHeader>
            
            <div className="mt-6 space-y-1">
              {columnOrder.map((columnKey, index) => {
                const columnLabels: Record<string, string> = {
                  name: 'Candidate Name',
                  email: 'Email',
                  phone: 'Phone',
                  skills: 'Skills',
                  currentStage: 'Current Stage',
                  dateJoined: 'Date Joined',
                  stageDate: 'Stage Date',
                  recruiterName: 'Recruiter Name',
                  experience: 'Experience',
                  industry: 'Industry',
                  source: 'Source',
                  currentLocation: 'Current Location',
                  preferredLocation: 'Preferred Location',
                  quality: 'Quality',
                  expectedCtc: 'Expected CTC',
                  currentCtc: 'Current CTC',
                  noticePeriod: 'Notice Period',
                  area: 'Area',
                  feedback: 'Feedback'
                }
                
                return (
                  <div
                    key={columnKey}
                    draggable
                    onDragStart={() => setDraggedColumn(columnKey)}
                    onDragOver={(e) => {
                      e.preventDefault()
                      if (draggedColumn && draggedColumn !== columnKey) {
                        const newOrder = [...columnOrder]
                        const draggedIndex = newOrder.indexOf(draggedColumn)
                        const targetIndex = newOrder.indexOf(columnKey)
                        newOrder.splice(draggedIndex, 1)
                        newOrder.splice(targetIndex, 0, draggedColumn)
                        setColumnOrder(newOrder)
                      }
                    }}
                    onDragEnd={() => setDraggedColumn(null)}
                    className={`flex items-center gap-3 p-3 rounded-md border bg-white hover:bg-gray-50 cursor-move transition-colors ${
                      draggedColumn === columnKey ? 'opacity-50 border-blue-400' : ''
                    }`}
                  >
                    <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <Checkbox
                      id={`col-${columnKey}`}
                      checked={visibleColumns[columnKey as keyof typeof visibleColumns]}
                      onCheckedChange={(checked) => 
                        setVisibleColumns({ ...visibleColumns, [columnKey]: !!checked })
                      }
                    />
                    <Label htmlFor={`col-${columnKey}`} className="text-sm font-normal cursor-pointer flex-1">
                      {columnLabels[columnKey] || columnKey}
                    </Label>
                  </div>
                )
              })}
            </div>
          </SheetContent>
        </Sheet>


      </div>

      {/* Card View - Pipeline Board */}
      {viewMode === 'card' && (
        <div className="w-full overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max px-1">
        {PIPELINE_STAGES.map((stage) => {
          const stageCandidates = getCandidatesForStage(stage.id)
          const count = stageCandidates.length
          const isDropTarget = dragOverStage === stage.id

          return (
            <Card 
              key={stage.id} 
              className={`flex-shrink-0 w-52 p-3 transition-all flex flex-col h-[calc(100vh-320px)] ${
                isDropTarget ? 'bg-blue-50 border-2 border-blue-400 ring-2 ring-blue-200' : 'bg-gray-50'
              }`}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Stage Header */}
              <div className="mb-4 flex-shrink-0">
                <div className={`${stage.color} text-white px-4 py-2 rounded-lg text-center font-medium`}>
                  {stage.label}
                </div>
                <div className="mt-2 text-center">
                  <span className="font-bold text-lg">{count}</span>
                  <span className="text-sm text-gray-600 ml-1">Candidates</span>
                  {stage.needsAction && stageCandidates.length > 0 && (
                    <div className="text-xs text-yellow-600 mt-1">(Your Action)</div>
                  )}
                </div>
              </div>

  {/* Candidates List - Scrollable container */}
  <div className="space-y-2 overflow-y-auto flex-1 pr-2"
    style={{
      scrollbarWidth: 'thin',
      scrollbarColor: '#CBD5E0 #F7FAFC'
    }}
  >
                {stage.id === 'selection' ? (
                  // Selection stage with three subsections: Selected, Rejected, and Hold
                  <>
                    {SELECTION_STATUSES.map((selectionStatus) => {
                      const selectionCandidates = candidates.filter(c => {
                        // Match by stage first (must be in selection stage)
                        if (c.stage?.toLowerCase() !== 'selection') return false
                        // Then match by selection_status (stored in c.status)
                        return c.status?.toLowerCase() === selectionStatus.dbStatus.toLowerCase()
                      })
                      
                      // Always render the subsection (even if empty) so users can see all status categories
                      return (
                        <div key={selectionStatus.id} className="mb-4">
                          {/* Subsection Header */}
                          <div className={`${selectionStatus.color} text-white px-2 py-1 rounded text-xs font-semibold mb-2`}>
                            {selectionStatus.label} ({selectionCandidates.length})
                          </div>
                          
                          {/* Candidates in this subsection */}
                          <div className="space-y-2">
                            {selectionCandidates.length > 0 ? (
                              selectionCandidates.map((candidate) => {
                                const isDragging = draggedCandidate?.id === candidate.id
                                
                                return (
                                  <Card
                                    key={candidate.id}
                                    draggable={true}
                                    onDragStart={() => handleDragStart(candidate.id, 'selection')}
                                    className={`p-3 bg-white hover:shadow-md transition-shadow cursor-move group ${
                                      isDragging ? 'opacity-50 border-2 border-blue-400' : ''
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 flex-1">
                                      <GripVertical className="h-4 w-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
                                      <div className="flex flex-col flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                          <span className="text-sm font-medium text-gray-900 truncate">
                                            {candidate.name}
                                          </span>
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            fetchCandidateDetails(candidate.id)
                                          }}
                                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline ml-6 text-left"
                                        >
                                          View Profile
                                        </button>
                                      </div>
                                    </div>
                                  </Card>
                                )
                              })
                            ) : (
                              <p className="text-xs text-gray-400 italic px-2">No candidates</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </>
                ) : stage.id === 'closed' ? (
                  // Closed stage with two subsections: Offer Accepted and Offer Rejected
                  <>
                    {CLOSED_STATUSES.map((closedStatus) => {
                      const closedCandidates = candidates.filter(c => {
                        // Match by stage first (must be in closed stage)
                        if (c.stage?.toLowerCase() !== 'closed') return false
                        // Then match by closed status
                        return c.status?.toLowerCase() === closedStatus.dbStatus.toLowerCase()
                      })
                      
                      // Always render the subsection (even if empty)
                      return (
                        <div key={closedStatus.id} className="mb-4">
                          {/* Subsection Header */}
                          <div className={`${closedStatus.color} text-white px-2 py-1 rounded text-xs font-semibold mb-2`}>
                            {closedStatus.label} ({closedCandidates.length})
                          </div>
                          
                          {/* Candidates in this subsection */}
                          <div className="space-y-2">
                            {closedCandidates.length > 0 ? (
                              closedCandidates.map((candidate) => {
                                const isDragging = draggedCandidate?.id === candidate.id
                                
                                return (
                                  <Card
                                    key={candidate.id}
                                    draggable={true}
                                    onDragStart={() => handleDragStart(candidate.id, 'closed')}
                                    className={`p-3 bg-white hover:shadow-md transition-shadow cursor-move group ${
                                      isDragging ? 'opacity-50 border-2 border-blue-400' : ''
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 flex-1">
                                      <GripVertical className="h-4 w-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
                                      <div className="flex flex-col flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                          <span className="text-sm font-medium text-gray-900 truncate">
                                            {candidate.name}
                                          </span>
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            fetchCandidateDetails(candidate.id)
                                          }}
                                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline ml-6 text-left"
                                        >
                                          View Profile
                                        </button>
                                      </div>
                                    </div>
                                  </Card>
                                )
                              })
                            ) : (
                              <p className="text-xs text-gray-400 italic px-2">No candidates</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </>
                ) : (
                  // Regular stages - show candidates with drag and drop
                  stageCandidates.map((candidate) => {
                    const currentStageIndex = PIPELINE_STAGES.findIndex(s => s.id === stage.id)
                    const closedStageIndex = PIPELINE_STAGES.findIndex(s => s.isClosed)
                    const canMoveBackward = currentStageIndex > 0 && !stage.isClosed
                    // Allow moving forward up to and INCLUDING the stage before closed (Offer can move to Closed via dialog)
                    const canMoveForward = currentStageIndex < closedStageIndex && !stage.isClosed
                    const isDragging = draggedCandidate?.id === candidate.id
                    const isOfferStage = stage.id === 'offer'
                    
                    return (
                      <Card
                        key={candidate.id}
                        draggable={stage.id !== 'closed'}
                        onDragStart={() => handleDragStart(candidate.id, stage.id)}
                        className={`p-3 bg-white hover:shadow-md transition-shadow group cursor-move ${
                          isDragging ? 'opacity-50 border-2 border-blue-400' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <GripVertical className="h-4 w-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
                            <div className="flex flex-col flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <span className="text-sm font-medium text-gray-900 truncate">
                                  {candidate.name}
                                </span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  fetchCandidateDetails(candidate.id)
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 hover:underline ml-6 text-left"
                              >
                                View Profile
                              </button>
                            </div>
                          </div>
                          
                          {/* Stage Navigation Arrows */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {canMoveBackward && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-gray-200"
                              onClick={(e) => {
                                e.stopPropagation()
                                moveCandidate(candidate.id, stage.id, 'backward')
                              }}
                              title="Move to previous stage"
                            >
                                <ChevronLeft className="h-4 w-4 text-gray-600" />
                              </Button>
                            )}
                            {canMoveForward && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-gray-200"
                              onClick={(e) => {
                                e.stopPropagation()
                                // If moving from Offer to Closed, show dialog
                                if (isOfferStage) {
                                  setPendingClosedCandidate({ id: candidate.id, name: candidate.name })
                                  setShowClosedDialog(true)
                                  } else {
                                    moveCandidate(candidate.id, stage.id, 'forward')
                                  }
                                }}
                                title={isOfferStage ? "Close candidate" : "Move to next stage"}
                              >
                                <ChevronRight className="h-4 w-4 text-gray-600" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    )
                  })
                )}
              </div>
            </Card>
          )
        })}
        </div>
      </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <>
          <div className="bg-white rounded-lg border overflow-auto max-h-[calc(100vh-280px)]"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#CBD5E0 #F7FAFC'
            }}
          >
            <Table className="min-w-max">
              <TableHeader>
                <TableRow>
                  {columnOrder.map((columnKey) => {
                  if (!visibleColumns[columnKey as keyof typeof visibleColumns]) return null
                  
                  const columnLabels: Record<string, string> = {
                    name: 'Candidate Name',
                    email: 'Email',
                    phone: 'Phone',
                    skills: 'Skills',
                    currentStage: 'Current Stage',
                    dateJoined: 'Date Joined',
                    stageDate: 'Stage Date',
                    recruiterName: 'Recruiter',
                    experience: 'Experience',
                    industry: 'Industry',
                    source: 'Source',
                    currentLocation: 'Current Location',
                    preferredLocation: 'Preferred Location',
                    feedback: 'Feedback',
                    quality: 'Quality',
                    expectedCtc: 'Expected CTC',
                    currentCtc: 'Current CTC',
                    noticePeriod: 'Notice Period',
                    area: 'Area'
                  }
                  
                  const className = columnKey === 'name' ? 'w-[250px]' : columnKey === 'currentStage' ? 'w-[220px]' : ''
                  
                  return (
                    <TableHead key={columnKey} className={className}>
                      {columnLabels[columnKey]}
                    </TableHead>
                  )
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.length === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={Object.values(visibleColumns).filter(Boolean).length} 
                    className="text-center py-8 text-gray-500"
                  >
                    No candidates found for this job
                  </TableCell>
                </TableRow>
              ) : (
                (() => {
                  // Filter candidates by date if filter is active (using Date Joined - created_at)
                  let filteredCandidates = candidates
                  if (dateFilter) {

                    filteredCandidates = candidates.filter(candidate => {
                      // Use created_at for "Date Joined" column filtering
                      const candidateDate = new Date(candidate.created_at)
                      const filterDate = new Date(dateFilter)
                      
                      // For custom date filter, match exact date (same day)
                      if (datePreset === 'custom') {
                        const candidateDay = candidateDate.toISOString().split('T')[0]
                        const filterDay = filterDate.toISOString().split('T')[0]
                        const match = candidateDay === filterDay

                        return match
                      }
                      
                      // For preset filters (24h, 7d, 30d), show candidates from filterDate until now
                      const now = new Date()
                      const isAfterFilterDate = candidateDate >= filterDate
                      const isBeforeNow = candidateDate <= now

                      return isAfterFilterDate && isBeforeNow
                    })

                  }
                  
                  // Show "No data found" if filtering resulted in no candidates
                  if (filteredCandidates.length === 0) {
                    return (
                      <TableRow>
                        <TableCell 
                          colSpan={Object.values(visibleColumns).filter(Boolean).length} 
                          className="text-center py-8 text-gray-500"
                        >
                          No candidates found for the selected date filter
                        </TableCell>
                      </TableRow>
                    )
                  }
                  
                  // Paginate candidates
                  const startIndex = (currentPage - 1) * itemsPerPage
                  const endIndex = startIndex + itemsPerPage
                  const paginatedCandidates = filteredCandidates.slice(startIndex, endIndex)
                  
  return paginatedCandidates.map((candidate) => {
  // Determine current stage/status from candidate.stage and candidate.status
  let currentStageId = ''
  const candidateStage = candidate.stage?.toLowerCase()
  const candidateStatus = candidate.status?.toLowerCase()
  
  // Check if candidate is in a selection sub-status (selected, rejected, hold)
  if (candidateStage === 'selection') {
    const selectionStatus = SELECTION_STATUSES.find(s => s.dbStatus === candidateStatus)
    currentStageId = selectionStatus?.id || candidateStage
  }
  // Check if candidate is in closed stage (hired, rejected)
  else if (candidateStage === 'closed') {
    if (candidateStatus === 'hired') {
      currentStageId = 'offer_accepted'
    } else if (candidateStatus === 'rejected') {
      currentStageId = 'offer_rejected'
    } else {
      currentStageId = 'closed'
    }
  }
  // For all other stages, use the candidate.stage directly
  else {
    currentStageId = candidateStage || ''
  }

                  const handleStageChange = async (newStageId: string) => {
                    // Check if it's a selection status, closed status, or regular stage
                    const selectionStatus = SELECTION_STATUSES.find(s => s.id === newStageId)
                    const closedStatus = CLOSED_STATUSES.find(s => s.id === newStageId)
                    const newStage = selectionStatus || closedStatus || PIPELINE_STAGES.find(s => s.id === newStageId)
                    if (!newStage) return

                    const newStatus = newStage.dbStatus
                    const applicationStage = newStage.applicationStage || 'hired'
                    const newStageIndex = selectionStatus
                      ? PIPELINE_STAGES.findIndex(s => s.isSelection) // Use selection stage index
                      : closedStatus 
                      ? PIPELINE_STAGES.findIndex(s => s.isClosed) // Use closed stage index
                      : PIPELINE_STAGES.findIndex(s => s.id === newStageId)


  
  const supabase = createClient()
  
  // Determine if we're setting a selection status or a regular stage
  const isSelectionStatus = !!selectionStatus
  const isClosedStatus = !!closedStatus
  
  // Update manager_pipeline table
  const { data: pipelineUpdate, error: pipelineError } = await supabase
    .from('manager_pipeline')
    .update({
      stage: isSelectionStatus ? 'selection' : isClosedStatus ? 'closed' : newStageId,
      stage_order: newStageIndex,
      selection_status: isSelectionStatus || isClosedStatus ? newStatus : null,
      updated_at: new Date().toISOString()
    })
    .eq('candidate_id', candidate.id)
    .eq('job_id', jobId)
    .select()
  
  if (pipelineError) {
    console.error('[v0] Error updating stage:', pipelineError)
    toast({
      title: 'Error',
      description: `Failed to update stage: ${pipelineError.message}`,
      variant: 'destructive'
    })
  } else {

    toast({
      title: 'Success',
      description: `Candidate moved to ${newStage.label}`,
    })
    fetchCandidates()
  }
                  }

                  const renderCell = (columnKey: string) => {
                    if (!visibleColumns[columnKey as keyof typeof visibleColumns]) return null
                    
                    switch (columnKey) {
                      case 'name':
                        return (
                          <TableCell key={columnKey} className="font-medium">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span 
                                className="text-blue-600 hover:text-blue-800 cursor-pointer"
                                onClick={() => fetchCandidateDetails(candidate.id)}
                              >
                                {candidate.name}
                              </span>
                            </div>
                          </TableCell>
                        )
                      case 'email':
                        return <TableCell key={columnKey} className="text-sm text-gray-600">{candidate.email || '-'}</TableCell>
                      case 'phone':
                        return <TableCell key={columnKey} className="text-sm text-gray-600">{candidate.mobile_number || '-'}</TableCell>
                      case 'skills':
                        return <TableCell key={columnKey} className="text-sm text-gray-600 max-w-[200px] truncate">{candidate.skills || '-'}</TableCell>
                      case 'currentStage':
                        return (
                          <TableCell key={columnKey}>
                          <Select
                            value={currentStageId}
                            onValueChange={handleStageChange}
                          >
                            <SelectTrigger className="h-8 text-xs w-[180px]">
                              <SelectValue>
                                {currentStageId ? (
                                  <span className="flex items-center gap-1">
                                    {(() => {
                                      const selectionStatus = SELECTION_STATUSES.find(s => s.id === currentStageId)
                                      const closedStatus = CLOSED_STATUSES.find(s => s.id === currentStageId)
                                      const stage = selectionStatus || closedStatus || PIPELINE_STAGES.find(s => s.id === currentStageId)
                                      return stage ? (
                                        <>
                                          <span className={`w-2 h-2 rounded-full ${stage.color}`}></span>
                                          {stage.label}
                                        </>
                                      ) : 'Unknown'
                                    })()}
                                  </span>
                                ) : 'Select stage'}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {/* Active Pipeline Stages (excluding Selection and Closed) */}
                              {PIPELINE_STAGES.filter(s => !s.isClosed && !s.isSelection).map((stage) => (
                                <SelectItem key={stage.id} value={stage.id}>
                                  <span className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${stage.color}`}></span>
                                    {stage.label}
                                  </span>
                                </SelectItem>
                              ))}
                              
                              {/* Divider and Selection Stages (Selected/Rejected) */}
                              <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 border-t mt-1">
                                Selection Status
                              </div>
                              {SELECTION_STATUSES.map((selectionStatus) => (
                                <SelectItem key={selectionStatus.id} value={selectionStatus.id}>
                                  <span className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${selectionStatus.color}`}></span>
                                    {selectionStatus.label}
                                  </span>
                                </SelectItem>
                              ))}
                              
                              {/* Divider and Closed Stages (Offer Accepted/Rejected) */}
                              <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 border-t mt-1">
                                Close Candidate
                              </div>
                              {CLOSED_STATUSES.map((closedStatus) => (
                                <SelectItem key={closedStatus.id} value={closedStatus.id}>
                                  <span className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${closedStatus.color}`}></span>
                                    {closedStatus.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          </TableCell>
                        )
                      case 'dateJoined':
                        return (
                          <TableCell key={columnKey} className="text-sm text-gray-600">
                            {candidate.created_at ? new Date(candidate.created_at).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'short', day: 'numeric'
                            }) : '-'}
                          </TableCell>
                        )
                      case 'stageDate':
                        return (
                          <TableCell key={columnKey} className="text-sm text-gray-600">
                            {candidate.updated_at ? new Date(candidate.updated_at).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'short', day: 'numeric'
                            }) : '-'}
                          </TableCell>
                        )
                      case 'recruiterName':
                        return <TableCell key={columnKey} className="text-sm text-gray-600">{candidate.assigned_to ? recruiterMap[candidate.assigned_to] || '-' : '-'}</TableCell>
                      case 'experience':
                        return <TableCell key={columnKey} className="text-sm text-gray-600">{candidate.years_of_experience ? `${candidate.years_of_experience} years` : '-'}</TableCell>
                      case 'industry':
                        return <TableCell key={columnKey} className="text-sm text-gray-600">{candidate.industry || '-'}</TableCell>
                      case 'source':
                        return <TableCell key={columnKey} className="text-sm text-gray-600">{candidate.source || '-'}</TableCell>
                      case 'currentLocation':
                        return <TableCell key={columnKey} className="text-sm text-gray-600">{candidate.current_location || '-'}</TableCell>
                      case 'preferredLocation':
                        return <TableCell key={columnKey} className="text-sm text-gray-600">{candidate.preferred_location || '-'}</TableCell>
                      case 'quality':
                        return <TableCell key={columnKey} className="text-sm text-gray-600">{candidate.quality || '-'}</TableCell>
                      case 'expectedCtc':
                        return (
                          <TableCell key={columnKey} className="text-sm text-gray-600">
                            {candidate.expected_ctc ? `₹${parseFloat(candidate.expected_ctc).toLocaleString('en-IN')}` : '-'}
                          </TableCell>
                        )
                      case 'currentCtc':
                        return (
                          <TableCell key={columnKey} className="text-sm text-gray-600">
                            {candidate.current_ctc ? `₹${parseFloat(candidate.current_ctc).toLocaleString('en-IN')}` : '-'}
                          </TableCell>
                        )
                      case 'noticePeriod':
                        return <TableCell key={columnKey} className="text-sm text-gray-600">{candidate.notice_period || '-'}</TableCell>
                      case 'area':
                        return <TableCell key={columnKey} className="text-sm text-gray-600">{candidate.area || '-'}</TableCell>
                      case 'feedback':
                        return (
                          <TableCell key={columnKey} className="min-w-[180px]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setFeedbackCandidate({
                                  id: candidate.id,
                                  name: candidate.name,
                                  feedback: candidate.feedback
                                })
                                setFeedbackText(candidate.feedback || '')
                                setShowFeedbackDialog(true)
                              }}
                              className="text-xs text-left w-full"
                            >
                              {candidate.feedback ? (
                                <span className="text-gray-700 line-clamp-2 hover:text-blue-600 transition-colors">
                                  {candidate.feedback}
                                </span>
                              ) : (
                                <span className="text-blue-500 hover:text-blue-700 font-medium">+ Add Feedback</span>
                              )}
                            </button>
                          </TableCell>
                        )
                      default:
                        return null
                    }
                  }

                  return (
                    <TableRow key={candidate.id} className="hover:bg-gray-50">
                      {columnOrder.map((columnKey) => renderCell(columnKey))}
                    </TableRow>
                  )
                })
                })()
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination Controls */}
        {candidates.length > 0 && (
          <div className="bg-white rounded-lg border mt-4 px-4 py-3 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <span className="text-sm text-gray-600">
              Page {currentPage} of {Math.ceil(
                (dateFilter 
                  ? candidates.filter(c => {
                      const candidateDate = new Date(c.updated_at || c.created_at)
                      return candidateDate >= dateFilter
                    }).length 
                  : candidates.length
                ) / itemsPerPage
              )}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage >= Math.ceil(
                (dateFilter 
                  ? candidates.filter(c => {
                      const candidateDate = new Date(c.updated_at || c.created_at)
                      return candidateDate >= dateFilter
                    }).length 
                  : candidates.length
                ) / itemsPerPage
              )}
              className="gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </>
      )}

      {/* Closed Status Selection Dialog */}
      <Dialog open={showClosedDialog} onOpenChange={setShowClosedDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Close Candidate: {pendingClosedCandidate?.name}</DialogTitle>
            <DialogDescription>
              Choose the final status for this candidate
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            {CLOSED_STATUSES.map((closedStatus) => (
              <Button
                key={closedStatus.id}
                variant="outline"
                className={`h-24 flex-col gap-2 hover:border-2 ${
                  closedStatus.id === 'offer_accepted' 
                  ? 'hover:border-green-500 hover:bg-green-50' 
                  : 'hover:border-red-500 hover:bg-red-50'
                }`}
                onClick={async () => {
                  if (!pendingClosedCandidate) return
                  
                  const newStatus = closedStatus.dbStatus
                  const applicationStage = closedStatus.applicationStage
                  const closedStageIndex = PIPELINE_STAGES.findIndex(s => s.isClosed)



                  const supabase = createClient()

                  // Update manager_pipeline table with closed status
                  const { data: pipelineUpdate, error: pipelineError } = await supabase
                    .from('manager_pipeline')
                    .update({ 
                      stage: 'closed',
                      stage_order: closedStageIndex,
                      selection_status: newStatus, // Store hired/rejected in selection_status
                      updated_at: new Date().toISOString() 
                    })
                    .eq('candidate_id', pendingClosedCandidate.id)
                    .eq('job_id', jobId)
                    .select()

                  if (pipelineError) {
                    console.error('[v0] Error closing candidate:', pipelineError)
                    toast({
                      title: 'Error',
                      description: `Failed to close candidate: ${pipelineError.message}`,
                      variant: 'destructive'
                    })
                  } else {
                    console.log('[v0] Successfully closed candidate')


                    toast({
                      title: 'Success',
                      description: `Candidate marked as ${closedStatus.label}`,
                    })
                    fetchCandidates()
                  }

                  setShowClosedDialog(false)
                  setPendingClosedCandidate(null)
                }}
              >
                <span className={`w-4 h-4 rounded-full ${closedStatus.color}`}></span>
                <span className="text-sm font-medium">{closedStatus.label}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Selection Dialog */}
      <Dialog open={showSelectionDialog} onOpenChange={setShowSelectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selection Status for {pendingSelectionCandidate?.name}</DialogTitle>
            <DialogDescription>
              Choose whether the candidate is selected or rejected after the interview
            </DialogDescription>
          </DialogHeader>
          
      <div className="grid grid-cols-3 gap-4 mt-4">
        {SELECTION_STATUSES.map((selectionStatus) => (
          <Button
            key={selectionStatus.id}
            variant="outline"
            className={`h-24 flex-col gap-2 hover:border-2 ${
              selectionStatus.id === 'selected'
                ? 'hover:border-green-500 hover:bg-green-50'
                : selectionStatus.id === 'selection_rejected'
                ? 'hover:border-red-500 hover:bg-red-50'
                : 'hover:border-orange-500 hover:bg-orange-50'
            }`}
                onClick={async () => {
                  if (!pendingSelectionCandidate) return
                  
                  const newStatus = selectionStatus.dbStatus
                  const applicationStage = selectionStatus.applicationStage
                  const selectionStageIndex = PIPELINE_STAGES.findIndex(s => s.isSelection)

            console.log('[v0] Setting selection status for candidate:', pendingSelectionCandidate.id)
            console.log('[v0] Setting selection_status to:', newStatus)
            
            const supabase = createClient()
            
            // Update manager_pipeline table with selection sub-status
            const { data: pipelineUpdate, error: pipelineError } = await supabase
              .from('manager_pipeline')
              .update({
                selection_status: newStatus,
                stage: 'selection',
                stage_order: selectionStageIndex,
                updated_at: new Date().toISOString()
              })
              .eq('candidate_id', pendingSelectionCandidate.id)
              .eq('job_id', jobId)
              .select()
            
            if (pipelineError) {
              console.error('[v0] Error setting selection status:', pipelineError)
              toast({
                title: 'Error',
                description: `Failed to set selection status: ${pipelineError.message}`,
                variant: 'destructive'
              })
            } else {
              console.log('[v0] Successfully set selection status')
              console.log('[v0] Manager pipeline update result:', pipelineUpdate)
              toast({
                title: 'Success',
                description: `Candidate marked as ${selectionStatus.label}`,
              })
              fetchCandidates()
            }

                  setShowSelectionDialog(false)
                  setPendingSelectionCandidate(null)
                }}
              >
                <span className={`w-4 h-4 rounded-full ${selectionStatus.color}`}></span>
                <span className="text-sm font-medium">{selectionStatus.label}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Candidate Profile Sheet */}
      <Sheet open={!!selectedCandidate} onOpenChange={(open) => !open && setSelectedCandidate(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0">
          {loadingCandidateDetails ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading candidate details...</p>
              </div>
            </div>
          ) : selectedCandidate ? (
            <>
              {/* Header with gradient background */}
              <div className="bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] px-6 py-6 text-white">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <UserCircle2 className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">{selectedCandidate.name}</h2>
                    <p className="text-sm text-white/80">Candidate Profile</p>
                  </div>
                </div>
                
                {/* Current Pipeline Stage Badge */}
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-xs text-white/70 uppercase tracking-wider">Pipeline Stage:</span>
                  <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 capitalize text-sm px-3 py-1">
                    {selectedCandidate.status?.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="px-6 py-4 space-y-3">
                {/* Contact Information Card */}
                <Card className="shadow-sm border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-700">
                      <Mail className="h-4 w-4 text-blue-500" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2 pb-3">
                    <div className="grid grid-cols-1 gap-2.5">
                      {selectedCandidate.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          <a href={`mailto:${selectedCandidate.email}`} className="text-sm text-blue-600 hover:underline">
                            {selectedCandidate.email}
                          </a>
                        </div>
                      )}
                      {selectedCandidate.mobile_number && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          <a href={`tel:${selectedCandidate.mobile_number}`} className="text-sm text-gray-700">
                            {selectedCandidate.mobile_number}
                          </a>
                        </div>
                      )}
                      {selectedCandidate.current_location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-sm text-gray-700">{selectedCandidate.current_location}</span>
                        </div>
                      )}
                      {selectedCandidate.preferred_location && (
                        <div className="flex items-center gap-2">
                          <Target className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-sm text-gray-700">Preferred: {selectedCandidate.preferred_location}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Professional Details Card */}
                <Card className="shadow-sm border-l-4 border-l-purple-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-700">
                      <Briefcase className="h-4 w-4 text-purple-500" />
                      Professional Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2 pb-3">
                    <div className="space-y-2">
                      {selectedCandidate.industry && (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-sm text-gray-700">{selectedCandidate.industry}</span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                          <Award className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-xs text-gray-600">
                            {selectedCandidate.experience_years ? `${selectedCandidate.experience_years} yrs exp` : 'N/A'}
                          </span>
                        </div>
                        {selectedCandidate.notice_period && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-xs text-gray-600">{selectedCandidate.notice_period}</span>
                          </div>
                        )}
                        {selectedCandidate.current_ctc && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-xs text-gray-600">₹{selectedCandidate.current_ctc}L</span>
                          </div>
                        )}
                        {selectedCandidate.expected_ctc && (
                          <div className="flex items-center gap-2">
                            <Target className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-xs text-gray-600">₹{selectedCandidate.expected_ctc}L exp</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Skills Card */}
                {selectedCandidate.skills && (
                  <Card className="shadow-sm border-l-4 border-l-green-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-700">
                        <Award className="h-4 w-4 text-green-500" />
                        Skills
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2 pb-3">
                      <div className="flex flex-wrap gap-1.5">
                        {(Array.isArray(selectedCandidate.skills)
                          ? selectedCandidate.skills
                          : selectedCandidate.skills.split(',').map(s => s.trim())
                        ).map((skill, idx) => (
                          <Badge key={idx} variant="secondary" className="px-2 py-0.5 text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Resume/CV Card */}
                {selectedCandidate.cv_url && (
                  <Card className="shadow-sm border-l-4 border-l-orange-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-700">
                        <FileText className="h-4 w-4 text-orange-500" />
                        Resume/CV
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2 pb-3 space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 h-8 text-xs"
                        onClick={() => window.open(selectedCandidate.cv_url, '_blank')}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        View Resume
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 h-8 text-xs"
                        onClick={async () => {
                          try {
                            const response = await fetch(selectedCandidate.cv_url!)
                            const blob = await response.blob()
                            const urlParts = selectedCandidate.cv_url!.split('.')
                            const extension = urlParts[urlParts.length - 1].split('?')[0] || 'pdf'
                            const sanitizedName = selectedCandidate.name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '')
                            const filename = `${sanitizedName}_resume.${extension}`
                            const url = window.URL.createObjectURL(blob)
                            const link = document.createElement('a')
                            link.href = url
                            link.download = filename
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                            window.URL.revokeObjectURL(url)
                            toast({ title: 'Downloaded', description: filename })
                          } catch (error) {
                            toast({ title: 'Error', description: 'Failed to download', variant: 'destructive' })
                          }
                        }}
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent
          className="max-w-2xl"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Feedback — {feedbackCandidate?.name}</DialogTitle>
            <DialogDescription>
              Add or edit feedback notes for this candidate. Click Save to apply changes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Enter feedback notes..."
              className="w-full min-h-[240px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y text-sm leading-relaxed"
              autoFocus
            />
          </div>
          
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowFeedbackDialog(false)
                setFeedbackCandidate(null)
                setFeedbackText('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!feedbackCandidate) return
                
                console.log('[v0] Saving feedback for candidate:', feedbackCandidate.id)
                const supabase = createClient()
                
                const { error } = await supabase
                  .from('candidates')
                  .update({ 
                    feedback: feedbackText,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', feedbackCandidate.id)
                
                if (error) {
                  console.error('[v0] Error saving feedback:', error)
                  toast({
                    title: 'Error',
                    description: 'Failed to save feedback',
                    variant: 'destructive'
                  })
                } else {
                  console.log('[v0] Feedback saved successfully')
                  toast({
                    title: 'Success',
                    description: 'Feedback saved successfully'
                  })
                  
                  // Update the local candidate state
                  setCandidates(prev => prev.map(c => 
                    c.id === feedbackCandidate.id 
                      ? { ...c, feedback: feedbackText }
                      : c
                  ))
                  
                  setShowFeedbackDialog(false)
                  setFeedbackCandidate(null)
                  setFeedbackText('')
                }
              }}
            >
              Save Feedback
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
