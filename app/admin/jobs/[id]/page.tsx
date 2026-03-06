'use client'

import React from "react"
import { FileText } from 'lucide-react' // Import FileText

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  Users,
  Calendar,
  Building2,
  CheckCircle,
  Mail,
  Phone,
  TrendingUp,
  LayoutGrid,
  Table2,
  ChevronLeft,
  ChevronRight,
  Settings2,
  GripVertical,
  StickyNote,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

interface Job {
  id: string
  title: string
  location: string
  employment_type: string
  experience_level: string
  salary_range: string
  description: string
  requirements: string[]
  responsibilities: string[]
  benefits: string[]
  company_name: string
  company_description: string
  contact_email: string
  contact_name: string
  status: string
  created_at: string
  assigned_recruiter: string
  department: string
}

interface Application {
  id: string
  job_id: string
  candidate_id: string
  candidate_name: string
  stage: 'applied' | 'screening' | 'interview' | 'offer' | 'hired'
  stage_order: number
  applied_at: string
  experience_years: number
  skills: string[]
  score: number
}

interface Candidate {
  id: string
  name: string
  email: string
  mobile_number: string
  current_location: string
  skills: string[]
  experience_years: number
  current_ctc: number
  expected_ctc: number
  notice_period: string
  status: string
  created_at: string
  cv_url?: string
  feedback?: string
}

export default function AdminJobDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { userRole } = useAuth()
  
  const [job, setJob] = useState<Job | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedCard, setDraggedCard] = useState<Application | null>(null)
  const [draggedOverStage, setDraggedOverStage] = useState<string | null>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [loadingCandidate, setLoadingCandidate] = useState(false)
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    mobile_number: false,
    email: false,
    current_location: false,
    preferred_location: false,
    area: false,
    skills: true,
    industry: false,
    experience_years: true,
    current_ctc: false,
    expected_ctc: false,
    notice_period: false,
    buyout_available: false,
    source: false,
    status: true,
    quality: false
  })
  const [columnOrder, setColumnOrder] = useState<string[]>([
    'name', 'mobile_number', 'email',
    'current_location', 'preferred_location', 'area', 'skills', 'industry',
    'experience_years', 'current_ctc', 'expected_ctc', 'notice_period',
    'buyout_available', 'source', 'status', 'quality'
  ])
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [feedbackCandidate, setFeedbackCandidate] = useState<{ id: string, name: string, feedback?: string } | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  
  const isHiringManager = userRole === 'hiring_manager'

  // Load column settings from localStorage on mount
  useEffect(() => {
    // Use v4 key with filtered columns (removed dob, gender, alternate_mobile, job_id, feedback)
    const savedColumns = localStorage.getItem('adminJobPipeline_visibleColumns_v4')
    const savedOrder = localStorage.getItem('adminJobPipeline_columnOrder_v4')
    
    const defaultColumns = {
      name: true,
      mobile_number: false,
      email: false,
      current_location: false,
      preferred_location: false,
      area: false,
      skills: true,
      industry: false,
      experience_years: true,
      current_ctc: false,
      expected_ctc: false,
      notice_period: false,
      buyout_available: false,
      source: false,
      status: true,
      quality: false
    }
    
    const defaultOrder = [
      'name', 'mobile_number', 'email',
      'current_location', 'preferred_location', 'area', 'skills', 'industry',
      'experience_years', 'current_ctc', 'expected_ctc', 'notice_period',
      'buyout_available', 'source', 'status', 'quality'
    ]
    
    if (savedColumns) {
      try {
        const parsed = JSON.parse(savedColumns)
        // Merge saved columns with defaults to ensure all new fields are present
        setVisibleColumns({ ...defaultColumns, ...parsed })
      } catch (e) {
        console.error('[v0] Error loading visible columns:', e)
        setVisibleColumns(defaultColumns)
      }
    }
    
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder)
        // Add any new columns that aren't in the saved order
        const newColumns = defaultOrder.filter(col => !parsed.includes(col))
        setColumnOrder([...parsed, ...newColumns])
      } catch (e) {
        console.error('[v0] Error loading column order:', e)
        setColumnOrder(defaultOrder)
      }
    }
  }, [])
  
  // Save column settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('adminJobPipeline_visibleColumns_v4', JSON.stringify(visibleColumns))
  }, [visibleColumns])
  
  useEffect(() => {
    localStorage.setItem('adminJobPipeline_columnOrder_v4', JSON.stringify(columnOrder))
  }, [columnOrder])

  useEffect(() => {
    // Skip if this is the new job route - it should be handled by /new/page.tsx
    if (params.id === 'new' || params.id === 'edit') {
      setLoading(false)
      return
    }
    fetchJobDetails()
  }, [params.id])

  const fetchJobDetails = async () => {
    
    const supabase = createClient()

    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', params.id)
      .single()

    if (jobError) {
      console.error('Error fetching job:', jobError)
      toast({
        title: 'Error',
        description: 'Failed to load job details',
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    if (!jobData) {
      setLoading(false)
      return
    }

    const parseArrayField = (field: any): string[] => {
      if (!field) return []
      if (Array.isArray(field)) return field
      if (typeof field === 'string') {
        try {
          const parsed = JSON.parse(field)
          return Array.isArray(parsed) ? parsed : [field]
        } catch {
          return field.split(/\n|,/).map(s => s.trim()).filter(Boolean)
        }
      }
      return []
    }

    setJob({
      ...jobData,
      requirements: parseArrayField(jobData.requirements),
      responsibilities: parseArrayField(jobData.responsibilities),
      benefits: parseArrayField(jobData.benefits),
    })

    const { data: candidatesData, error: candidatesError } = await supabase
      .from('candidates')
      .select('*')
      .eq('job_id', params.id)

    if (!candidatesError && candidatesData) {
      setCandidates(candidatesData)
    }

    // Fetch applications from the applications table
    console.log('[v0] Fetching applications for job:', params.id)
    const { data: applicationsData, error: applicationsError } = await supabase
      .from('applications')
      .select('*')
      .eq('job_id', params.id)
      .order('applied_at', { ascending: false })

    if (applicationsError) {
      console.error('[v0] Error fetching applications:', applicationsError)
    } else if (applicationsData) {
      console.log('[v0] Applications loaded:', applicationsData.length)
      setApplications(applicationsData)
    }

    setLoading(false)
  }

  // Default stages for admin/recruiter
  const defaultStages = [
    { key: 'applied', label: 'Applied', dotColor: 'bg-blue-500', borderColor: 'border-blue-200', borderColorHover: 'border-blue-400', bgHover: 'bg-blue-50', scoreColor: 'bg-blue-500', bgColor: 'bg-blue-500', textColor: 'text-white' },
    { key: 'screening', label: 'Screening', dotColor: 'bg-yellow-500', borderColor: 'border-yellow-200', borderColorHover: 'border-yellow-400', bgHover: 'bg-yellow-50', scoreColor: 'bg-yellow-500', bgColor: 'bg-yellow-500', textColor: 'text-white' },
    { key: 'interview', label: 'Interview', dotColor: 'bg-purple-500', borderColor: 'border-purple-200', borderColorHover: 'border-purple-400', bgHover: 'bg-purple-50', scoreColor: 'bg-purple-500', bgColor: 'bg-purple-500', textColor: 'text-white' },
    { key: 'offer', label: 'Offer', dotColor: 'bg-orange-500', borderColor: 'border-orange-200', borderColorHover: 'border-orange-400', bgHover: 'bg-orange-50', scoreColor: 'bg-orange-500', bgColor: 'bg-orange-500', textColor: 'text-white' },
    { key: 'hired', label: 'Hired', dotColor: 'bg-green-500', borderColor: 'border-green-200', borderColorHover: 'border-green-400', bgHover: 'bg-green-50', scoreColor: 'bg-green-500', bgColor: 'bg-green-500', textColor: 'text-white' }
  ]
  
  // Hiring manager stages - simplified view
  const hiringManagerStages = [
    { key: 'review', label: 'New for Review', bgColor: 'bg-blue-500', textColor: 'text-white' },
    { key: 'interview', label: 'Interview', bgColor: 'bg-teal-500', textColor: 'text-white' },
    { key: 'decision', label: 'Decision', bgColor: 'bg-yellow-500', textColor: 'text-white' },
    { key: 'offer', label: 'Offer', bgColor: 'bg-purple-500', textColor: 'text-white' },
    { key: 'closed', label: 'Closed', bgColor: 'bg-green-500', textColor: 'text-white' }
  ]
  
  const stages = isHiringManager ? hiringManagerStages : defaultStages
  
  // Map existing application stages to hiring manager stages
  const mapToHiringManagerStage = (appStage: string): string => {
    switch (appStage) {
      case 'applied':
      case 'screening':
        return 'review'
      case 'interview':
        return 'interview'
      case 'offer':
        return 'offer'
      case 'hired':
        return 'closed'
      case 'rejected':
        return 'closed'
      default:
        return 'review'
    }
  }

  const handleDragStart = (e: React.DragEvent, application: Application) => {
    console.log('[v0] Drag started:', application.candidate_name, application.stage)
    setDraggedCard(application)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault()
    
    if (!draggedCard) return

    const currentStageIndex = stages.findIndex(s => s.key === draggedCard.stage)
    const targetStageIndex = stages.findIndex(s => s.key === targetStage)

    // Allow moving to adjacent stages (next or previous)
    const isAdjacent = Math.abs(targetStageIndex - currentStageIndex) === 1
    
    if (isAdjacent) {
      e.dataTransfer.dropEffect = 'move'
      setDraggedOverStage(targetStage)
    } else if (targetStageIndex === currentStageIndex) {
      e.dataTransfer.dropEffect = 'move'
      setDraggedOverStage(null)
    } else {
      e.dataTransfer.dropEffect = 'none'
    }
  }

  const handleDragLeave = () => {
    setDraggedOverStage(null)
  }

  const fetchCandidateDetails = async (candidateId: string) => {
    setLoadingCandidate(true)
    const supabase = createClient()
    
    console.log('[v0] Fetching candidate details for:', candidateId)
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .single()
    
    if (error) {
      console.error('[v0] Error fetching candidate:', error)
      toast({
        title: 'Error',
        description: 'Failed to load candidate details',
        variant: 'destructive',
      })
    } else if (data) {
      console.log('[v0] Candidate details loaded:', data)
      setSelectedCandidate(data)
      setIsDrawerOpen(true)
    }
    
    setLoadingCandidate(false)
  }

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault()
    console.log('[v0] Drop event:', targetStage)
    
    if (!draggedCard) return

    const currentStageIndex = stages.findIndex(s => s.key === draggedCard.stage)
    const targetStageIndex = stages.findIndex(s => s.key === targetStage)

    // Allow moving to next stage (forward) or previous stage (backward)
    const isForward = targetStageIndex === currentStageIndex + 1
    const isBackward = targetStageIndex === currentStageIndex - 1
    
    if (!isForward && !isBackward && targetStageIndex !== currentStageIndex) {
      console.log('[v0] Invalid move - can only move to adjacent stages')
      setDraggedCard(null)
      setDraggedOverStage(null)
      toast({
        title: 'Invalid Move',
        description: 'You can only move candidates to adjacent stages (forward or backward)',
        variant: 'destructive',
      })
      return
    }
    
    // Don't do anything if dropping in the same stage
    if (targetStageIndex === currentStageIndex) {
      setDraggedCard(null)
      setDraggedOverStage(null)
      return
    }

    // Map pipeline stages to candidate statuses
    const stageToStatusMap: Record<string, string> = {
      'applied': 'linedup',
      'screening': 'ringing',
      'interview': 'callback',
      'interviewing': 'callback',
      'assessment': 'under review',
      'offer': 'shortlisted',
      'hired': 'hired',
      'rejected': 'rejected'
    }
    
    const newStatus = stageToStatusMap[targetStage] || 'linedup'
    
    // Update application stage in database
    const supabase = createClient()
    const { error: appError } = await supabase
      .from('applications')
      .update({ 
        stage: targetStage,
        stage_order: targetStageIndex + 1
      })
      .eq('id', draggedCard.id)

    if (appError) {
      console.error('[v0] Error updating application stage:', appError)
      toast({
        title: 'Error',
        description: 'Failed to update candidate stage',
        variant: 'destructive',
      })
      setDraggedCard(null)
      setDraggedOverStage(null)
      return
    }
    
    // Also update candidate status to match the stage
    console.log('[v0] Updating candidate status to:', newStatus, 'for candidate:', draggedCard.candidate_id)
    const { error: candidateError } = await supabase
      .from('candidates')
      .update({ status: newStatus })
      .eq('id', draggedCard.candidate_id)
    
    if (candidateError) {
      console.error('[v0] Error updating candidate status:', candidateError)
      // Don't show error to user since application stage was updated successfully
    } else {
      console.log('[v0] Successfully updated candidate status to:', newStatus)
    }

    const direction = targetStageIndex > currentStageIndex ? 'forward' : 'backward'
    console.log('[v0] Successfully moved candidate', direction, 'to', targetStage)
    
    // Update local state
    setApplications(prev =>
      prev.map(app =>
        app.id === draggedCard.id
          ? { ...app, stage: targetStage as any, stage_order: targetStageIndex + 1 }
          : app
      )
    )
    
    toast({
      title: 'Success',
      description: `Moved ${draggedCard.candidate_name} ${direction} to ${targetStage}`,
    })

    setDraggedCard(null)
    setDraggedOverStage(null)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'shortlisted':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-300'
      case 'interviewing':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'offered':
        return 'bg-purple-100 text-purple-700 border-purple-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading job details...</p>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-lg text-muted-foreground">Job not found</p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 overflow-auto">
      <div className="container mx-auto p-6 max-w-full px-4 sm:px-6 lg:px-8 pb-20">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="h-10 w-10 rounded-full hover:bg-white/80 transition-colors"
                aria-label="Back to previous page"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {job.client_name ? `${job.client_name} - ${job.title}` : job.title}
                    </h1>
                    <Badge className="bg-green-100 text-green-700 border-green-300 px-3 py-1">
                      {job.status || 'active'}
                    </Badge>
                  </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1.5 font-medium text-gray-600">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    Job ID: {job.id.slice(0, 8)}
                  </span>
                  <Separator orientation="vertical" className="h-4" />
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    {job.location}
                  </span>
                  <Separator orientation="vertical" className="h-4" />
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4 text-gray-500" />
                    {job.employment_type || 'full-time'}
                  </span>
                  <Separator orientation="vertical" className="h-4" />
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    Posted {new Date(job.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Applicant Kanban Board - Full Width */}
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-800">
                    {isHiringManager ? 'Hiring Manager Pipeline' : 'Applicant Pipeline'}
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Track candidates through the recruitment process
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-100 text-blue-700">
                    {applications.length} Total
                  </Badge>
                  
                  {/* Customize Columns Button - Only show in table view */}
                  {viewMode === 'table' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 gap-2"
                      onClick={() => setShowColumnCustomizer(true)}
                    >
                      <Settings2 className="h-4 w-4" />
                      Customize Columns
                    </Button>
                  )}
                  
                  {/* View Toggle Icons */}
                  <div className="flex items-center gap-2 bg-white p-1 rounded-lg border">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode('card')}
                      className={`h-8 px-3 ${
                        viewMode === 'card' 
                          ? 'bg-gray-100 shadow-sm text-black hover:bg-gray-100 hover:text-black' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-black'
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
                          ? 'bg-gray-100 shadow-sm text-black hover:bg-gray-100 hover:text-black' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                      }`}
                      title="Table View"
                    >
                      <Table2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
          <CardContent className="pt-6">
            {applications.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-base font-medium mb-1">No applicants yet</p>
                <p className="text-xs">Candidates will appear here once they apply</p>
              </div>
            ) : viewMode === 'table' ? (
              // Table View for all roles
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columnOrder.filter(key => visibleColumns[key as keyof typeof visibleColumns]).map((columnKey) => {
                        const columnLabels: Record<string, string> = {
                          name: 'Candidate Name',
                          mobile_number: 'Mobile Number',
                          email: 'Email',
                          current_location: 'Current Location',
                          preferred_location: 'Preferred Location',
                          area: 'Area',
                          skills: 'Skills',
                          industry: 'Industry',
                          experience_years: 'Experience',
                          current_ctc: 'Current CTC',
                          expected_ctc: 'Expected CTC',
                          notice_period: 'Notice Period',
                          buyout_available: 'Buyout Available',
                          source: 'Source',
                          status: 'Current Stage',
                          quality: 'Quality'
                        }
                        return (
                          <TableHead key={columnKey} className={columnKey === 'name' ? 'w-[200px]' : ''}>
                            {columnLabels[columnKey] || columnKey}
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((application) => {
                      const currentStageIndex = stages.findIndex(s => s.key === (isHiringManager ? mapToHiringManagerStage(application.stage) : application.stage))
                      const canMoveBackward = currentStageIndex > 0
                      const canMoveForward = currentStageIndex >= 0 && currentStageIndex < stages.length - 1
                      const currentStage = stages[currentStageIndex]
                      
                      // Find the candidate to check feedback
                      const candidate = candidates.find(c => c.id === application.candidate_id)
                      
                      const renderCell = (columnKey: string) => {
                        switch (columnKey) {
                          case 'name':
                            return (
                              <TableCell 
                                key={columnKey}
                                className="font-medium cursor-pointer text-blue-600 hover:text-blue-800"
                                onClick={() => fetchCandidateDetails(application.candidate_id)}
                              >
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-gray-400" />
                                  <span>{application.candidate_name}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setFeedbackCandidate({ 
                                        id: application.candidate_id, 
                                        name: application.candidate_name,
                                        feedback: candidate?.feedback
                                      })
                                      setFeedbackText(candidate?.feedback || '')
                                      setShowFeedbackDialog(true)
                                    }}
                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                    title={candidate?.feedback ? 'View/Edit Feedback' : 'Add Feedback'}
                                  >
                                    <StickyNote className={`h-4 w-4 ${candidate?.feedback ? 'text-amber-500 fill-amber-100' : 'text-gray-400'}`} />
                                  </button>
                                </div>
                              </TableCell>
                            )
                          case 'email':
                            return (
                              <TableCell key={columnKey} className="text-sm text-gray-600">
                                {candidate?.email || '-'}
                              </TableCell>
                            )
                          case 'mobile_number':
                            return (
                              <TableCell key={columnKey} className="text-sm text-gray-600">
                                {candidate?.mobile_number || '-'}
                              </TableCell>
                            )
                          case 'current_location':
                            return (
                              <TableCell key={columnKey} className="text-sm text-gray-600">
                                {candidate?.current_location || '-'}
                              </TableCell>
                            )
                          case 'preferred_location':
                            return (
                              <TableCell key={columnKey} className="text-sm text-gray-600">
                                {(candidate as any)?.preferred_location || '-'}
                              </TableCell>
                            )
                          case 'area':
                            return (
                              <TableCell key={columnKey} className="text-sm text-gray-600">
                                {(candidate as any)?.area || '-'}
                              </TableCell>
                            )
                          case 'experience_years':
                            return (
                              <TableCell key={columnKey} className="text-sm text-gray-600">
                                {application.experience_years ? `${application.experience_years} years` : '-'}
                              </TableCell>
                            )
                          case 'skills':
                            return (
                              <TableCell key={columnKey} className="text-sm text-gray-600 max-w-[250px]">
                                {application.skills && application.skills.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {application.skills.slice(0, 3).map((skill, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {skill}
                                      </Badge>
                                    ))}
                                    {application.skills.length > 3 && (
                                      <Badge variant="secondary" className="text-xs">
                                        +{application.skills.length - 3}
                                      </Badge>
                                    )}
                                  </div>
                                ) : '-'}
                              </TableCell>
                            )
                          case 'industry':
                            return (
                              <TableCell key={columnKey} className="text-sm text-gray-600">
                                {(candidate as any)?.industry || '-'}
                              </TableCell>
                            )
                          case 'current_ctc':
                            return (
                              <TableCell key={columnKey} className="text-sm text-gray-600">
                                {candidate?.current_ctc ? `₹${candidate.current_ctc} LPA` : '-'}
                              </TableCell>
                            )
                          case 'expected_ctc':
                            return (
                              <TableCell key={columnKey} className="text-sm text-gray-600">
                                {candidate?.expected_ctc ? `₹${candidate.expected_ctc} LPA` : '-'}
                              </TableCell>
                            )
                          case 'notice_period':
                            return (
                              <TableCell key={columnKey} className="text-sm text-gray-600">
                                {candidate?.notice_period || '-'}
                              </TableCell>
                            )
                          case 'buyout_available':
                            return (
                              <TableCell key={columnKey} className="text-sm text-gray-600">
                                {(candidate as any)?.buyout_available || '-'}
                              </TableCell>
                            )
                          case 'source':
                            return (
                              <TableCell key={columnKey} className="text-sm text-gray-600">
                                {(candidate as any)?.source || '-'}
                              </TableCell>
                            )
                          case 'quality':
                            return (
                              <TableCell key={columnKey} className="text-sm text-gray-600">
                                {(candidate as any)?.quality || '-'}
                              </TableCell>
                            )
                          case 'quality':
                            return (
                              <TableCell key={columnKey} className="text-sm text-gray-600">
                                {(candidate as any)?.quality || '-'}
                              </TableCell>
                            )
                          case 'status':
                            return (
                              <TableCell key={columnKey} onClick={(e) => e.stopPropagation()}>
                                <Select
                                  value={application.stage}
                              onValueChange={async (newStage) => {
                                console.log('[v0] Changing application stage:', application.id, 'from', application.stage, 'to', newStage)
                                const supabase = createClient()
                                
                                const { data, error } = await supabase
                                  .from('applications')
                                  .update({ stage: newStage })
                                  .eq('id', application.id)
                                  .select()
                                
                                console.log('[v0] Stage update response:', { data, error })
                                
                                if (error) {
                                  console.error('[v0] Error updating application stage:', error)
                                  toast({
                                    title: 'Error',
                                    description: `Failed to update stage: ${error.message}`,
                                    variant: 'destructive'
                                  })
                                } else {
                                  console.log('[v0] Application stage updated successfully')
                                  const stageLabel = stages.find(s => s.key === newStage)?.label || newStage
                                  toast({
                                    title: 'Success',
                                    description: `Candidate moved to ${stageLabel}`
                                  })
                                  // Refresh job details to update the view
                                  fetchJobDetails()
                                }
                              }}
                            >
                              <SelectTrigger className={`w-[130px] h-8 ${currentStage?.bgColor || 'bg-black'} ${currentStage?.textColor || 'text-white'} border-0 rounded-full`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {stages.map((stage) => (
                                  <SelectItem 
                                    key={stage.key} 
                                    value={stage.key}
                                    className="focus:bg-gray-100"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`w-3 h-3 rounded-full ${stage.bgColor}`}></div>
                                      <span>{stage.label}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                                </Select>
                              </TableCell>
                            )
                          default:
                            return null
                        }
                      }
                      
                      return (
                        <TableRow key={application.id} className="hover:bg-gray-50">
                          {columnOrder.filter(key => visibleColumns[key as keyof typeof visibleColumns]).map((columnKey) => renderCell(columnKey))}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : isHiringManager ? (
              // Hiring Manager View
              <div className="overflow-x-auto pb-4">
                <div className="flex gap-4 min-w-max">
                  {hiringManagerStages.map((stage) => {
                    const stageApplications = applications.filter(app => {
                      const mappedStage = mapToHiringManagerStage(app.stage)
                      return mappedStage === stage.key
                    })
                    
                    // For closed stage, separate hired and rejected
                    const hiredApps = stage.key === 'closed' ? stageApplications.filter(app => app.stage === 'hired') : []
                    const rejectedApps = stage.key === 'closed' ? stageApplications.filter(app => app.stage === 'rejected') : []
                    const regularApps = stage.key === 'closed' ? [] : stageApplications
                    
                    return (
                      <div 
                        key={stage.key}
                        className="flex-shrink-0 w-72"
                      >
                        {/* Stage Header */}
                        <div className={`${stage.bgColor} ${stage.textColor} rounded-t-lg p-4 mb-2`}>
                          <h3 className="font-semibold text-base mb-1">{stage.label}</h3>
                          <p className="text-sm opacity-90">
                            {stage.key === 'closed' 
                              ? `${hiredApps.length} Hired | ${rejectedApps.length} Rejected`
                              : `${stageApplications.length} Candidate${stageApplications.length !== 1 ? 's' : ''}`
                            }
                            {stage.key === 'decision' && stageApplications.length > 0 && (
                              <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded">Your Action!</span>
                            )}
                          </p>
                        </div>
                        
                        {/* Candidates List */}
                        <div className="space-y-2 min-h-[300px] bg-gray-50 rounded-b-lg p-3">
                          {stage.key === 'closed' ? (
                            <>
                              {/* Hired Section */}
                              {hiredApps.length > 0 && (
                                <div className="mb-4">
                                  <div className="text-xs font-semibold text-gray-600 mb-2">Hired Candidates</div>
                                  {hiredApps.map(application => (
                                    <div
                                      key={application.id}
                                      className="bg-white p-3 rounded-lg border border-gray-200 hover:shadow-sm transition-all cursor-pointer mb-2"
                                      onClick={() => fetchCandidateDetails(application.candidate_id)}
                                    >
                                      <p className="font-medium text-sm text-gray-900">{application.candidate_name}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* Rejected Section */}
                              {rejectedApps.length > 0 && (
                                <div>
                                  <div className="text-xs font-semibold text-gray-600 mb-2">Rejected</div>
                                  {rejectedApps.map(application => (
                                    <div
                                      key={application.id}
                                      className="bg-white p-3 rounded-lg border border-gray-200 hover:shadow-sm transition-all cursor-pointer mb-2"
                                      onClick={() => fetchCandidateDetails(application.candidate_id)}
                                    >
                                      <p className="font-medium text-sm text-gray-900">{application.candidate_name}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          ) : (
                            regularApps.map(application => (
                              <div
                                key={application.id}
                                className="bg-white p-3 rounded-lg border border-gray-200 hover:shadow-sm transition-all cursor-pointer"
                                onClick={() => fetchCandidateDetails(application.candidate_id)}
                              >
                                <p className="font-medium text-sm text-gray-900">{application.candidate_name}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              // Default Admin/Recruiter View
              <div className="overflow-x-auto pb-4 -mx-2 px-2">
                <div className="flex gap-4 min-w-max pb-4">
                  {stages.map((stage) => {
                    const stageApplications = applications.filter(app => app.stage === stage.key)
                    const isValidDropTarget = draggedCard && 
                      stages.findIndex(s => s.key === stage.key) === stages.findIndex(s => s.key === draggedCard.stage) + 1
                    
                    return (
                      <div 
                        key={stage.key}
                        className="flex-shrink-0 w-64"
                        onDragOver={(e) => handleDragOver(e, stage.key)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, stage.key)}
                      >
                        <div className={`flex items-center justify-between mb-3 pb-2 border-b-2 transition-colors ${
                          draggedOverStage === stage.key && isValidDropTarget
                            ? `${stage.borderColorHover} ${stage.bgHover}`
                            : stage.borderColor
                        }`}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${stage.dotColor}`}></div>
                            <h3 className="font-semibold text-sm text-gray-700">{stage.label}</h3>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {stageApplications.length}
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          {stageApplications.map(application => (
                            <div
                              key={application.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, application)}
                              className={`bg-white p-3 rounded-lg border border-gray-200 hover:shadow-md transition-all cursor-move ${
                                draggedCard?.id === application.id ? 'opacity-50' : ''
                              }`}
                              onClick={() => fetchCandidateDetails(application.candidate_id)}
                            >
                              <div className="flex items-start gap-2 mb-2">
                                <div className={`w-10 h-10 rounded-md ${stage.scoreColor} flex items-center justify-center text-white font-semibold text-sm`}>
                                  {application.score?.toFixed(1) || '0.0'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-gray-900 truncate">{application.candidate_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {application.experience_years} yr · {application.skills?.[0] || 'N/A'}
                                  </p>
                                  <button
                                    className="text-xs text-blue-600 hover:underline mt-1"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      fetchCandidateDetails(application.candidate_id)
                                    }}
                                  >
                                    View profile
                                  </button>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {stage.label === 'Applied' ? 'Applied' : 
                                 stage.label === 'Screening' ? 'Screened' :
                                 stage.label === 'Interview' ? 'Applied' :
                                 stage.label === 'Offer' ? 'Offered' : 'Hired'} {' '}
                                {new Date(application.applied_at).toLocaleDateString('en-US', { day: 'numeric' })} days ago
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Candidate Profile Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-gray-50">
          {loadingCandidate ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : selectedCandidate ? (
            <>
              <SheetHeader className="pb-6 border-b bg-white -mx-6 -mt-6 px-6 pt-6 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                    {selectedCandidate.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <SheetTitle className="text-2xl font-bold text-gray-900">{selectedCandidate.name}</SheetTitle>
                    <SheetDescription className="text-base text-gray-600 mt-1">
                      {selectedCandidate.experience_years} years of experience
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-6">
                {/* Contact Information */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                  <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-blue-600" />
                    </div>
                    Contact Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Mail className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Email</p>
                        <p className="text-sm font-medium text-gray-900 break-all">{selectedCandidate.email}</p>
                      </div>
                    </div>
                    {selectedCandidate.mobile_number && (
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Phone className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Phone</p>
                          <p className="text-sm font-medium text-gray-900">{selectedCandidate.mobile_number}</p>
                        </div>
                      </div>
                    )}
                    {selectedCandidate.current_location && (
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Location</p>
                          <p className="text-sm font-medium text-gray-900">{selectedCandidate.current_location}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Professional Details */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                  <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Briefcase className="h-4 w-4 text-purple-600" />
                    </div>
                    Professional Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="h-4 w-4 text-blue-600" />
                        <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Experience</p>
                      </div>
                      <p className="text-xl font-bold text-blue-900">{selectedCandidate.experience_years} years</p>
                    </div>
                    {selectedCandidate.notice_period && (
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-orange-600 uppercase tracking-wider mb-1">Notice Period</p>
                            <p className="text-xl font-bold text-orange-900">{selectedCandidate.notice_period}</p>
                          </div>
                          <Clock className="h-8 w-8 text-orange-600 opacity-50" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">{selectedCandidate.status}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs px-3 py-1">
                      {selectedCandidate.status}
                    </Badge>
                  </div>
                </div>

                {/* Compensation */}
                {(selectedCandidate.current_ctc || selectedCandidate.expected_ctc) && (
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </div>
                      Compensation
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {selectedCandidate.current_ctc && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-green-600 uppercase tracking-wider mb-1">Current CTC</p>
                              <p className="text-2xl font-bold text-green-900">₹{selectedCandidate.current_ctc.toLocaleString()}</p>
                            </div>
                            <DollarSign className="h-8 w-8 text-green-600 opacity-50" />
                          </div>
                        </div>
                      )}
                      {selectedCandidate.expected_ctc && (
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">Expected CTC</p>
                              <p className="text-2xl font-bold text-blue-900">₹{selectedCandidate.expected_ctc.toLocaleString()}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-blue-600 opacity-50" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {selectedCandidate.skills && (
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-indigo-600" />
                      </div>
                      Skills & Expertise
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(selectedCandidate.skills) 
                        ? selectedCandidate.skills 
                        : typeof selectedCandidate.skills === 'string'
                        ? selectedCandidate.skills.split(',').map(s => s.trim())
                        : []
                      ).map((skill, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="text-xs px-3 py-1.5 bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2 pb-4 sticky bottom-0 bg-gray-50 -mx-6 px-6 py-4 border-t">
                  <Button
                    className="flex-1 h-11 text-base font-medium"
                    onClick={() => {
                      setIsDrawerOpen(false)
                      router.push(`/admin/candidates/${selectedCandidate.id}`)
                    }}
                  >
                    View Full Profile
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsDrawerOpen(false)}
                    className="bg-white h-11 px-6 text-base font-medium"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

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
            {columnOrder.map((columnKey) => {
              const columnLabels: Record<string, string> = {
                name: 'Candidate Name',
                mobile_number: 'Mobile Number',
                email: 'Email',
                current_location: 'Current Location',
                preferred_location: 'Preferred Location',
                area: 'Area',
                skills: 'Skills',
                industry: 'Industry',
                experience_years: 'Experience',
                current_ctc: 'Current CTC',
                expected_ctc: 'Expected CTC',
                notice_period: 'Notice Period',
                buyout_available: 'Buyout Available',
                source: 'Source',
                status: 'Current Stage',
                quality: 'Quality'
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

      {/* Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feedback for {feedbackCandidate?.name}</DialogTitle>
            <DialogDescription>
              Add or edit feedback notes for this candidate
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <Textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Enter feedback notes..."
              className="w-full min-h-[150px]"
            />
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowFeedbackDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!feedbackCandidate) return
                
                const supabase = createClient()
                const { error } = await supabase
                  .from('candidates')
                  .update({ feedback: feedbackText })
                  .eq('id', feedbackCandidate.id)
                
                if (error) {
                  toast({
                    title: 'Error',
                    description: 'Failed to save feedback',
                    variant: 'destructive'
                  })
                } else {
                  toast({
                    title: 'Success',
                    description: 'Feedback saved successfully'
                  })
                  setCandidates(prev => prev.map(c => 
                    c.id === feedbackCandidate.id ? { ...c, feedback: feedbackText } : c
                  ))
                  setShowFeedbackDialog(false)
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
