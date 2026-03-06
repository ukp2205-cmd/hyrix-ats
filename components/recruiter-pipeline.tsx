'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, LayoutGrid, Table2, Settings2, GripVertical, StickyNote } from 'lucide-react'
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Candidate {
  id: string
  name: string
  status: string
  email: string
  mobile_number: string
  skills: string
  experience_years: string
  feedback?: string
}

interface RecruiterPipelineProps {
  jobId: string
}

const PIPELINE_STAGES = [
  { id: 'linedup', label: 'New Applicants', color: 'bg-blue-500', order: 0, dbStatus: 'linedup' },
  { id: 'ringing', label: 'Contacted', color: 'bg-teal-500', order: 1, dbStatus: 'ringing' },
  { id: 'callback', label: 'Screening', color: 'bg-yellow-500', order: 2, dbStatus: 'callback' },
  { id: 'shortlisted', label: 'Shortlisted', color: 'bg-purple-500', order: 3, dbStatus: 'shortlisted' },
  { id: 'final_select', label: 'Final Round', color: 'bg-indigo-500', order: 4, dbStatus: 'final_select' },
  { id: 'closed', label: 'Closed', color: 'bg-green-500', isMulti: true, order: 5, dbStatus: 'closed' }
]

export default function RecruiterPipeline({ jobId }: RecruiterPipelineProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [hiredCount, setHiredCount] = useState(0)
  const [rejectedCount, setRejectedCount] = useState(0)
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    email: true,
    phone: true,
    skills: true,
    experience: true,
    status: true
  })
  const [columnOrder, setColumnOrder] = useState<string[]>([
    'name', 'email', 'phone', 'skills', 'experience', 'status'
  ])
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [feedbackCandidate, setFeedbackCandidate] = useState<{ id: string, name: string, feedback?: string } | null>(null)
  const [feedbackText, setFeedbackText] = useState('')

  // Load column settings from localStorage on mount
  useEffect(() => {
    const savedColumns = localStorage.getItem('recruiterPipeline_visibleColumns')
    const savedOrder = localStorage.getItem('recruiterPipeline_columnOrder')
    
    if (savedColumns) {
      try {
        setVisibleColumns(JSON.parse(savedColumns))
      } catch (e) {
        console.error('[v0] Error loading visible columns:', e)
      }
    }
    
    if (savedOrder) {
      try {
        setColumnOrder(JSON.parse(savedOrder))
      } catch (e) {
        console.error('[v0] Error loading column order:', e)
      }
    }
  }, [])
  
  // Save column settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('recruiterPipeline_visibleColumns', JSON.stringify(visibleColumns))
  }, [visibleColumns])
  
  useEffect(() => {
    localStorage.setItem('recruiterPipeline_columnOrder', JSON.stringify(columnOrder))
  }, [columnOrder])

  useEffect(() => {
    fetchCandidates()
  }, [jobId])

  const fetchCandidates = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('job_id', jobId)

    if (error) {
      console.error('[v0] Error fetching candidates:', error)
      toast({
        title: 'Error',
        description: 'Failed to load candidates',
        variant: 'destructive'
      })
    } else {
      console.log('[v0] Fetched candidates:', data)
      setCandidates(data || [])
      
      // Count hired and rejected
      const hired = data?.filter(c => c.status?.toLowerCase() === 'hired').length || 0
      const rejected = data?.filter(c => c.status?.toLowerCase() === 'rejected').length || 0
      setHiredCount(hired)
      setRejectedCount(rejected)
    }
    setLoading(false)
  }

  const getCandidatesForStage = (stageId: string) => {
    if (stageId === 'closed') {
      return candidates.filter(c => 
        c.status?.toLowerCase() === 'hired' || 
        c.status?.toLowerCase() === 'rejected'
      )
    }
    return candidates.filter(c => c.status?.toLowerCase() === stageId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading pipeline...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        {/* Pipeline Title and View Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Applicant Pipeline</h2>
            <p className="text-sm text-gray-600 mt-1">Track and manage applicants through the hiring process</p>
          </div>
          
          {/* View Toggle Icons and Customize Button */}
          <div className="flex items-center gap-3">
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
          </div>
        </div>
      </div>

      {/* Card View - Pipeline Board */}
      {viewMode === 'card' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((stage) => {
            const stageCandidates = getCandidatesForStage(stage.id)
            const count = stage.id === 'closed' 
              ? `${hiredCount + rejectedCount}` 
              : stageCandidates.length

            return (
              <Card 
                key={stage.id} 
                className="flex-shrink-0 w-64 p-4 bg-gray-50"
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                    <h3 className="font-semibold text-sm text-gray-900">{stage.label}</h3>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {count}
                  </Badge>
                </div>

                {/* Candidates List */}
                <div className="space-y-2 min-h-[200px]">
                  {stageCandidates.length === 0 ? (
                    <div className="text-center py-8 text-xs text-gray-400">
                      No candidates
                    </div>
                  ) : stage.id === 'closed' ? (
                    // Closed stage - show hired and rejected separately
                    <>
                      {hiredCount > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-green-700 mb-2">Hired ({hiredCount})</p>
                          {candidates
                            .filter(c => c.status?.toLowerCase() === 'hired')
                            .map((candidate) => (
                              <Card
                                key={candidate.id}
                                className="p-3 bg-green-50 border-green-200 mb-2 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => router.push(`/recruiter/applicants/${candidate.id}`)}
                              >
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-green-600" />
                                  <span className="text-sm font-medium text-gray-900">
                                    {candidate.name}
                                  </span>
                                </div>
                              </Card>
                            ))}
                        </div>
                      )}
                      {rejectedCount > 0 && (
                        <div>
                          <p className="text-xs font-medium text-red-700 mb-2">Rejected ({rejectedCount})</p>
                          {candidates
                            .filter(c => c.status?.toLowerCase() === 'rejected')
                            .map((candidate) => (
                              <Card
                                key={candidate.id}
                                className="p-3 bg-red-50 border-red-200 mb-2 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => router.push(`/recruiter/applicants/${candidate.id}`)}
                              >
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-red-600" />
                                  <span className="text-sm font-medium text-gray-900">
                                    {candidate.name}
                                  </span>
                                </div>
                              </Card>
                            ))}
                        </div>
                      )}
                    </>
                  ) : (
                    stageCandidates.map((candidate) => (
                      <Card
                        key={candidate.id}
                        className="p-3 bg-white hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => router.push(`/recruiter/applicants/${candidate.id}`)}
                      >
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {candidate.name}
                          </span>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {columnOrder.filter(key => visibleColumns[key as keyof typeof visibleColumns]).map((columnKey) => {
                  const columnLabels: Record<string, string> = {
                    name: 'Candidate Name',
                    email: 'Email',
                    phone: 'Phone',
                    skills: 'Skills',
                    experience: 'Experience',
                    status: 'Current Stage'
                  }
                  return (
                    <TableHead key={columnKey}>
                      {columnLabels[columnKey] || columnKey}
                    </TableHead>
                  )
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columnOrder.filter(key => visibleColumns[key as keyof typeof visibleColumns]).length} className="text-center py-8 text-gray-500">
                    No candidates found for this job
                  </TableCell>
                </TableRow>
              ) : (
                candidates.map((candidate) => {
                  const currentStage = PIPELINE_STAGES.find(
                    stage => getCandidatesForStage(stage.id).some(c => c.id === candidate.id)
                  )
                  
                  const renderCell = (columnKey: string) => {
                    switch (columnKey) {
                      case 'name':
                        return (
                          <TableCell key={columnKey}>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm">
                                  {candidate.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <span className="text-sm font-medium text-gray-900">{candidate.name}</span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setFeedbackCandidate({ id: candidate.id, name: candidate.name, feedback: candidate.feedback })
                                  setFeedbackText(candidate.feedback || '')
                                  setShowFeedbackDialog(true)
                                }}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                title={candidate.feedback ? 'View/Edit Feedback' : 'Add Feedback'}
                              >
                                <StickyNote className={`h-4 w-4 ${candidate.feedback ? 'text-amber-500 fill-amber-100' : 'text-gray-400'}`} />
                              </button>
                            </div>
                          </TableCell>
                        )
                      case 'email':
                        return (
                          <TableCell key={columnKey} className="text-sm text-gray-600">
                            {candidate.email || '-'}
                          </TableCell>
                        )
                      case 'phone':
                        return (
                          <TableCell key={columnKey} className="text-sm text-gray-600">
                            {candidate.mobile_number || '-'}
                          </TableCell>
                        )
                      case 'skills':
                        return (
                          <TableCell key={columnKey} className="text-sm text-gray-600">
                            <span className="inline-block px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs">
                              {candidate.skills || '-'}
                            </span>
                          </TableCell>
                        )
                      case 'experience':
                        return (
                          <TableCell key={columnKey} className="text-sm text-gray-600">
                            {candidate.experience_years ? `${candidate.experience_years} years` : '-'}
                          </TableCell>
                        )
                      case 'status':
                        return (
                          <TableCell key={columnKey} onClick={(e) => e.stopPropagation()}>
                            <Select
                              value={candidate.status?.toLowerCase() || 'linedup'}
                              onValueChange={async (newStatus) => {
                                console.log('[v0] Changing candidate status:', candidate.id, 'from', candidate.status, 'to', newStatus)
                            const supabase = createClient()
                            
                            const { data, error } = await supabase
                              .from('candidates')
                              .update({ status: newStatus })
                              .eq('id', candidate.id)
                              .select()
                            
                            console.log('[v0] Status update response:', { data, error })
                            
                            if (error) {
                              console.error('[v0] Error updating candidate status:', error)
                              toast({
                                title: 'Error',
                                description: `Failed to update status: ${error.message}`,
                                variant: 'destructive'
                              })
                            } else {
                              console.log('[v0] Candidate status updated successfully')
                              const stageLabel = PIPELINE_STAGES.find(s => s.dbStatus === newStatus)?.label || newStatus
                              toast({
                                title: 'Success',
                                description: `Candidate moved to ${stageLabel}`
                              })
                              // Update local state
                              setCandidates(prev => prev.map(c => 
                                c.id === candidate.id ? { ...c, status: newStatus } : c
                              ))
                              
                              // Update counts if moved to/from closed status
                              if (newStatus === 'hired' || newStatus === 'rejected') {
                                fetchCandidates()
                              }
                            }
                          }}
                        >
                          <SelectTrigger className={`w-[130px] h-8 ${currentStage?.color || 'bg-black'} text-white border-0 rounded-full`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PIPELINE_STAGES.filter(stage => stage.id !== 'closed').map((stage) => (
                              <SelectItem key={stage.id} value={stage.dbStatus}>
                                {stage.label}
                              </SelectItem>
                            ))}
                            <SelectItem value="hired">Hired</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                          </TableCell>
                        )
                      default:
                        return null
                    }
                  }
                  
                  return (
                    <TableRow 
                      key={candidate.id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => router.push(`/recruiter/candidates/${candidate.id}`)}
                    >
                      {columnOrder.filter(key => visibleColumns[key as keyof typeof visibleColumns]).map((columnKey) => renderCell(columnKey))}
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

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
                email: 'Email',
                phone: 'Phone',
                skills: 'Skills',
                experience: 'Experience',
                status: 'Current Stage'
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
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Enter feedback notes..."
              className="w-full min-h-[150px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
