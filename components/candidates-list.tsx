'use client'

import { cn } from "@/lib/utils"

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { User, Phone, MoreVertical, Briefcase, Eye, Download, Search, Edit, Edit2, Mail, FileText, ChevronLeft, ChevronRight, ChevronDown, Settings2, MapPin, IndianRupee, Clock, Lock, MessageCircle, Upload, X, CheckCircle, AlertCircle, Check, Target, Award, UserCircle2, Building2, DollarSign } from 'lucide-react'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from '@/components/ui/pagination'
import { useToast } from '@/hooks/use-toast'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ColumnCustomizer, type ColumnConfig } from '@/components/column-customizer'
import { usePermissions } from '@/hooks/use-permissions'
import { LocationAutocomplete } from '@/components/location-autocomplete'

interface Candidate {
  id: string
  name: string
  mobile_number: string
  email: string
  current_location: string
  preferred_location: string
  area: string
  skills: string[]
  industry: string
  experience_years: number
  current_ctc: number
  expected_ctc: number
  notice_period: string
  status: string
  quality: string
  cv_url: string | null
  created_at: string
}

const statusColors = {
  linedup: 'bg-blue-50 text-blue-700 border border-blue-200',
  ringing: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  callback: 'bg-purple-50 text-purple-700 border border-purple-200',
  shortlisted: 'bg-amber-50 text-amber-700 border border-amber-200',
  rejected: 'bg-red-50 text-red-700 border border-red-200',
  final_select: 'bg-green-50 text-green-700 border border-green-200',
  not_interested: 'bg-gray-50 text-gray-700 border border-gray-200',
  not_reachable: 'bg-orange-50 text-orange-700 border border-orange-200',
}

const qualityColors = {
  A1: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  B1: 'bg-green-50 text-green-700 border border-green-200',
  B2: 'bg-blue-50 text-blue-700 border border-blue-200',
  C1: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  C2: 'bg-orange-50 text-orange-700 border border-orange-200',
  C3: 'bg-red-50 text-red-700 border border-red-200',
}

interface CandidatesListProps {
  userRole?: 'admin' | 'recruiter' | 'super_admin' | 'hiring_manager'
  userEmail?: string | null
}

// Default column configuration - matches all fields from add candidate form
const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'candidate', label: 'Candidate Name', visible: true, order: 0 },
  { id: 'date', label: 'Date Added', visible: true, order: 1 },
  { id: 'status', label: 'Status', visible: true, order: 2 },
  { id: 'quality', label: 'Quality', visible: true, order: 3 },
  { id: 'contact', label: 'Phone Number', visible: true, order: 4 },
  { id: 'email', label: 'Email', visible: true, order: 5 },
  { id: 'experience', label: 'Experience (Years)', visible: true, order: 6 },
  { id: 'current_ctc', label: 'Current CTC (LPA)', visible: true, order: 7 },
  { id: 'expected_ctc', label: 'Expected CTC (LPA)', visible: true, order: 8 },
  { id: 'location', label: 'Current Location', visible: true, order: 9 },
  { id: 'preferred_location', label: 'Preferred Location', visible: true, order: 10 },
  { id: 'area', label: 'Area', visible: false, order: 11 },
  { id: 'notice_period', label: 'Notice Period', visible: true, order: 12 },
  { id: 'buyout_available', label: 'Buyout Available', visible: false, order: 13 },
  { id: 'skills', label: 'Skills', visible: true, order: 14 },
  { id: 'industry', label: 'Industry', visible: true, order: 15 },
  { id: 'assigned_job', label: 'Assigned Job', visible: true, order: 16 },
  { id: 'assigned_team', label: 'Recruiter', visible: true, order: 17 },
  { id: 'feedback', label: 'Notes / Feedback', visible: false, order: 18 },
  { id: 'company_name', label: 'Company Name', visible: true, order: 19 },
]

// Helper function to convert text to title case (Camel Case)
const toTitleCase = (text: string | null | undefined): string => {
  if (!text) return ''
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function CandidatesList({ userRole = 'admin', userEmail }: CandidatesListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { getAccessLevel, hasModuleAccess, loading: permissionsLoading } = usePermissions()
  
  // State management
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [columnCustomizerOpen, setColumnCustomizerOpen] = useState(false)
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadedData, setUploadedData] = useState<any[]>([])
  const [uploadErrors, setUploadErrors] = useState<string[]>([])
  const [isProcessingUpload, setIsProcessingUpload] = useState(false)
  
  // Inline editing state
  const [editingCell, setEditingCell] = useState<{candidateId: string, field: string} | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [isValidLocation, setIsValidLocation] = useState(false)
  const [validatedLocationName, setValidatedLocationName] = useState('')

  // Reference data from DB
  const [industries, setIndustries] = useState<string[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [orgJobs, setOrgJobs] = useState<{id: string, title: string, job_id: string}[]>([])
  const [orgRecruiters, setOrgRecruiters] = useState<{id: string, name: string}[]>([])
  const [orgClients, setOrgClients] = useState<{id: string, company_name: string}[]>([])
  const [cellCompanySearch, setCellCompanySearch] = useState('')

  // Filter state
  const [locationFilter, setLocationFilter] = useState('all')
  const [preferredLocationFilter, setPreferredLocationFilter] = useState('all')
  const [industryFilter, setIndustryFilter] = useState('all')
  const [recruiterFilter, setRecruiterFilter] = useState('all')
  const [noticePeriodFilter, setNoticePeriodFilter] = useState('all')
  const [jobFilter, setJobFilter] = useState('all')

  // Inline edit popup (for complex fields)
  const [inlineEditOpen, setInlineEditOpen] = useState<string | null>(null) // candidateId
  const [inlineEditField, setInlineEditField] = useState<string>('')
  const [skillsInput, setSkillsInput] = useState('')
  const [editSkillsArr, setEditSkillsArr] = useState<string[]>([])
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([])
  const [allSkills, setAllSkills] = useState<string[]>([])

  // City autosuggest for inline edit
  const [cityQuery, setCityQuery] = useState('')
  const [citySuggestions, setCitySuggestions] = useState<string[]>([])
  const [industryQuery, setIndustryQuery] = useState('')
  const [industrySuggestions, setIndustrySuggestions] = useState<string[]>([])
  const [prefLocQuery, setPrefLocQuery] = useState('')
  const [filterJobSearch, setFilterJobSearch] = useState('')

  // Per-cell inline search states (lifted to top level — hooks cannot be inside switch/case)
  const [cellLocSearch, setCellLocSearch] = useState('')
  const [cellPrefSearch, setCellPrefSearch] = useState('')
  const [cellIndSearch, setCellIndSearch] = useState('')
  const [cellRecruiterSearch, setCellRecruiterSearch] = useState('')

  // Multi-job selection for inline edit
  const [editJobIds, setEditJobIds] = useState<string[]>([])
  const [jobSearch, setJobSearch] = useState('')

  // Column header click-to-filter state
  const [activeHeaderFilter, setActiveHeaderFilter] = useState<string | null>(null)
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({})
  const [headerSearchTerm, setHeaderSearchTerm] = useState<Record<string, string>>({})

  // Date column range filter
  const [dateFilterRange, setDateFilterRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null })
  // Calendar view state: { year, month } currently displayed
  const [calViewDate, setCalViewDate] = useState<{ year: number; month: number }>(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [calSelectingEnd, setCalSelectingEnd] = useState(false) // false = picking start, true = picking end
  
  // Profile drawer state
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false)
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  
  // Bulk selection state
  const [selectedCandidatesIds, setSelectedCandidatesIds] = useState<Set<string>>(new Set())
  
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
  // Load from localStorage if available and merge with defaults
  if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('candidateTableColumns_v2')
  if (saved) {
  try {
  const parsed = JSON.parse(saved)
  
  // Ensure critical columns are always visible (status column must be visible)
  const ensureVisibleColumns = ['status']
  const updatedParsed = parsed.map((col: ColumnConfig) => {
    if (ensureVisibleColumns.includes(col.id)) {
      return { ...col, visible: true }
    }
    return col
  })
  
  // Check if DEFAULT_COLUMNS has new columns not in parsed
  const parsedIds = new Set(updatedParsed.map((c: ColumnConfig) => c.id))
  const newColumns = DEFAULT_COLUMNS.filter(dc => !parsedIds.has(dc.id))
  
  if (newColumns.length > 0) {
  // Add new columns with order incremented from max existing order
  const maxOrder = Math.max(...updatedParsed.map((c: ColumnConfig) => c.order), 0)
  const newColumnsWithOrder = newColumns.map((col, index) => ({
  ...col,
  order: maxOrder + index + 1
  }))
  
  const mergedColumns = [...updatedParsed, ...newColumnsWithOrder]
  localStorage.setItem('candidateTableColumns_v2', JSON.stringify(mergedColumns))
  return mergedColumns
  }
  
  // Save the updated columns with status visible
  localStorage.setItem('candidateTableColumns_v2', JSON.stringify(updatedParsed))
  return updatedParsed
  } catch (e) {
  return DEFAULT_COLUMNS
  }
  }
  }
  return DEFAULT_COLUMNS
  })

  const [selectedEmail, setSelectedEmail] = useState('')
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [exportFromDate, setExportFromDate] = useState('')
  const [exportToDate, setExportToDate] = useState('')
  const [candidatesToExport, setCandidatesToExport] = useState<any[]>([])

  // Save columns to localStorage whenever they change
  useEffect(() => {
  if (typeof window !== 'undefined') {
  localStorage.setItem('candidateTableColumns_v2', JSON.stringify(columns))
  }
  }, [columns])

  const visibleColumns = columns.filter(col => col.visible).sort((a, b) => a.order - b.order)

  // Inline editable cell component
  const EditableCell = ({ 
    candidateId, 
    field, 
    value, 
    displayValue, 
    type = 'text',
    icon 
  }: { 
    candidateId: string
    field: string
    value: any
    displayValue: string
    type?: 'text' | 'email' | 'tel' | 'number'
    icon?: React.ReactNode
  }) => {
    const isEditing = editingCell?.candidateId === candidateId && editingCell?.field === field
    const [isHovered, setIsHovered] = useState(false)
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <Input
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                saveEdit()
              } else if (e.key === 'Escape') {
                cancelEditing()
              }
            }}
            autoFocus
            className="h-7 text-[13px] px-2"
            disabled={isSaving}
          />
          {isSaving && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          )}
        </div>
      )
    }
    
    return (
      <div 
        className="group flex items-center gap-1.5 cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={() => startEditing(candidateId, field, value)}
      >
        {icon}
        <span className="text-gray-600 text-[13px]">{displayValue}</span>
        {isHovered && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              startEditing(candidateId, field, value)
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit2 className="h-3 w-3 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>
    )
  }
  
  // Helper function to render cell content based on column ID
  const renderCellContent = (columnId: string, candidate: any) => {
    switch (columnId) {
        case 'candidate': {
        const isEditingName = editingCell?.candidateId === candidate.id && editingCell?.field === 'candidate'
        return (
        <div className="flex flex-col items-start gap-1">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    saveEdit()
                  } else if (e.key === 'Escape') {
                    cancelEditing()
                  }
                }}
                autoFocus
                className="h-7 text-[14px] px-2 font-medium"
                disabled={isSaving}
              />
              {isSaving && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              )}
            </div>
          ) : (
            <div 
              className="group flex items-center gap-1.5 cursor-pointer"
              onDoubleClick={() => startEditing(candidate.id, 'candidate', candidate.name)}
            >
              <span className="font-medium text-[14px] text-gray-900">
                {toTitleCase(candidate.name)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  startEditing(candidate.id, 'candidate', candidate.name)
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit2 className="h-3 w-3 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              openProfileDrawer(candidate.id)
            }}
            className="text-[12px] text-blue-600 hover:text-blue-800 hover:underline"
          >
            View Profile
          </button>
        </div>
      )
      }

      case 'date': {
    const d = new Date(candidate.created_at)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return (
      <span className="text-gray-600 text-[13px] tabular-nums">{yyyy}/{mm}/{dd}</span>
    )
  }
      
      case 'status':
        // Move Candidate Stage: Permission-based
        const canChangeStatus = hasModuleAccess('Move Candidate Stage')
        
        // Map status values to display labels
        const statusLabels: Record<string, string> = {
          linedup: 'Lined Up',
          ringing: 'Ringing',
          callback: 'Callback',
          shortlisted: 'Shortlisted',
          rejected: 'Rejected',
          final_select: 'Final Select',
          not_interested: 'Not Interested',
          not_reachable: 'Not Reachable'
        }
        
        const statusLabel = statusLabels[candidate.status?.toLowerCase()] || candidate.status || 'Unknown'
        
        if (canChangeStatus) {
          return (
            <Select
              value={candidate.status}
              onValueChange={async (newStatus) => {
                const supabase = createClient()
                const { error } = await supabase
                  .from('candidates')
                  .update({ status: newStatus })
                  .eq('id', candidate.id)
                
                if (!error) {
                  setCandidates(candidates.map(c => 
                    c.id === candidate.id ? { ...c, status: newStatus } : c
                  ))
                }
              }}
            >
              <SelectTrigger className={`w-[140px] h-7 ${statusColors[candidate.status?.toLowerCase() as keyof typeof statusColors] || 'bg-gray-50 text-gray-700 border border-gray-200'} rounded-full border-0 text-[12px] font-medium`}>
                <SelectValue>
                  {statusLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linedup">Lined Up</SelectItem>
                <SelectItem value="ringing">Ringing</SelectItem>
                <SelectItem value="callback">Callback</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="final_select">Final Select</SelectItem>
                <SelectItem value="not_interested">Not Interested</SelectItem>
                <SelectItem value="not_reachable">Not Reachable</SelectItem>
              </SelectContent>
            </Select>
          )
        } else {
          // Recruiter: Can only view status, not change it
          return (
            <Badge className={`${statusColors[candidate.status?.toLowerCase() as keyof typeof statusColors] || 'bg-gray-50 text-gray-700 border border-gray-200'} px-3 py-1 text-[12px] font-medium`}>
              {statusLabel}
            </Badge>
          )
        }
      
      case 'quality':
        // Quality dropdown - using same values as add-candidate form (A1, B1, B2, C1, C2, C3)
        const qualityValue = candidate.quality || ''
        
        // Check permission for quality change
        const canChangeQuality = hasModuleAccess('Move Candidate Stage') // Using same permission as status
        
        if (canChangeQuality) {
          return (
            <Select
              value={qualityValue}
              onValueChange={async (newQuality) => {
                const supabase = createClient()
                const { error } = await supabase
                  .from('candidates')
                  .update({ quality: newQuality })
                  .eq('id', candidate.id)
                
                if (!error) {
                  setCandidates(candidates.map(c => 
                    c.id === candidate.id ? { ...c, quality: newQuality } : c
                  ))
                  toast({
                    title: 'Quality Updated',
                    description: `Quality changed to ${newQuality}`
                  })
                } else {
                  toast({
                    title: 'Update Failed',
                    description: 'Failed to update quality',
                    variant: 'destructive'
                  })
                }
              }}
            >
              <SelectTrigger className={`w-[100px] h-7 ${qualityColors[candidate.quality as keyof typeof qualityColors] || 'bg-gray-50 text-gray-700 border border-gray-200'} rounded-full border-0 text-[12px] font-medium`}>
                <SelectValue placeholder="Select">
                  {qualityValue || 'Not Rated'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A1">A1</SelectItem>
                <SelectItem value="B1">B1</SelectItem>
                <SelectItem value="B2">B2</SelectItem>
                <SelectItem value="C1">C1</SelectItem>
                <SelectItem value="C2">C2</SelectItem>
                <SelectItem value="C3">C3</SelectItem>
              </SelectContent>
            </Select>
          )
        } else {
          // View only - show as badge
          return (
            <Badge className={`${qualityColors[candidate.quality as keyof typeof qualityColors] || 'bg-gray-50 text-gray-700 border border-gray-200'} px-3 py-1 text-[12px] font-medium`}>
              {qualityValue || 'Not Rated'}
            </Badge>
          )
        }
      
      case 'experience':
        return (
          <span className="text-gray-600 text-[13px]">
            {candidate.years_of_experience ? `${candidate.years_of_experience} yrs` : 'N/A'}
          </span>
        )
      
        case 'location': {
          const locValue = candidate.current_location || ''
          const filteredCities = cities.filter(c =>
            !cellLocSearch || c.toLowerCase().includes(cellLocSearch.toLowerCase())
          ).slice(0, 80)
          // Always include current value so it appears in the list (case-insensitive dedup)
          const locOptions = locValue && !filteredCities.some(c => c.toLowerCase() === locValue.toLowerCase())
            ? [locValue, ...filteredCities]
            : filteredCities
          return (
            <div className="flex items-center gap-1 text-gray-600 text-[13px]">
              <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <Select
                value={locValue}
                onValueChange={async (val) => {
                  const supabase = createClient()
                  const { error } = await supabase.from('candidates').update({ current_location: val }).eq('id', candidate.id)
                  if (!error) setCandidates(prev => prev.map(cd => cd.id === candidate.id ? { ...cd, current_location: val } : cd))
                }}
                onOpenChange={(open) => { if (!open) setCellLocSearch('') }}
              >
                <SelectTrigger className="h-7 border-0 shadow-none p-0 bg-transparent text-[13px] text-gray-600 w-auto gap-1 focus:ring-0 min-w-[80px]">
                  <SelectValue>
                    {locValue || <span className="text-gray-400 italic">Set location</span>}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1.5 sticky top-0 bg-white border-b z-10">
                    <input
                      className="w-full text-xs border rounded px-2 py-1 outline-none focus:border-[#4F46E5]"
                      placeholder="Search city..."
                      value={cellLocSearch}
                      onChange={e => setCellLocSearch(e.target.value)}
                      onKeyDown={e => e.stopPropagation()}
                      autoFocus
                    />
                  </div>
                  {locOptions.map((c, i) => (
                    <SelectItem key={`loc-${i}-${c}`} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        }
      
    case 'contact':
      const isEditingPhone = editingCell?.candidateId === candidate.id && editingCell?.field === 'contact'
      
      return (
        <div className="flex items-center gap-1.5 text-gray-600 text-[13px]">
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (candidate.mobile_number) {
                const cleanPhone = candidate.mobile_number.replace(/\D/g, '')
                if (cleanPhone) {
                  window.open(`https://wa.me/${cleanPhone}`, '_blank')
                } else {
                  alert('No WhatsApp number available for this contact')
                }
              } else {
                alert('No WhatsApp number available for this contact')
              }
            }}
            className="hover:scale-110 transition-transform cursor-pointer p-0.5"
            title="Send WhatsApp message"
          >
            <svg 
              className="h-3.5 w-3.5 text-green-500 hover:text-green-600" 
              viewBox="0 0 24 24" 
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          </button>
          
          {isEditingPhone ? (
            <div className="flex items-center gap-1">
              <Input
                type="tel"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    saveEdit()
                  } else if (e.key === 'Escape') {
                    cancelEditing()
                  }
                }}
                autoFocus
                className="h-7 text-[13px] px-2 w-32"
                disabled={isSaving}
              />
              {isSaving && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              )}
            </div>
          ) : (
            <div 
              className="group flex items-center gap-1.5 cursor-pointer"
              onDoubleClick={() => startEditing(candidate.id, 'contact', candidate.mobile_number)}
            >
              <span>{candidate.mobile_number || 'N/A'}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  startEditing(candidate.id, 'contact', candidate.mobile_number)
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit2 className="h-3 w-3 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
          )}
        </div>
      )
      
    case 'email':
      return (
        <EditableCell
          candidateId={candidate.id}
          field="email"
          value={candidate.email}
          displayValue={candidate.email || 'N/A'}
          type="email"
          icon={<Mail className="h-3.5 w-3.5 text-gray-400" />}
        />
      )
      
    case 'current_ctc':
      return (
        <EditableCell
          candidateId={candidate.id}
          field="current_ctc"
          value={candidate.current_ctc}
          displayValue={candidate.current_ctc ? `₹${parseFloat(candidate.current_ctc).toLocaleString('en-IN')} LPA` : 'N/A'}
          type="number"
          icon={<IndianRupee className="h-3.5 w-3.5 text-gray-400" />}
        />
      )
    
    case 'expected_ctc':
      return (
        <EditableCell
          candidateId={candidate.id}
          field="expected_ctc"
          value={candidate.expected_ctc}
          displayValue={candidate.expected_ctc ? `₹${parseFloat(candidate.expected_ctc).toLocaleString('en-IN')} LPA` : 'N/A'}
          type="number"
          icon={<IndianRupee className="h-3.5 w-3.5 text-gray-400" />}
        />
      )
      
      case 'notice_period': {
        const noticePeriodOptions = ['Immediate Joiner', '15 days', '30 days', '45 days', '60 days', '90 days']
        return (
          <div className="flex items-center gap-1 text-gray-600 text-[13px]">
            <Clock className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <Select
              value={candidate.notice_period || ''}
              onValueChange={async (val) => {
                const supabase = createClient()
                const { error } = await supabase.from('candidates').update({ notice_period: val }).eq('id', candidate.id)
                if (!error) {
                  setCandidates(prev => prev.map(cd => cd.id === candidate.id ? { ...cd, notice_period: val } : cd))
                  toast({ title: 'Updated', description: 'Notice period updated' })
                }
              }}
            >
              <SelectTrigger className="h-7 border-0 shadow-none p-0 bg-transparent text-[13px] text-gray-600 w-auto gap-1 focus:ring-0">
                <SelectValue placeholder="Set notice period" />
              </SelectTrigger>
              <SelectContent>
                {noticePeriodOptions.map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      }
      
      case 'skills': {
        const isEditingSkills = editingCell?.candidateId === candidate.id && editingCell?.field === 'skills'
        const rawSkills = candidate.skills
          ? (typeof candidate.skills === 'string'
              ? candidate.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
              : candidate.skills)
          : []
        const filteredSkillSuggestions = allSkills.filter(s =>
          skillsInput && s.toLowerCase().includes(skillsInput.toLowerCase()) && !editSkillsArr.includes(s)
        ).slice(0, 8)
        return (
          <div className="flex flex-wrap gap-1 max-w-[220px]">
            {isEditingSkills ? (
              <div className="relative w-full">
                <div className="flex flex-wrap gap-1 border rounded p-1 bg-white min-h-[32px]">
                  {editSkillsArr.map((s, i) => (
                    <span key={i} className="flex items-center gap-0.5 bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded-full">
                      {s}
                      <button onClick={() => setEditSkillsArr(prev => prev.filter((_, idx) => idx !== i))} className="text-purple-500 hover:text-red-500 ml-0.5">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                  <input
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ',') && skillsInput.trim()) {
                        e.preventDefault()
                        if (!editSkillsArr.includes(skillsInput.trim())) {
                          setEditSkillsArr(prev => [...prev, skillsInput.trim()])
                        }
                        setSkillsInput('')
                      }
                    }}
                    className="text-[11px] outline-none flex-1 min-w-[80px] h-5"
                    placeholder="Type & Enter..."
                    autoFocus
                  />
                </div>
                {filteredSkillSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 z-50 bg-white border rounded shadow-md max-h-36 overflow-y-auto w-full">
                    {filteredSkillSuggestions.map(s => (
                      <div key={s} className="px-3 py-1 text-xs cursor-pointer hover:bg-purple-50"
                        onMouseDown={() => {
                          if (!editSkillsArr.includes(s)) setEditSkillsArr(prev => [...prev, s])
                          setSkillsInput('')
                        }}
                      >{s}</div>
                    ))}
                  </div>
                )}
                <div className="flex gap-1 mt-1">
                  <button
                    className="text-xs text-green-600 font-medium"
                    onClick={async () => {
                      const supabase = createClient()
                      const skillStr = editSkillsArr.join(',')
                      await supabase.from('candidates').update({ skills: skillStr }).eq('id', candidate.id)
                      setCandidates(prev => prev.map(cd => cd.id === candidate.id ? { ...cd, skills: skillStr } : cd))
                      toast({ title: 'Updated', description: 'Skills updated' })
                      setEditingCell(null)
                      setSkillsInput('')
                      setEditSkillsArr([])
                    }}
                  >Save</button>
                  <button className="text-xs text-gray-400" onClick={() => { setEditingCell(null); setSkillsInput(''); setEditSkillsArr([]) }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="group flex flex-wrap gap-1 cursor-pointer w-full"
                onDoubleClick={() => {
                  setEditingCell({ candidateId: candidate.id, field: 'skills' })
                  setEditSkillsArr(rawSkills)
                  setSkillsInput('')
                }}
              >
                {rawSkills.slice(0, 2).map((s: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-[10px] px-2 py-0">{s}</Badge>
                ))}
                {rawSkills.length > 2 && (
                  <Badge variant="secondary" className="text-[10px] px-2 py-0">+{rawSkills.length - 2}</Badge>
                )}
                {rawSkills.length === 0 && (
                  <span className="text-gray-400 text-[11px]">Add skills</span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingCell({ candidateId: candidate.id, field: 'skills' })
                    setEditSkillsArr(rawSkills)
                    setSkillsInput('')
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                >
                  <Edit2 className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
            )}
          </div>
        )
      }
      
      case 'industry': {
        const indValue = candidate.industry || ''
        const filtInd = industries.filter(i =>
          !cellIndSearch || i.toLowerCase().includes(cellIndSearch.toLowerCase())
        ).slice(0, 80)
        const indOptions = indValue && !filtInd.includes(indValue)
          ? [indValue, ...filtInd]
          : filtInd
        return (
          <Select
            value={indValue}
            onValueChange={async (val) => {
              const supabase = createClient()
              const { error } = await supabase.from('candidates').update({ industry: val }).eq('id', candidate.id)
              if (!error) setCandidates(prev => prev.map(cd => cd.id === candidate.id ? { ...cd, industry: val } : cd))
            }}
            onOpenChange={(open) => { if (!open) setCellIndSearch('') }}
          >
            <SelectTrigger className="h-7 border-0 shadow-none p-0 bg-transparent text-[13px] text-gray-600 w-auto gap-1 focus:ring-0 min-w-[100px]">
              <SelectValue>
                {indValue || <span className="text-gray-400 italic">Set industry</span>}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <div className="px-2 py-1.5 sticky top-0 bg-white border-b z-10">
                <input
                  className="w-full text-xs border rounded px-2 py-1 outline-none focus:border-[#4F46E5]"
                  placeholder="Search industry..."
                  value={cellIndSearch}
                  onChange={e => setCellIndSearch(e.target.value)}
                  onKeyDown={e => e.stopPropagation()}
                  autoFocus
                />
              </div>
              {indOptions.map(ind => (
                <SelectItem key={ind} value={ind}>{ind}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      }
      
  case 'preferred_location': {
    const prefValue = candidate.preferred_location || ''
    const filtPrefCities = cities.filter(c =>
      !cellPrefSearch || c.toLowerCase().includes(cellPrefSearch.toLowerCase())
    ).slice(0, 80)
    const prefOptions = prefValue && !filtPrefCities.some(c => c.toLowerCase() === prefValue.toLowerCase())
      ? [prefValue, ...filtPrefCities]
      : filtPrefCities
    return (
      <div className="flex items-center gap-1 text-gray-600 text-[13px]">
        <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
        <Select
          value={prefValue}
          onValueChange={async (val) => {
            const supabase = createClient()
            const { error } = await supabase.from('candidates').update({ preferred_location: val }).eq('id', candidate.id)
            if (!error) setCandidates(prev => prev.map(cd => cd.id === candidate.id ? { ...cd, preferred_location: val } : cd))
          }}
          onOpenChange={(open) => { if (!open) setCellPrefSearch('') }}
        >
          <SelectTrigger className="h-7 border-0 shadow-none p-0 bg-transparent text-[13px] text-gray-600 w-auto gap-1 focus:ring-0 min-w-[80px]">
            <SelectValue>
              {prefValue || <span className="text-gray-400 italic">Set location</span>}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <div className="px-2 py-1.5 sticky top-0 bg-white border-b z-10">
              <input
                className="w-full text-xs border rounded px-2 py-1 outline-none focus:border-[#4F46E5]"
                placeholder="Search city..."
                value={cellPrefSearch}
                onChange={e => setCellPrefSearch(e.target.value)}
                onKeyDown={e => e.stopPropagation()}
                autoFocus
              />
            </div>
            {prefOptions.map((c, i) => (
              <SelectItem key={`pref-${i}-${c}`} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }
  
  case 'area': {
  const isEditingArea = editingCell?.candidateId === candidate.id && editingCell?.field === 'area'
  return (
  <div className="flex items-center gap-1 text-gray-600 text-[13px]">
  <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
  {isEditingArea ? (
  <input
    value={editValue}
    onChange={e => setEditValue(e.target.value)}
    onBlur={saveEdit}
    onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEditing() }}
    autoFocus
    className="h-6 text-[13px] border-0 border-b border-[#4F46E5] outline-none bg-transparent w-28"
    placeholder="Type area..."
  />
  ) : (
  <span
    className="cursor-pointer hover:text-[#4F46E5] transition-colors"
    onClick={() => startEditing(candidate.id, 'area', candidate.area || '')}
  >
    {candidate.area || <span className="text-gray-400 italic text-[12px]">Add area</span>}
  </span>
  )}
      </div>
    )
  }
  
  case 'buyout_available':
        return (
          <Badge 
            variant={candidate.buyout_available === 'Yes' ? 'default' : 'secondary'} 
            className="text-[11px] px-2 py-0.5"
          >
            {candidate.buyout_available || 'N/A'}
          </Badge>
        )
      
      case 'assigned_job': {
        const isEditingJob = editingCell?.candidateId === candidate.id && editingCell?.field === 'assigned_job'
        // Support multi-job via job_ids array; fall back to single job_id for backward compat
        const currentJobIds: string[] = Array.isArray(candidate.job_ids) && candidate.job_ids.length > 0
          ? candidate.job_ids
          : candidate.job_id ? [candidate.job_id] : []
        const assignedJobs = orgJobs.filter(j => currentJobIds.includes(j.id))
        const filtJobs = orgJobs.filter(j =>
          !jobSearch || j.title.toLowerCase().includes(jobSearch.toLowerCase()) || j.job_id?.toLowerCase().includes(jobSearch.toLowerCase())
        ).slice(0, 50)

        const toggleJobSelection = async (jobId: string) => {
          const supabase = createClient()
          const newIds = currentJobIds.includes(jobId)
            ? currentJobIds.filter(id => id !== jobId)
            : [...currentJobIds, jobId]
          const primaryJobId = newIds.length > 0 ? newIds[0] : null

          // Find client_name from the first assigned job that has one
          const newDerivedJob = newIds
            .map(jid => orgJobs.find(j => j.id === jid))
            .find(j => j && (j as any).client_name) as any
          const newCompanyName = newDerivedJob?.client_name || null

          // Persist job assignment AND company_name directly on the candidate row
          await supabase.from('candidates').update({
            job_ids: newIds,
            job_id: primaryJobId,
            company_name: newCompanyName,
          }).eq('id', candidate.id)

          setCandidates(prev => prev.map(cd => cd.id === candidate.id ? {
            ...cd,
            job_ids: newIds,
            job_id: primaryJobId,
            company_name: newCompanyName,
            _derived_company: newCompanyName,
          } : cd))
        }

        return (
          <div className="text-gray-600 text-[13px]">
            {isEditingJob ? (
              <div className="relative min-w-[180px]">
                <Input
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  autoFocus
                  className="h-7 text-xs px-2"
                  placeholder="Search & select jobs..."
                />
                <div className="absolute top-8 left-0 z-[60] bg-white border rounded shadow-lg max-h-52 overflow-y-auto w-60">
                  {currentJobIds.length > 0 && (
                    <div
                      className="px-3 py-1.5 text-xs cursor-pointer hover:bg-red-50 text-red-500 border-b"
                      onMouseDown={async () => {
                        const supabase = createClient()
                        await supabase.from('candidates').update({ job_ids: [], job_id: null }).eq('id', candidate.id)
                        setCandidates(prev => prev.map(cd => cd.id === candidate.id ? { ...cd, job_ids: [], job_id: null } : cd))
                        toast({ title: 'Cleared', description: 'All job assignments removed' })
                        setEditingCell(null); setJobSearch('')
                      }}
                    >Clear all assignments</div>
                  )}
                  {filtJobs.map(j => {
                    const isSelected = currentJobIds.includes(j.id)
                    return (
                      <div key={j.id}
                        className={`px-3 py-1.5 text-xs cursor-pointer hover:bg-purple-50 flex items-center gap-2 ${isSelected ? 'bg-purple-50' : ''}`}
                        onMouseDown={async (e) => {
                          e.preventDefault()
                          await toggleJobSelection(j.id)
                        }}
                      >
                        <div className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${isSelected ? 'bg-[#4F46E5] border-[#4F46E5]' : 'border-gray-300'}`}>
                          {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                        </div>
                        <div>
                          <div className={`font-medium ${isSelected ? 'text-[#4F46E5]' : ''}`}>{j.title}</div>
                          {j.job_id && <div className="text-gray-400">{j.job_id}</div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <button onClick={() => { setEditingCell(null); setJobSearch('') }} className="text-xs text-gray-400 mt-1 hover:text-gray-600">Done</button>
              </div>
            ) : (
              <div className="group flex flex-col gap-0.5 cursor-pointer"
                onDoubleClick={() => { setEditingCell({ candidateId: candidate.id, field: 'assigned_job' }); setJobSearch('') }}
              >
                {assignedJobs.length > 0 ? (
                  <>
                    {assignedJobs.slice(0, 2).map(j => (
                      <span key={j.id} className="text-[#4F46E5] font-medium truncate max-w-[140px] text-[12px]" title={j.title}>{j.title}</span>
                    ))}
                    {assignedJobs.length > 2 && (
                      <span className="text-[11px] text-gray-400">+{assignedJobs.length - 2} more</span>
                    )}
                  </>
                ) : (
                  <span className="text-gray-400 italic text-[12px]">Not assigned</span>
                )}
                <button onClick={(e) => { e.stopPropagation(); setEditingCell({ candidateId: candidate.id, field: 'assigned_job' }); setJobSearch('') }} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 self-start mt-0.5">
                  <Edit2 className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
            )}
          </div>
        )
      }
      
  case 'assigned_team': {
  const assignedRecruiter = orgRecruiters.find(r => r.id === candidate.assigned_to)
  const filtRecruiters = orgRecruiters.filter(r => !cellRecruiterSearch || r.name.toLowerCase().includes(cellRecruiterSearch.toLowerCase()))
  return (
  <div className="flex items-center gap-1 text-gray-600 text-[13px]">
  <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
  <Select
  value={candidate.assigned_to || 'none'}
  onValueChange={async (val) => {
  const supabase = createClient()
  const newVal = val === 'none' ? null : val
  const { error } = await supabase.from('candidates').update({ assigned_to: newVal }).eq('id', candidate.id)
  if (!error) {
  setCandidates(prev => prev.map(cd => cd.id === candidate.id ? { ...cd, assigned_to: newVal } : cd))
  toast({ title: 'Updated', description: 'Recruiter assigned' })
  }
  }}
  onOpenChange={(open) => { if (!open) setCellRecruiterSearch('') }}
  >
  <SelectTrigger className="h-7 border-0 shadow-none p-0 bg-transparent text-[13px] text-gray-600 w-auto gap-1 focus:ring-0 max-w-[130px]">
  <SelectValue placeholder="Assign recruiter">
  {assignedRecruiter?.name || (candidate.assigned_to ? 'Unknown' : 'Unassigned')}
  </SelectValue>
  </SelectTrigger>
  <SelectContent>
  <div className="px-2 py-1.5 sticky top-0 bg-white border-b">
    <input
      className="w-full text-xs border rounded px-2 py-1 outline-none focus:border-[#4F46E5]"
      placeholder="Search recruiter..."
      value={cellRecruiterSearch}
      onChange={e => setCellRecruiterSearch(e.target.value)}
      onKeyDown={e => e.stopPropagation()}
      autoFocus
    />
  </div>
  <SelectItem value="none">Unassigned</SelectItem>
  {filtRecruiters.map(r => (
  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
  ))}
  </SelectContent>
  </Select>
  </div>
  )
  }
      
      case 'company_name': {
        const companyVal = candidate.company_name || ''
        // If no manually set company, derive from assigned job's client_name
        const displayCompany = companyVal || candidate._derived_company || ''

        const filtCompanies = orgClients.filter(c =>
          !cellCompanySearch || c.company_name.toLowerCase().includes(cellCompanySearch.toLowerCase())
        ).slice(0, 80)
        const companyOptions = displayCompany && !filtCompanies.some(c => c.company_name === displayCompany)
          ? [{ id: '__current__', company_name: displayCompany }, ...filtCompanies]
          : filtCompanies
        return (
          <Select
            value={companyVal}
            onValueChange={async (val) => {
              const supabase = createClient()
              const { error } = await supabase.from('candidates').update({ company_name: val }).eq('id', candidate.id)
              if (!error) setCandidates(prev => prev.map(cd => cd.id === candidate.id ? { ...cd, company_name: val } : cd))
            }}
            onOpenChange={(open) => { if (!open) setCellCompanySearch('') }}
          >
            <SelectTrigger className="h-7 border-0 shadow-none p-0 bg-transparent text-[13px] text-gray-600 w-auto gap-1 focus:ring-0 min-w-[110px]">
              <SelectValue>
                {displayCompany
                  ? <span className={candidate._derived_company && !companyVal ? 'text-gray-600' : 'text-gray-600'}>{displayCompany}</span>
                  : <span className="text-gray-400 italic">—</span>
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <div className="px-2 py-1.5 sticky top-0 bg-white border-b z-10">
                <input
                  className="w-full text-xs border rounded px-2 py-1 outline-none focus:border-[#4F46E5]"
                  placeholder="Search company..."
                  value={cellCompanySearch}
                  onChange={e => setCellCompanySearch(e.target.value)}
                  onKeyDown={e => e.stopPropagation()}
                  autoFocus
                />
              </div>
              {companyOptions.length === 0 ? (
                <div className="px-3 py-3 text-xs text-gray-400 text-center">No clients found</div>
              ) : (
                companyOptions.map(c => (
                  <SelectItem key={c.id} value={c.company_name}>{c.company_name}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        )
      }

      case 'feedback': {
        const canAddNotes = userRole === 'super_admin' || userRole === 'hiring_manager'
        const isEditingFeedback = editingCell?.candidateId === candidate.id && editingCell?.field === 'feedback'
        return (
          <div className="max-w-[200px] text-gray-600 text-[13px]">
            {isEditingFeedback && canAddNotes ? (
              <div className="flex flex-col gap-1">
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  autoFocus
                  rows={3}
                  className="text-xs border rounded p-1.5 w-44 resize-none focus:outline-none focus:ring-1 focus:ring-purple-400"
                  placeholder="Add a note..."
                />
                <div className="flex gap-1">
                  <button onClick={saveEdit} className="text-xs text-green-600 font-medium">Save</button>
                  <button onClick={cancelEditing} className="text-xs text-gray-400">Cancel</button>
                </div>
              </div>
            ) : (
              <div
                className={`group flex items-start gap-1 ${canAddNotes ? 'cursor-pointer' : ''}`}
                onDoubleClick={() => canAddNotes && startEditing(candidate.id, 'feedback', candidate.feedback || '')}
              >
                <span className="truncate max-w-[170px]" title={candidate.feedback || ''}>{candidate.feedback || (canAddNotes ? 'Add note...' : 'No notes')}</span>
                {canAddNotes && (
                  <button
                    onClick={(e) => { e.stopPropagation(); startEditing(candidate.id, 'feedback', candidate.feedback || '') }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  >
                    <Edit2 className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            )}
          </div>
        )
      }
      
      case 'quality':
        // Only admin and hiring_manager can change quality ratings
        const canEditQuality = userRole === 'admin' || userRole === 'super_admin' || userRole === 'hiring_manager'
        
        if (!canEditQuality) {
          // Recruiters see a static badge
          return (
            <Badge 
              variant="secondary" 
              className={cn(
                "text-[11px] px-2 py-0.5 font-medium",
                candidate.quality === 'A1' && 'bg-green-100 text-green-700 border-green-200',
                (candidate.quality === 'B1' || candidate.quality === 'B2') && 'bg-blue-100 text-blue-700 border-blue-200',
                (candidate.quality === 'C1' || candidate.quality === 'C2' || candidate.quality === 'C3') && 'bg-orange-100 text-orange-700 border-orange-200',
                !candidate.quality && 'bg-gray-100 text-gray-600 border-gray-200'
              )}
            >
              {candidate.quality || 'Not rated'}
            </Badge>
          )
        }
        
        // Admin and managers see an editable dropdown
        return (
          <Select
            value={candidate.quality || 'not_rated'}
            onValueChange={async (value) => {
              console.log('[v0] Updating quality for candidate:', candidate.id, 'to:', value)
              
              // Update database
              const supabase = createClient()
              const { error } = await supabase
                .from('candidates')
                .update({ quality: value === 'not_rated' ? null : value })
                .eq('id', candidate.id)
              
              if (error) {
                console.error('[v0] Error updating quality:', error)
                toast({
                  title: 'Error',
                  description: 'Failed to update quality',
                  variant: 'destructive'
                })
              } else {
                // Update local state
                setCandidates(prev => prev.map(c => 
                  c.id === candidate.id ? { ...c, quality: value === 'not_rated' ? null : value } : c
                ))
                toast({
                  title: 'Success',
                  description: 'Quality updated successfully',
                })
              }
            }}
          >
            <SelectTrigger className={cn(
              "h-7 text-[11px] w-[90px] border-0 shadow-none focus:ring-0",
              candidate.quality === 'A1' && 'bg-green-100 text-green-700',
              (candidate.quality === 'B1' || candidate.quality === 'B2') && 'bg-blue-100 text-blue-700',
              (candidate.quality === 'C1' || candidate.quality === 'C2' || candidate.quality === 'C3') && 'bg-orange-100 text-orange-700',
              !candidate.quality && 'bg-gray-100 text-gray-600'
            )}>
              <SelectValue placeholder="Not rated" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not_rated">Not rated</SelectItem>
              <SelectItem value="A1">A1</SelectItem>
              <SelectItem value="B1">B1</SelectItem>
              <SelectItem value="B2">B2</SelectItem>
              <SelectItem value="C1">C1</SelectItem>
              <SelectItem value="C2">C2</SelectItem>
              <SelectItem value="C3">C3</SelectItem>
            </SelectContent>
          </Select>
        )
      
      default:
        return null
    }
  }

  const handleSendEmail = (email: string) => {
    setSelectedEmail(email)
    setEmailDialogOpen(true)
  }

  const handleEmailClientSelect = (client: string) => {
    let emailUrl = ''
    
    switch (client) {
      case 'gmail':
        emailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${selectedEmail}`
        break
      case 'outlook':
        emailUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${selectedEmail}`
        break
      case 'yahoo':
        emailUrl = `https://compose.mail.yahoo.com/?to=${selectedEmail}`
        break
      case 'default':
        emailUrl = `mailto:${selectedEmail}`
        break
    }
    
    window.open(emailUrl, '_blank')
    setEmailDialogOpen(false)
  }

  const EXPORT_LIMIT = 5000

  // Build a CSV string from an array of objects and trigger download
  const downloadCSV = (rows: Record<string, any>[], filename: string) => {
    if (rows.length === 0) {
      toast({ title: 'No data', description: 'Nothing to export.', variant: 'destructive' })
      return
    }
    const headers = Object.keys(rows[0])
    const csv = [
      headers.join(','),
      ...rows.map(row =>
        headers.map(h => {
          const val = row[h] == null ? '' : String(row[h])
          return val.includes(',') || val.includes('"') || val.includes('\n')
            ? `"${val.replace(/"/g, '""')}"`
            : val
        }).join(',')
      )
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportToCSV = () => {
    const toExport = filteredCandidates.slice(0, EXPORT_LIMIT).map(c => ({
      Name: c.name || '',
      Email: c.email || '',
      Mobile: c.mobile_number || '',
      Location: c.current_location || '',
      Skills: Array.isArray(c.skills) ? c.skills.join('; ') : (c.skills || ''),
      Experience: c.years_of_experience || c.experience_years || '',
      'Current CTC': c.current_ctc || '',
      'Expected CTC': c.expected_ctc || '',
      Status: c.status || '',
      'Applied Job': c.applied_job || '',
      'Created At': c.created_at ? new Date(c.created_at).toLocaleDateString() : '',
    }))
    downloadCSV(toExport, `candidates-export-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  const exportJoinersSheet = () => {
    const joiners = filteredCandidates.filter(c => c.status === 'final_select').slice(0, EXPORT_LIMIT).map(c => ({
      Name: c.name || '',
      Email: c.email || '',
      Mobile: c.mobile_number || '',
      Location: c.current_location || '',
      'Applied Job': c.applied_job || '',
      'Joining Date': c.joining_date ? new Date(c.joining_date).toLocaleDateString() : '',
      'Current CTC': c.current_ctc || '',
      'Expected CTC': c.expected_ctc || '',
      'Created At': c.created_at ? new Date(c.created_at).toLocaleDateString() : '',
    }))
    downloadCSV(joiners, `joiners-sheet-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  // Select / deselect all visible candidates
  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCandidatesIds(new Set(paginatedCandidates.map((c) => c.id)))
    } else {
      setSelectedCandidatesIds(new Set())
    }
  }

  // Toggle selection for a single candidate row
  const toggleCandidateSelection = (id: string) => {
    setSelectedCandidatesIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

// Fetch candidates function - extracted to be reusable
  const fetchCandidates = useCallback(async () => {
    try {
      // ── Read everything from localStorage — no prop deps, so this never re-runs ──
      const userStr = localStorage.getItem('hyrix_user')
      if (!userStr) { setLoading(false); return }

      const user = JSON.parse(userStr)
      const role: string = user.role || ''
      const organizationId: string =
        user.organizationId || user.organization_id || user.id || ''

      if (!organizationId) {
        setLoading(false)
        return
      }

      // For recruiters/HM: fetch only their own candidates (created_by = their org_team.id)
      let recruiterId: string | undefined
      if (role === 'recruiter' || role === 'hiring_manager') {
        recruiterId = user.id || undefined
        if (!recruiterId) {
          setCandidates([])
          setLoading(false)
          return
        }
      }

      // Helper to fetch from Lightsail via /api/db — never throws
      const pgFetch = async (op: string, table: string, opts: Record<string, any> = {}) => {
        try {
          const res = await fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ op, table, ...opts }),
          })
          const json = await res.json()
          return { data: json.data ?? [], error: json.error ?? null }
        } catch { return { data: [], error: 'fetch failed' } }
      }

      const teamMembersPromise = pgFetch('select', 'org_team', {
        select: 'id, name, email',
        filters: [{ column: 'organization_id', op: '=', value: organizationId }],
      })
      const jobsPromise = pgFetch('select', 'jobs', {
        select: 'id, title, client_name',
        filters: [{ column: 'organization_id', op: '=', value: organizationId }],
      })

      const candidatesUrl = new URL('/api/candidates', window.location.origin)
      candidatesUrl.searchParams.set('organizationId', organizationId)
      if (recruiterId) candidatesUrl.searchParams.set('recruiterId', recruiterId)

      // Execute all fetches in parallel — all are fault-tolerant
      const [candidatesRes, { data: teamMembers }, { data: jobsData }] = await Promise.all([
        fetch(candidatesUrl.toString()).then(r => r.json()).catch(() => ({ success: false, candidates: [] })),
        teamMembersPromise,
        jobsPromise,
      ])

      const data  = candidatesRes.success ? candidatesRes.candidates : []
      const error = candidatesRes.success ? null : { message: candidatesRes.error }

      // Build jobId → client_name lookup map
      const jobClientMap = new Map<string, string>()
      if (Array.isArray(jobsData)) {
        jobsData.forEach((job: { id: string; client_name?: string }) => {
          if (job.client_name) jobClientMap.set(job.id, job.client_name)
        })
      }
      
      if (error) {
        setCandidates([])
        setLoading(false)
        return
      }
    
    // Create team member lookup map
    const teamMemberMap = new Map<string, { name: string; email: string }>()
    if (teamMembers) {
      teamMembers.forEach(member => {
        teamMemberMap.set(member.id, { name: member.name, email: member.email })
      })
    }
    
    // Attach team member names + derive company name from assigned job
    const candidatesWithTeamMembers = data?.map(candidate => {
      // Get all assigned job IDs (support multi-job)
      const assignedJobIds: string[] = Array.isArray(candidate.job_ids) && candidate.job_ids.length > 0
        ? candidate.job_ids
        : candidate.job_id ? [candidate.job_id] : []

      // Derive company name from first assigned job that has a client_name
      const derivedCompanyName = assignedJobIds
        .map(jid => jobClientMap.get(jid))
        .find(name => !!name) || null

      return {
        ...candidate,
        assigned_team_member: candidate.assigned_to ? teamMemberMap.get(candidate.assigned_to) : null,
        // Use manually set company_name if present, otherwise fall back to job's contact_name
        _derived_company: derivedCompanyName,
      }
    }) || []
    
    setCandidates(candidatesWithTeamMembers)
    setLoading(false)
    } catch (err: any) {
      console.error('[candidates-list] fetchCandidates crashed:', err?.message)
      setCandidates([])
      setLoading(false)
    }
  // No prop deps — reads everything from localStorage, so function is stable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Run exactly once on mount — stable fetchCandidates guarantees no double-fetch
  useEffect(() => {
    fetchCandidates()
  }, [fetchCandidates])

  // Fetch reference data for dropdowns — wrapped in try-catch to never break page
  useEffect(() => {
    const loadRefData = async () => {
      try {
        const userStr = localStorage.getItem('hyrix_user')
        if (!userStr) return
        const user = JSON.parse(userStr)
        const orgId: string = user.organizationId || user.organization_id || user.id || ''
        if (!orgId) return

        const pgFetch = async (op: string, table: string, opts: Record<string, any> = {}) => {
          try {
            const res = await fetch('/api/db', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ op, table, ...opts }),
            })
            const json = await res.json()
            return { data: Array.isArray(json.data) ? json.data : [] }
          } catch { return { data: [] } }
        }

        const [
          { data: industryData },
          { data: cityData },
          { data: jobData },
          { data: recruiterData },
          { data: skillData },
          { data: clientData }
        ] = await Promise.all([
          pgFetch('select', 'industries', { select: 'name', orders: [{ column: 'name', ascending: true }] }),
          pgFetch('select', 'cities', { select: 'name', orders: [{ column: 'name', ascending: true }] }),
          pgFetch('select', 'jobs', { select: 'id, title, job_id, client_name', filters: [{ column: 'organization_id', op: '=', value: orgId }, { column: 'status', op: '=', value: 'active' }], orders: [{ column: 'title', ascending: true }] }),
          pgFetch('select', 'org_team', { select: 'id, name', filters: [{ column: 'organization_id', op: '=', value: orgId }, { column: 'role', op: '=', value: 'recruiter' }, { column: 'status', op: '=', value: 'active' }], orders: [{ column: 'name', ascending: true }] }),
          pgFetch('select', 'skills', { select: 'skill_name', orders: [{ column: 'skill_name', ascending: true }] }),
          pgFetch('select', 'clients', { select: 'id, company_name', filters: [{ column: 'organization_id', op: '=', value: orgId }], orders: [{ column: 'company_name', ascending: true }] }),
        ])

        setIndustries(industryData.map((r: any) => r.name))
        setCities([...new Set(cityData.map((r: any) => r.name))])
        setOrgJobs(jobData)
        setOrgRecruiters(recruiterData)
        setAllSkills(skillData.map((r: any) => r.skill_name))
        setOrgClients(clientData)
      } catch (err: any) {
        console.warn('[candidates-list] loadRefData error (non-fatal):', err?.message)
      }
    }
    loadRefData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, locationFilter, preferredLocationFilter, industryFilter, recruiterFilter, noticePeriodFilter, jobFilter])



  // Profile drawer handlers
  const openProfileDrawer = async (candidateId: string) => {
    setSelectedCandidateId(candidateId)
    setProfileDrawerOpen(true)
    setLoadingProfile(true)
    
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
      setLoadingProfile(false)
      return
    }
    
    setSelectedCandidate(data)
    setLoadingProfile(false)
  }
  
  const closeProfileDrawer = () => {
    setProfileDrawerOpen(false)
    setSelectedCandidateId(null)
    setSelectedCandidate(null)
  }
  
  // Inline editing handlers
  const startEditing = (candidateId: string, field: string, currentValue: any) => {
    setEditingCell({ candidateId, field })
    setEditValue(currentValue?.toString() || '')
    // Reset location validation so typing works fresh each time
    setIsValidLocation(false)
    setValidatedLocationName(currentValue?.toString() || '')
  }

  const cancelEditing = () => {
    setEditingCell(null)
    setEditValue('')
    setIsValidLocation(false)
    setValidatedLocationName('')
  }
  
  const saveEdit = async () => {
    if (!editingCell || isSaving) return
    
    const { candidateId, field } = editingCell
    const candidate = candidates.find(c => c.id === candidateId)
    if (!candidate) return
    
    // If value hasn't changed, just cancel
    let currentValue = ''
    if (field === 'location') {
      currentValue = candidate.current_location?.toString() || ''
    } else {
      currentValue = candidate[field as keyof Candidate]?.toString() || ''
    }
    if (editValue === currentValue) {
      cancelEditing()
      return
    }
    
    setIsSaving(true)
    const supabase = createClient()
    
    try {
      // Determine the correct column name and value type
      let updateData: any = {}
      let processedValue: any = editValue
      
      // Handle different field types
      if (field === 'current_ctc' || field === 'expected_ctc') {
        processedValue = editValue ? parseFloat(editValue) : null
      } else if (field === 'contact') {
        updateData = { mobile_number: editValue }
      } else if (field === 'candidate') {
        // Convert name to title case
        const titleCasedName = editValue
          .toLowerCase()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
        updateData = { name: titleCasedName }
        processedValue = titleCasedName
      } else if (field === 'location') {
        // Save free-text or validated city name to current_location
        const locationToSave = validatedLocationName || editValue
        updateData = { current_location: locationToSave }
        processedValue = locationToSave
      } else {
        updateData = { [field]: processedValue }
      }
      
      // If we haven't set updateData yet, set it now
      if (Object.keys(updateData).length === 0) {
        updateData = { [field]: processedValue }
      }
      
      const { error } = await supabase
        .from('candidates')
        .update(updateData)
        .eq('id', candidateId)
      
      if (error) throw error
      
      // Update local state — map field names to actual candidate object keys
      setCandidates(prev => prev.map(c => {
        if (c.id === candidateId) {
          if (field === 'contact') {
            return { ...c, mobile_number: editValue }
          } else if (field === 'candidate') {
            return { ...c, name: processedValue }
          } else if (field === 'location') {
            return { ...c, current_location: processedValue }
          } else {
            return { ...c, [field]: processedValue }
          }
        }
        return c
      }))
      
      toast({
        title: 'Success',
        description: 'Field updated successfully'
      })
      
      cancelEditing()
    } catch (error: any) {
      console.error('[v0] Error updating candidate field:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to update field',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  const downloadSampleTemplate = () => {
    const headers = [
      'Name',
      'Email',
      'Mobile Number',
      'Current Location',
      'Skills',
      'Experience Years',
      'Current CTC',
      'Expected CTC',
      'Notice Period',
      'Industry',
      'Status'
    ]
    
    const sampleData = [
      [
        'John Doe',
        'john@example.com',
        '9876543210',
        'Bangalore',
        'Java;Python;SQL',
        '5',
        '12',
        '15',
        '30 days',
        'IT',
        'linedup'
      ],
      [
        'Jane Smith',
        'jane@example.com',
        '9876543211',
        'Mumbai',
        'React;Node.js;MongoDB',
        '3',
        '8',
        '12',
        'Immediate Joiner',
        'IT',
        'linedup'
      ]
    ]
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n')
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', 'candidate_bulk_upload_template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  // Handle CSV / Excel file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadFile(file)
    setUploadErrors([])

    const ext = file.name.split('.').pop()?.toLowerCase()

    if (ext === 'xlsx' || ext === 'xls') {
      // Parse Excel using the xlsx library
      try {
        const XLSX = await import('xlsx')
        const arrayBuffer = await file.arrayBuffer()
        const workbook   = XLSX.read(arrayBuffer, { type: 'array' })
        const sheet      = workbook.Sheets[workbook.SheetNames[0]]
        // Convert to array-of-arrays so we reuse existing parseRows logic
        const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as string[][]
        if (rows.length < 2) {
          setUploadErrors(['Excel file is empty or has no data rows'])
          return
        }
        const headers = rows[0].map((h: any) => String(h ?? '').trim().toLowerCase())
        const dataRows = rows.slice(1).map(row => row.map((c: any) => String(c ?? '').trim()))
        parseRows(headers, dataRows)
      } catch (err: any) {
        setUploadErrors([`Failed to read Excel file: ${err.message}`])
      }
    } else {
      // Default: parse as CSV (text)
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        parseCSV(text)
      }
      reader.readAsText(file)
    }
  }
  
  // Shared row processor — used by both CSV and Excel parsers
  const parseRows = (headers: string[], dataRows: string[][]) => {
    const data: any[] = []
    const errors: string[] = []

    const fieldMapping: Record<string, string> = {
      'name': 'name',
      'email': 'email',
      'mobile number': 'mobile_number',
      'phone': 'mobile_number',
      'current location': 'current_location',
      'location': 'current_location',
      'skills': 'skills',
      'experience': 'years_of_experience',
      'experience years': 'years_of_experience',
      'years of experience': 'years_of_experience',
      'current ctc': 'current_ctc',
      'expected ctc': 'expected_ctc',
      'notice period': 'notice_period',
      'industry': 'industry',
      'preferred location': 'preferred_location',
      'area': 'area',
      'status': 'status',
    }

    dataRows.forEach((values, idx) => {
      if (!values.some(v => v)) return // skip fully empty rows
      const row: any = {}
      let hasError = false

      headers.forEach((header, index) => {
        const fieldName = fieldMapping[header]
        if (fieldName) {
          const value = String(values[index] ?? '').trim()
          if (fieldName === 'skills' && value) {
            row[fieldName] = value.split(';').map(s => s.trim()).filter(Boolean)
          } else if (['years_of_experience', 'current_ctc', 'expected_ctc'].includes(fieldName) && value) {
            row[fieldName] = parseFloat(value) || 0
          } else {
            row[fieldName] = value || ''
          }
        }
      })

      if (!row.name || !row.email || !row.mobile_number) {
        errors.push(`Row ${idx + 2}: Missing required fields (name, email, or mobile number)`)
        hasError = true
      }
      if (!row.status) row.status = 'linedup'
      if (!hasError) data.push(row)
    })

    setUploadedData(data)
    setUploadErrors(errors)
  }

  // Parse CSV — splits text into rows then calls shared parseRows
  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) { setUploadErrors(['File is empty or invalid']); return }

    const parseCSVLine = (line: string): string[] => {
      const result: string[] = []
      let cur = '', inQ = false
      for (let i = 0; i < line.length; i++) {
        const c = line[i], n = line[i + 1]
        if (c === '"') { if (inQ && n === '"') { cur += '"'; i++ } else { inQ = !inQ } }
        else if (c === ',' && !inQ) { result.push(cur.trim()); cur = '' }
        else { cur += c }
      }
      result.push(cur.trim())
      return result
    }

    const headers  = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase())
    const dataRows = lines.slice(1).map(l => parseCSVLine(l))
    parseRows(headers, dataRows)
  }
  
  // Save bulk candidates to database
  const handleSaveBulkUpload = async () => {
    if (uploadedData.length === 0) {
      toast({
        title: 'No data to upload',
        description: 'Please upload a valid CSV file first',
        variant: 'destructive'
      })
      return
    }
    
    setIsProcessingUpload(true)
    const supabase = createClient()
    
    try {
      // Get organization ID for the current user
      const userStr = localStorage.getItem('hyrix_user')
      let organizationId = null
      let currentUserEmail = userEmail
      
      if (userStr) {
        const user = JSON.parse(userStr)
        currentUserEmail = currentUserEmail || user.email
        
        // For recruiters and hiring managers, get organization from org_team table
        if (userRole === 'recruiter' || userRole === 'hiring_manager') {
          const { data: userData } = await supabase
            .from('org_team')
            .select('organization_id')
            .eq('email', currentUserEmail)
            .maybeSingle()
          organizationId = userData?.organization_id
        } else {
          const { data: orgData } = await supabase
            .from('organization')
            .select('id')
            .eq('email', currentUserEmail)
            .maybeSingle()
          organizationId = orgData?.id
        }
      }
      
      if (!organizationId) {
        toast({
          title: 'Error',
          description: 'Could not determine organization. Please try again.',
          variant: 'destructive'
        })
        setIsProcessingUpload(false)
        return
      }
      
      // Add organization_id to each candidate
      const candidatesWithOrgId = uploadedData.map(candidate => ({
        ...candidate,
        organization_id: organizationId
      }))
      
      const { data: insertedData, error } = await supabase
        .from('candidates')
        .insert(candidatesWithOrgId)
        .select()
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: `${uploadedData.length} candidates uploaded successfully`
      })
      
      // Refresh candidates list and wait for it to complete
      await fetchCandidates()
      
      // Reset upload state
      setBulkUploadOpen(false)
      setUploadFile(null)
      setUploadedData([])
      setUploadErrors([])
    } catch (error: any) {
      console.error('[v0] Error uploading candidates:', error)
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload candidates',
        variant: 'destructive'
      })
    } finally {
      setIsProcessingUpload(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  // Filter candidates based on search, status and all new filters
  // Helper: extract a display value from a candidate for a given column id
  const getCandidateColumnValue = (candidate: any, colId: string): string => {
    switch (colId) {
      case 'candidate': return candidate.name || ''
      case 'status': return candidate.status || ''
      case 'quality': return candidate.quality || ''
      case 'contact': return candidate.mobile_number || ''
      case 'email': return candidate.email || ''
      case 'experience': return candidate.experience_years != null ? String(candidate.experience_years) : ''
      case 'current_ctc': return candidate.current_ctc != null ? String(candidate.current_ctc) : ''
      case 'expected_ctc': return candidate.expected_ctc != null ? String(candidate.expected_ctc) : ''
      case 'location': return candidate.current_location || ''
      case 'preferred_location': return candidate.preferred_location || ''
      case 'area': return candidate.area || ''
      case 'notice_period': return candidate.notice_period || ''
      case 'industry': return candidate.industry || ''
      case 'skills': return Array.isArray(candidate.skills) ? candidate.skills.join(', ') : (candidate.skills || '')
      case 'assigned_job': {
        const ids: string[] = Array.isArray(candidate.job_ids) && candidate.job_ids.length > 0
          ? candidate.job_ids : candidate.job_id ? [candidate.job_id] : []
        return ids.map(id => orgJobs.find(j => j.id === id)?.title || '').filter(Boolean).join(', ')
      }
      case 'assigned_team': return orgRecruiters.find(r => r.id === candidate.assigned_to)?.name || ''
      case 'company_name': return candidate.company_name || candidate._derived_company || ''
      case 'date': {
        if (!candidate.created_at) return ''
        const d = new Date(candidate.created_at)
        const yyyy = d.getFullYear()
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        return `${yyyy}/${mm}/${dd}`
      }
      default: return ''
    }
  }

  // Get sorted unique values for a column (from full candidates list, before filtering)
  const getColumnUniqueValues = (colId: string): string[] => {
    const vals = new Set<string>()
    candidates.forEach(c => {
      const v = getCandidateColumnValue(c, colId)
      if (v) {
        // For skills, split by comma
        if (colId === 'skills') {
          v.split(',').map(s => s.trim()).filter(Boolean).forEach(s => vals.add(s))
        } else {
          vals.add(v)
        }
      }
    })
    return Array.from(vals).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  }

  const filteredCandidates = candidates.filter((candidate) => {
    const matchesSearch = searchTerm === '' ||
      candidate.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.mobile_number?.includes(searchTerm)

    const matchesStatus = statusFilter === 'all' ||
      candidate.status?.toLowerCase() === statusFilter.toLowerCase()

    const matchesLocation = locationFilter === 'all' ||
      candidate.current_location?.toLowerCase() === locationFilter.toLowerCase()

    const matchesPreferredLocation = preferredLocationFilter === 'all' ||
      candidate.preferred_location?.toLowerCase().includes(preferredLocationFilter.toLowerCase())

    const matchesIndustry = industryFilter === 'all' ||
      candidate.industry?.toLowerCase() === industryFilter.toLowerCase()

    const matchesRecruiter = recruiterFilter === 'all' ||
      candidate.assigned_to === recruiterFilter

    const matchesNoticePeriod = noticePeriodFilter === 'all' ||
      candidate.notice_period?.toLowerCase() === noticePeriodFilter.toLowerCase()

    const matchesJob = jobFilter === 'all' ||
      candidate.job_id === jobFilter ||
      (Array.isArray(candidate.job_ids) && candidate.job_ids.includes(jobFilter))

    // Date range filter for the 'date' column
    const matchesDateRange = (() => {
      if (!dateFilterRange.from && !dateFilterRange.to) return true
      const d = candidate.created_at ? new Date(candidate.created_at) : null
      if (!d) return false
      const dayStart = (dt: Date) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate())
      const cd = dayStart(d)
      if (dateFilterRange.from && cd < dayStart(dateFilterRange.from)) return false
      if (dateFilterRange.to && cd > dayStart(dateFilterRange.to)) return false
      return true
    })()

    // Per-column header filters (multi-select: candidate must match ANY selected value)
    const matchesColumnFilters = Object.entries(columnFilters).every(([colId, selectedVals]) => {
      if (colId === 'date') return true // handled by matchesDateRange
      if (!selectedVals || selectedVals.length === 0) return true
      const candidateVal = getCandidateColumnValue(candidate, colId)
      if (colId === 'skills') {
        const skillArr = candidateVal.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
        return selectedVals.some(sv => skillArr.includes(sv.toLowerCase()))
      }
      return selectedVals.some(sv => sv.toLowerCase() === candidateVal.toLowerCase())
    })

    return matchesSearch && matchesStatus && matchesLocation && matchesPreferredLocation &&
      matchesIndustry && matchesRecruiter && matchesNoticePeriod && matchesJob && matchesColumnFilters && matchesDateRange
  })

  // Calculate pagination
  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCandidates = filteredCandidates.slice(startIndex, endIndex)

  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
        <User className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">No candidates yet</p>
        <p className="text-sm text-muted-foreground">Add your first candidate to start tracking applications</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">All Applicants</h2>
          <p className="text-sm text-gray-500 mt-0.5">{candidates.length} total candidates</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search applicants..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
              className="pl-9 h-9 text-sm border-gray-200"
            />
          </div>

          {/* Status */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-9 text-sm border-gray-200">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="linedup">Lined Up</SelectItem>
              <SelectItem value="ringing">Ringing</SelectItem>
              <SelectItem value="callback">Callback</SelectItem>
              <SelectItem value="shortlisted">Shortlisted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="final_select">Final Select</SelectItem>
              <SelectItem value="not_interested">Not Interested</SelectItem>
              <SelectItem value="not_reachable">Not Reachable</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear all filters */}
          {(statusFilter !== 'all' || searchTerm || Object.values(columnFilters).some(v => v.length > 0) || dateFilterRange.from || dateFilterRange.to) && (
            <Button
            variant="ghost"
            size="sm"
            className="h-9 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => {
            setSearchTerm('')
            setStatusFilter('all')
            setColumnFilters({})
            setActiveHeaderFilter(null)
            setDateFilterRange({ from: null, to: null })
            setCalSelectingEnd(false)
            }}
            >
            Clear Filters
            </Button>
          )}


          
  {/* Generic export icon — hidden when Final Select filter is active */}
  {(userRole === 'super_admin' || userRole === 'hiring_manager') &&
    statusFilter !== 'final_select' && (
    <Button
      variant="outline"
      size="sm"
      onClick={exportToCSV}
      className="h-9 w-9 bg-transparent p-0"
      title={`Export (max ${EXPORT_LIMIT} records)`}
    >
      <Download className="h-4 w-4" />
    </Button>
  )}

  {/* Export All Joiners Sheet — only when Final Select filter is active */}
  {(userRole === 'super_admin' || userRole === 'hiring_manager') &&
    statusFilter === 'final_select' && (
    <Button
      size="sm"
      onClick={exportJoinersSheet}
      className="h-9 px-3 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 whitespace-nowrap"
    >
      <Download className="h-3.5 w-3.5" />
      Export All Joiners Sheet
    </Button>
  )}
          
  <Button
  variant="outline"
  size="sm"
  onClick={() => setColumnCustomizerOpen(true)}
  className="h-9 w-9 bg-transparent p-0"
  title="Customize Columns"
  >
  <Settings2 className="h-4 w-4" />
  </Button>
  
  <Button
  variant="outline"
  size="sm"
  onClick={() => setBulkUploadOpen(true)}
  className="h-9 w-9 bg-transparent p-0"
  title="Bulk Upload"
  >
  <Upload className="h-4 w-4" />
  </Button>
  </div>


      </div>

      {/* Email Client Selection Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Choose Email Client
            </DialogTitle>
            <DialogDescription>
              Select your preferred email client to send email to {selectedEmail}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <Button
              onClick={() => handleEmailClientSelect('gmail')}
              variant="outline"
              className="h-auto py-4 justify-start hover:bg-blue-50 hover:border-blue-300 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-orange-500">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm">Gmail</div>
                  <div className="text-xs text-gray-500">Open in Gmail web</div>
                </div>
              </div>
            </Button>
            
            <Button
              onClick={() => handleEmailClientSelect('outlook')}
              variant="outline"
              className="h-auto py-4 justify-start hover:bg-blue-50 hover:border-blue-300 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm">Outlook</div>
                  <div className="text-xs text-gray-500">Open in Outlook web</div>
                </div>
              </div>
            </Button>
            
            <Button
              onClick={() => handleEmailClientSelect('yahoo')}
              variant="outline"
              className="h-auto py-4 justify-start hover:bg-purple-50 hover:border-purple-300 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-purple-700">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm">Yahoo Mail</div>
                  <div className="text-xs text-gray-500">Open in Yahoo web</div>
                </div>
              </div>
            </Button>
            
            <Button
              onClick={() => handleEmailClientSelect('default')}
              variant="outline"
              className="h-auto py-4 justify-start hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-gray-600 to-gray-700">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm">Default Mail App</div>
                  <div className="text-xs text-gray-500">Open in your default email client</div>
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Table Section */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200 bg-gray-50/50">
              <TableHead className="w-12">
                <Checkbox 
                  checked={paginatedCandidates.length > 0 && selectedCandidatesIds.size === paginatedCandidates.length}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all candidates"
                />
              </TableHead>
              {visibleColumns.map((column) => {
                const isOpen = activeHeaderFilter === column.id
                const isDateCol = column.id === 'date'

                // ── Date column: calendar range picker ──
                if (isDateCol) {
                  const hasDateFilter = !!(dateFilterRange.from || dateFilterRange.to)
                  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
                  const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa']
                  const { year, month } = calViewDate
                  const firstDay = new Date(year, month, 1).getDay()
                  const daysInMonth = new Date(year, month + 1, 0).getDate()
                  const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

                  const prevMonth = () => setCalViewDate(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 })
                  const nextMonth = () => setCalViewDate(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 })

                  const handleDayClick = (day: number) => {
                    const clicked = new Date(year, month, day)
                    if (!calSelectingEnd) {
                      setDateFilterRange({ from: clicked, to: null })
                      setCalSelectingEnd(true)
                    } else {
                      const from = dateFilterRange.from!
                      if (clicked < from) {
                        setDateFilterRange({ from: clicked, to: from })
                      } else {
                        setDateFilterRange(prev => ({ ...prev, to: clicked }))
                      }
                      setCalSelectingEnd(false)
                      setCurrentPage(1)
                    }
                  }

                  const isInRange = (day: number) => {
                    const d = dayStart(new Date(year, month, day))
                    const from = dateFilterRange.from ? dayStart(dateFilterRange.from) : null
                    const to = dateFilterRange.to ? dayStart(dateFilterRange.to) : null
                    if (from && to) return d >= from && d <= to
                    if (from) return d.getTime() === from.getTime()
                    return false
                  }
                  const isRangeStart = (day: number) => {
                    if (!dateFilterRange.from) return false
                    const d = dayStart(new Date(year, month, day))
                    return d.getTime() === dayStart(dateFilterRange.from).getTime()
                  }
                  const isRangeEnd = (day: number) => {
                    if (!dateFilterRange.to) return false
                    const d = dayStart(new Date(year, month, day))
                    return d.getTime() === dayStart(dateFilterRange.to).getTime()
                  }
                  const isToday = (day: number) => {
                    const now = new Date()
                    return day === now.getDate() && month === now.getMonth() && year === now.getFullYear()
                  }

                  const formatLabel = (d: Date) => {
                    const yyyy = d.getFullYear()
                    const mm = String(d.getMonth() + 1).padStart(2, '0')
                    const dd = String(d.getDate()).padStart(2, '0')
                    return `${yyyy}/${mm}/${dd}`
                  }

                  return (
                    <TableHead key={column.id} className="p-0 whitespace-nowrap">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setActiveHeaderFilter(isOpen ? null : column.id)}
                          className={cn(
                            'flex items-center gap-1 w-full px-3 py-2.5 text-left text-[13px] font-semibold transition-colors whitespace-nowrap select-none group',
                            hasDateFilter ? 'text-[#4F46E5]' : 'text-gray-700 hover:text-[#4F46E5]'
                          )}
                        >
                          <span>
                            {hasDateFilter
                              ? dateFilterRange.from && dateFilterRange.to
                                ? `${formatLabel(dateFilterRange.from)} – ${formatLabel(dateFilterRange.to)}`
                                : dateFilterRange.from
                                ? `From ${formatLabel(dateFilterRange.from)}`
                                : column.label
                              : column.label}
                          </span>
                          {hasDateFilter && (
                            <span className="inline-flex items-center justify-center h-4 w-4 rounded bg-[#4F46E5] text-white text-[10px] font-bold leading-none">1</span>
                          )}
                          <ChevronDown className={cn(
                            'h-3 w-3 flex-shrink-0 transition-transform duration-150',
                            isOpen ? 'rotate-180 text-[#4F46E5]' : 'text-gray-400 group-hover:text-[#4F46E5]'
                          )} />
                        </button>

                        {isOpen && (
                          <div className="absolute top-full left-0 z-[200] bg-white border border-gray-200 rounded-xl shadow-2xl mt-0.5 p-3 w-[268px]">
                            {/* Header: month nav */}
                            <div className="flex items-center justify-between mb-2.5">
                              <button type="button" onClick={prevMonth} className="p-1 rounded hover:bg-gray-100 text-gray-500">
                                <ChevronLeft className="h-4 w-4" />
                              </button>
                              <span className="text-[13px] font-semibold text-gray-800">{MONTHS[month]} {year}</span>
                              <button type="button" onClick={nextMonth} className="p-1 rounded hover:bg-gray-100 text-gray-500">
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            </div>

                            {/* Day-of-week headers */}
                            <div className="grid grid-cols-7 mb-1">
                              {DAYS.map(d => (
                                <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
                              ))}
                            </div>

                            {/* Day grid */}
                            <div className="grid grid-cols-7">
                              {/* Empty cells for offset */}
                              {Array.from({ length: firstDay }).map((_, i) => (
                                <div key={`e${i}`} />
                              ))}
                              {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1
                                const inRange = isInRange(day)
                                const start = isRangeStart(day)
                                const end = isRangeEnd(day)
                                const today = isToday(day)
                                return (
                                  <button
                                    key={day}
                                    type="button"
                                    onClick={() => handleDayClick(day)}
                                    className={cn(
                                      'relative h-8 w-full text-[12px] font-medium transition-colors',
                                      inRange && !start && !end ? 'bg-indigo-50 text-[#4F46E5]' : '',
                                      start || end ? 'bg-[#4F46E5] text-white rounded-full z-10' : 'hover:bg-gray-100 rounded-full',
                                      today && !start && !end ? 'ring-1 ring-[#4F46E5] rounded-full' : '',
                                      !inRange && !start && !end ? 'text-gray-700' : ''
                                    )}
                                  >
                                    {day}
                                  </button>
                                )
                              })}
                            </div>

                            {/* Range prompt / clear */}
                            <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                              <span className="text-[11px] text-gray-500">
                                {!dateFilterRange.from
                                  ? 'Click to select start date'
                                  : calSelectingEnd
                                  ? 'Now select end date'
                                  : dateFilterRange.to
                                  ? `${formatLabel(dateFilterRange.from)} – ${formatLabel(dateFilterRange.to)}`
                                  : formatLabel(dateFilterRange.from)}
                              </span>
                              {hasDateFilter && (
                                <button
                                  type="button"
                                  className="text-[11px] text-[#4F46E5] font-medium hover:underline"
                                  onClick={() => { setDateFilterRange({ from: null, to: null }); setCalSelectingEnd(false); setCurrentPage(1) }}
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </TableHead>
                  )
                }

                // ── All other columns: checkbox dropdown ──
                const selectedVals: string[] = columnFilters[column.id] || []
                const hasFilter = selectedVals.length > 0
                const search = headerSearchTerm[column.id] || ''
                const allVals = getColumnUniqueValues(column.id)
                const filteredVals = search
                  ? allVals.filter(v => v.toLowerCase().includes(search.toLowerCase()))
                  : allVals

                const toggleVal = (val: string) => {
                  setColumnFilters(prev => {
                    const cur = prev[column.id] || []
                    const next = cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val]
                    if (next.length === 0) { const n = { ...prev }; delete n[column.id]; return n }
                    return { ...prev, [column.id]: next }
                  })
                  setCurrentPage(1)
                }

                return (
                  <TableHead key={column.id} className="p-0 whitespace-nowrap">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveHeaderFilter(isOpen ? null : column.id)
                          if (!isOpen) setHeaderSearchTerm(prev => ({ ...prev, [column.id]: '' }))
                        }}
                        className={cn(
                          'flex items-center gap-1 w-full px-3 py-2.5 text-left text-[13px] font-semibold transition-colors whitespace-nowrap select-none group',
                          hasFilter ? 'text-[#4F46E5]' : 'text-gray-700 hover:text-[#4F46E5]'
                        )}
                      >
                        <span>{column.label}</span>
                        {hasFilter && (
                          <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded bg-[#4F46E5] text-white text-[10px] font-bold leading-none">
                            {selectedVals.length}
                          </span>
                        )}
                        <ChevronDown className={cn(
                          'h-3 w-3 flex-shrink-0 transition-transform duration-150',
                          isOpen ? 'rotate-180 text-[#4F46E5]' : 'text-gray-400 group-hover:text-[#4F46E5]'
                        )} />
                      </button>

                      {isOpen && (
                        <div className="absolute top-full left-0 z-[200] bg-white border border-gray-200 rounded-lg shadow-2xl w-56 mt-0.5 overflow-hidden">
                          <div className="p-2 border-b border-gray-100">
                            <input
                              autoFocus
                              className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded outline-none focus:border-[#4F46E5] placeholder-gray-400 bg-gray-50"
                              placeholder={`Search ${column.label}...`}
                              value={search}
                              onChange={e => setHeaderSearchTerm(prev => ({ ...prev, [column.id]: e.target.value }))}
                              onKeyDown={e => { e.stopPropagation(); if (e.key === 'Escape') setActiveHeaderFilter(null) }}
                            />
                          </div>
                          {hasFilter && (
                            <div className="px-3 py-1.5 border-b border-gray-100 flex items-center justify-between bg-indigo-50/60">
                              <span className="text-[11px] text-[#4F46E5] font-medium">{selectedVals.length} selected</span>
                              <button
                                type="button"
                                className="text-[11px] text-[#4F46E5] hover:underline font-medium"
                                onClick={() => { setColumnFilters(prev => { const n = { ...prev }; delete n[column.id]; return n }); setCurrentPage(1) }}
                              >
                                Clear
                              </button>
                            </div>
                          )}
                          <div className="max-h-60 overflow-y-auto">
                            {filteredVals.length === 0 ? (
                              <div className="px-3 py-4 text-xs text-gray-400 text-center">No values found</div>
                            ) : (
                              filteredVals.map(val => {
                                const checked = selectedVals.includes(val)
                                return (
                                  <label
                                    key={val}
                                    className={cn(
                                      'flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer hover:bg-gray-50 transition-colors',
                                      checked ? 'bg-indigo-50/70 text-[#4F46E5] font-medium' : 'text-gray-700'
                                    )}
                                    onClick={() => toggleVal(val)}
                                  >
                                    <span className={cn(
                                      'flex-shrink-0 w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors',
                                      checked ? 'bg-[#4F46E5] border-[#4F46E5]' : 'border-gray-300 bg-white'
                                    )}>
                                      {checked && <Check className="h-2.5 w-2.5 text-white stroke-[3]" />}
                                    </span>
                                    <span className="truncate">{val}</span>
                                  </label>
                                )
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </TableHead>
                )
              })}
              <TableHead className="w-12"></TableHead>
            </TableRow>

            {/* Click-away overlay to close header filter */}
            {activeHeaderFilter && (
              <tr>
                <td colSpan={visibleColumns.length + 2} className="p-0 border-0">
                  <div className="fixed inset-0 z-[99]" onClick={() => setActiveHeaderFilter(null)} />
                </td>
              </tr>
            )}
          </TableHeader>
          <TableBody>
            {paginatedCandidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  {filteredCandidates.length === 0 ? 'No candidates found matching your filters' : 'No candidates on this page'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedCandidates.map((candidate, index) => (
                <TableRow 
                  key={candidate.id} 
                  className="border-b border-gray-100 hover:bg-purple-50/50 transition-colors group"
                >
                  <TableCell>
                    <Checkbox 
                      checked={selectedCandidatesIds.has(candidate.id)}
                      onCheckedChange={() => toggleCandidateSelection(candidate.id)}
                      aria-label={`Select ${candidate.name}`}
                    />
                  </TableCell>
                  {visibleColumns.map((column) => (
                    <TableCell key={column.id}>
                      {renderCellContent(column.id, candidate)}
                    </TableCell>
                  ))}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                          <MoreVertical className="h-4 w-4 text-gray-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => openProfileDrawer(candidate.id)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
  {hasModuleAccess('Add Candidate') && (
  <DropdownMenuItem onClick={() => {
  console.log('[v0] CandidatesList: Navigating to edit with ID:', candidate.id)
  router.push(`/admin/candidates-new?edit=${candidate.id}`)
  }}>
  <Edit className="h-4 w-4 mr-2" />
  Edit Candidate
  </DropdownMenuItem>
  )}
                        <DropdownMenuItem onClick={() => handleSendEmail(candidate.email)}>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        {candidate.cv_url && (
                          <DropdownMenuItem onClick={() => window.open(candidate.cv_url!, '_blank')}>
                            <FileText className="h-4 w-4 mr-2" />
                            View CV
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {filteredCandidates.length > 0 && (
        <div className="flex items-center justify-between px-2 py-3 border-t">

          {/* Rows per page dropdown */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="whitespace-nowrap">Rows per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white"
            >
              {[25, 50, 100, 200, 350, 500].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span className="whitespace-nowrap text-gray-400">
              {startIndex + 1}–{Math.min(endIndex, filteredCandidates.length)} of {filteredCandidates.length}
            </span>
          </div>

          {/* Page navigation */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Previous
              </button>

              {/* First page */}
              {currentPage > 3 && (
                <>
                  <button onClick={() => setCurrentPage(1)} className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 text-sm">1</button>
                  {currentPage > 4 && <span className="px-1 text-gray-400">...</span>}
                </>
              )}

              {/* Pages around current */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) pageNum = i + 1
                else if (currentPage <= 3) pageNum = i + 1
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
                else pageNum = currentPage - 2 + i
                if (pageNum < 1 || pageNum > totalPages) return null
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded border text-sm ${
                      currentPage === pageNum
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}

              {/* Last page */}
              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && <span className="px-1 text-gray-400">...</span>}
                  <button onClick={() => setCurrentPage(totalPages)} className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 text-sm">{totalPages}</button>
                </>
              )}

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

  {/* Column Customizer Drawer */}
  <ColumnCustomizer
  open={columnCustomizerOpen}
  onOpenChange={setColumnCustomizerOpen}
  columns={columns}
  onColumnsChange={setColumns}
  />
  
  {/* Bulk Upload Dialog */}
  <Dialog open={bulkUploadOpen} onOpenChange={setBulkUploadOpen}>
  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
  <DialogHeader>
  <DialogTitle>Bulk Upload Candidates</DialogTitle>
  <DialogDescription>
  Upload an Excel (.xlsx, .xls) or CSV file with candidate information. Required fields: Name, Email, Mobile Number
  </DialogDescription>
  </DialogHeader>
  
  <div className="space-y-4 mt-4">
  {/* File Upload */}
  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
  <input
  type="file"
  accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
  onChange={handleFileUpload}
  className="hidden"
  id="csv-upload"
  />
  <label
  htmlFor="csv-upload"
  className="cursor-pointer flex flex-col items-center gap-2"
  >
  <Upload className="h-10 w-10 text-gray-400" />
  <div>
  <p className="text-sm font-medium text-gray-700">
  {uploadFile ? uploadFile.name : 'Click to upload Excel or CSV file'}
  </p>
  <p className="text-xs text-gray-500 mt-1">
  Supports .xlsx, .xls and .csv — Headers: Name, Email, Mobile Number, Skills, Experience, etc.
  </p>
  </div>
  </label>
  </div>
  
          {/* Download Sample Template */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-1">Need a template?</p>
                <p className="text-xs text-blue-700">Download our sample CSV template with example data to get started quickly.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadSampleTemplate}
                className="flex items-center gap-2 bg-white hover:bg-blue-50 border-blue-300"
              >
                <Download className="h-4 w-4" />
                Download Template
              </Button>
            </div>
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-xs text-blue-700 font-medium mb-1">Required fields:</p>
              <p className="text-xs text-blue-600">Name, Email, Mobile Number</p>
            </div>
          </div>
  
  {/* Errors */}
  {uploadErrors.length > 0 && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
  <div className="flex items-start gap-2">
  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
  <div className="flex-1">
  <p className="text-sm font-medium text-red-800 mb-1">Errors found:</p>
  <ul className="text-xs text-red-700 space-y-1">
  {uploadErrors.map((error, index) => (
  <li key={index}>• {error}</li>
  ))}
  </ul>
  </div>
  </div>
  </div>
  )}
  
  {/* Preview Data */}
  {uploadedData.length > 0 && (
  <div>
  <div className="flex items-center gap-2 mb-2">
  <CheckCircle className="h-5 w-5 text-green-600" />
  <p className="text-sm font-medium text-gray-700">
  {uploadedData.length} candidates ready to upload
  </p>
  </div>
  
  <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
  <Table>
  <TableHeader>
  <TableRow>
  <TableHead>Name</TableHead>
  <TableHead>Email</TableHead>
  <TableHead>Mobile</TableHead>
  <TableHead>Location</TableHead>
  <TableHead>Skills</TableHead>
  <TableHead>Experience</TableHead>
  <TableHead>Status</TableHead>
  </TableRow>
  </TableHeader>
  <TableBody>
  {uploadedData.map((candidate, index) => (
  <TableRow key={index}>
  <TableCell className="font-medium">{candidate.name}</TableCell>
  <TableCell className="text-xs">{candidate.email}</TableCell>
  <TableCell className="text-xs">{candidate.mobile_number}</TableCell>
  <TableCell className="text-xs">{candidate.current_location || '-'}</TableCell>
  <TableCell className="text-xs">
  {Array.isArray(candidate.skills) 
  ? candidate.skills.slice(0, 2).join(', ') + (candidate.skills.length > 2 ? '...' : '')
  : '-'}
  </TableCell>
  <TableCell className="text-xs">{candidate.experience_years || '-'}</TableCell>
  <TableCell>
  <Badge className="text-xs">{candidate.status}</Badge>
  </TableCell>
  </TableRow>
  ))}
  </TableBody>
  </Table>
  </div>
  </div>
  )}
  
  {/* Action Buttons */}
  <div className="flex justify-end gap-2 pt-4">
  <Button
  variant="outline"
  onClick={() => {
  setBulkUploadOpen(false)
  setUploadFile(null)
  setUploadedData([])
  setUploadErrors([])
  }}
  disabled={isProcessingUpload}
  >
  Cancel
  </Button>
  <Button
  onClick={handleSaveBulkUpload}
  disabled={uploadedData.length === 0 || isProcessingUpload}
  >
  {isProcessingUpload ? (
  <>
  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
  Uploading...
  </>
  ) : (
  <>
  <Upload className="h-4 w-4 mr-2" />
  Upload {uploadedData.length} Candidates
  </>
  )}
  </Button>
  </div>
  </div>
  </DialogContent>
  </Dialog>
  
  {/* Profile Drawer */}
  <Sheet open={profileDrawerOpen} onOpenChange={setProfileDrawerOpen}>
    <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
      {loadingProfile ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
            <p className="mt-3 text-sm text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      ) : selectedCandidate ? (
        <div className="space-y-6">
          {/* Clean Header Section */}
          <div className="pb-4 border-b">
            <div className="flex items-start gap-4">
              {/* Avatar with Initials */}
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-white">
                  {selectedCandidate.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'CN'}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                {/* Name */}
                <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedCandidate.name}</h2>
                
                {/* Status Badge - Right below name */}
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={cn(
                    "text-xs px-2.5 py-1 font-medium",
                    selectedCandidate.status === 'shortlisted' && 'bg-green-100 text-green-700 border-green-200',
                    selectedCandidate.status === 'rejected' && 'bg-red-100 text-red-700 border-red-200',
                    selectedCandidate.status === 'ringing' && 'bg-yellow-100 text-yellow-700 border-yellow-200',
                    selectedCandidate.status === 'callback' && 'bg-orange-100 text-orange-700 border-orange-200',
                    selectedCandidate.status === 'linedup' && 'bg-blue-100 text-blue-700 border-blue-200',
                    selectedCandidate.status === 'not_reachable' && 'bg-gray-100 text-gray-700 border-gray-200',
                    selectedCandidate.status === 'not_interested' && 'bg-slate-100 text-slate-700 border-slate-200',
                    selectedCandidate.status === 'final_select' && 'bg-emerald-100 text-emerald-700 border-emerald-200',
                    !selectedCandidate.status && 'bg-gray-100 text-gray-700 border-gray-200'
                  )}>
                    {selectedCandidate.status ? selectedCandidate.status.replace(/_/g, ' ').charAt(0).toUpperCase() + selectedCandidate.status.replace(/_/g, ' ').slice(1) : 'No Status'}
                  </Badge>
                </div>
                
                {/* Additional Info */}
                <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                  {selectedCandidate.industry && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {selectedCandidate.industry}
                    </span>
                  )}
                  {selectedCandidate.years_of_experience !== null && selectedCandidate.years_of_experience !== undefined && selectedCandidate.years_of_experience > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {selectedCandidate.years_of_experience} years
                    </span>
                  )}
                  {selectedCandidate.current_location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {selectedCandidate.current_location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Contact Information */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-50/50 to-white">
              <CardTitle className="text-sm flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <a href={`mailto:${selectedCandidate.email}`} className="text-sm font-medium text-blue-600 hover:underline">
                    {selectedCandidate.email}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <a href={`tel:${selectedCandidate.mobile_number}`} className="text-sm font-medium">
                    {selectedCandidate.mobile_number || 'Not provided'}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Current Location</p>
                  <p className="text-sm font-medium">{selectedCandidate.current_location || 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Target className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Preferred Location</p>
                  <p className="text-sm font-medium">{selectedCandidate.preferred_location || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Professional Details */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-50/50 to-white">
              <CardTitle className="text-sm flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Professional Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Industry</p>
                  <p className="text-sm font-medium">{selectedCandidate.industry || 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Experience</p>
                  <p className="text-sm font-medium">{selectedCandidate.experience_years ? `${selectedCandidate.experience_years} years` : 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Award className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Skills</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedCandidate.skills ? (
                      typeof selectedCandidate.skills === 'string' ? (
                        selectedCandidate.skills.split(';').map((skill: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {skill.trim()}
                          </Badge>
                        ))
                      ) : (
                        selectedCandidate.skills.map((skill: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))
                      )
                    ) : (
                      <span className="text-sm">No skills listed</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Compensation */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-50/50 to-white">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Compensation & Notice
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-start gap-3">
                <IndianRupee className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Current CTC</p>
                  <p className="text-sm font-medium">{selectedCandidate.current_ctc ? `₹${parseFloat(selectedCandidate.current_ctc).toLocaleString('en-IN')} LPA` : 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <IndianRupee className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Expected CTC</p>
                  <p className="text-sm font-medium">{selectedCandidate.expected_ctc ? `₹${parseFloat(selectedCandidate.expected_ctc).toLocaleString('en-IN')} LPA` : 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Notice Period</p>
                  <p className="text-sm font-medium">{selectedCandidate.notice_period || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Resume/CV */}
          {selectedCandidate.cv_url && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-blue-50/50 to-white">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Resume/CV
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <Button
                  variant="outline"
                  className="w-full gap-2 text-sm"
                  onClick={() => window.open(selectedCandidate.cv_url, '_blank')}
                >
                  <FileText className="h-4 w-4" />
                  View Full Resume
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full gap-2 text-sm"
                  onClick={async () => {
                    try {
                      const response = await fetch(selectedCandidate.cv_url)
                      const blob = await response.blob()
                      const urlParts = selectedCandidate.cv_url.split('.')
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
                      
                      toast({
                        title: 'Success',
                        description: `CV downloaded as ${filename}`
                      })
                    } catch (error) {
                      toast({
                        title: 'Download Failed',
                        description: 'Failed to download CV. Please try again.',
                        variant: 'destructive'
                      })
                    }
                  }}
                >
                  <Download className="h-4 w-4" />
                  Download CV
                </Button>
              </CardContent>
            </Card>
          )}
          
          {/* Feedback */}
          {selectedCandidate.feedback && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-blue-50/50 to-white">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  Notes / Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedCandidate.feedback}</p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">No candidate selected</p>
        </div>
      )}
    </SheetContent>
  </Sheet>
  </div>
  )
  }
