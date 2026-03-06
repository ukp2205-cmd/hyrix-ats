'use client'

import { Badge } from "@/components/ui/badge"
import React from "react"
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Upload, Loader2, Sparkles, Search, Check, Building2, UserCog, FileText, Eye, Plus, X, Lock, ArrowLeft } from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'
import { useAuth } from '@/lib/auth-context'
// CV upload now uses /api/upload-cv route handler
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { parseResume } from '@/app/actions/parse-resume'
import { calculateCandidateScore } from '@/app/actions/calculate-score'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { COUNTRY_CODES } from '@/lib/country-codes'
import { LocationAutocomplete } from '@/components/location-autocomplete'

// pgFetch — hits /api/db (Postgres/AWS) instead of Supabase
async function pgFetch(op: string, table: string, opts: Record<string, any> = {}) {
  const res = await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ op, table, ...opts }),
  })
  const json = await res.json()
  return { data: json.data ?? null, error: json.error ?? null }
}

interface AddCandidateFormProps {
  userRole: 'admin' | 'super_admin' | 'recruiter'
  redirectPath: string
  onSuccess?: (candidateName: string) => void
}

// Utility function to convert name to title case (proper case)
const toTitleCase = (str: string | null | undefined): string => {
  if (!str) return ''
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function AddCandidateForm({ userRole, redirectPath, onSuccess }: AddCandidateFormProps) {
  const router = useRouter()
  // Read edit param directly from window.location to avoid Suspense issues with useSearchParams
  const getEditId = () => {
    if (typeof window === 'undefined') return null
    return new URLSearchParams(window.location.search).get('edit')
  }
  const { hasModuleAccess, loading: permissionsLoading, userRole: authRole } = usePermissions()
  const { loading: authLoading, organizationId: authOrgId, userId: authUserId } = useAuth()
  
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [existingCvUrl, setExistingCvUrl] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editCandidateId, setEditCandidateId] = useState<string | null>(null)
  const loadedCandidateRef = useRef<string | null>(null)
  const isSubmittingRef = useRef(false)
  
  const [formData, setFormData] = useState({
    name: '',
    mobile_number: '',
    alternate_mobile: '',
    email: '',
    dob: '',
    gender: '',
    current_location: '',
    preferred_location: '',
    area: '',
    skills: '',
    industry: '',
    designation: '',
  experience_years: '',
  current_ctc: '',
  expected_ctc: '',
  notice_period: 'Immediate Joiner',
  buyout_available: 'NA',
  source: 'Direct',
  feedback: '',
  status: 'linedup',
    job_id: [] as string[], // Changed to array for multiple job selection
    quality: '',
  })

  const [jobs, setJobs] = useState<any[]>([])
  const [jobSearch, setJobSearch] = useState('')
  const [showJobDropdown, setShowJobDropdown] = useState(false)
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string; role: string }>>([])
  const [filteredJobs, setFilteredJobs] = useState<any[]>([])
  
  // Industries from industries table
  const [industries, setIndustries] = useState<Array<{id: string, name: string}>>([])
  const [industryInput, setIndustryInput] = useState('')
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false)

  // Designation — free-text with autosuggest from DB, Add+ to save new
  const [designationInput, setDesignationInput] = useState('')
  const [showDesignationDropdown, setShowDesignationDropdown] = useState(false)
  const [designationsDB, setDesignationsDB] = useState<string[]>([])
  const [addingDesignation, setAddingDesignation] = useState(false)
  
  // Organization email for validation
  const [orgEmail, setOrganizationEmail] = useState<string>('')
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('')

  // Resolved org + team member IDs (set once on mount, used in handleSubmit)
  const [currentOrgId, setCurrentOrgId] = useState<string>('')
  const [currentTeamMemberId, setCurrentTeamMemberId] = useState<string>('')
  
  // Custom fields visibility
  const [showQualityField, setShowQualityField] = useState(false)
  
  // Skills from skills table
  const [skillsArray, setSkillsArray] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [skillsDatabase, setSkillsDatabase] = useState<Array<{id: number, skill_name: string, category: string}>>([])
  const [showSkillsDropdown, setShowSkillsDropdown] = useState(false)
  
  // Cities from cities table
  const [cities, setCities] = useState<Array<{id: string, name: string}>>([])
  const [locationInput, setLocationInput] = useState('')
  const [preferredLocationInput, setPreferredLocationInput] = useState('')
  const [preferredLocations, setPreferredLocations] = useState<string[]>([])
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [showPreferredLocationDropdown, setShowPreferredLocationDropdown] = useState(false)
  
  // Track if location has been auto-filled to prevent overwriting user edits
  const locationAutoFilledRef = useRef(false)
  
  // Validation states
  const [emailError, setEmailError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<string[]>([])
  const [countryCode, setCountryCode] = useState('+91')
  const [countryCodeSearch, setCountryCodeSearch] = useState('IN +91')
  const [showCountryCodePopover, setShowCountryCodePopover] = useState(false)
  const [isValidCurrentLocation, setIsValidCurrentLocation] = useState(false)
  const [isValidPreferredLocation, setIsValidPreferredLocation] = useState(false)

  // Ensure required DB tables and candidates schema are ready in Lightsail Postgres
  useEffect(() => {
    fetch('/api/migrate-tables').catch(() => {})
    fetch('/api/migrate-candidates').catch(() => {})
  }, [])

  // Fetch organization email, custom fields, and industries on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userStr = localStorage.getItem('hyrix_user')
        if (!userStr) return
        const user = JSON.parse(userStr)
        setCurrentUserEmail(user.email || '')

        // ── Org ID + team member ID ─────────────────────────────────────────
        // authOrgId comes from AuthContext (populated from localStorage on mount).
        // Use it directly — fall back to parsing localStorage if auth is still loading.
        const organizationId: string =
          authOrgId || user.organizationId || user.organization_id || user.id || ''

        if (organizationId) setCurrentOrgId(organizationId)
        if (user.id)        setCurrentTeamMemberId(user.id)

        // Load org custom fields (quality_field toggle)
        if (organizationId) {
          const { data: orgRows } = await pgFetch('select', 'organization', {
            select: 'email, custom_fields',
            filters: [{ column: 'id', op: '=', value: organizationId }],
          })
          const orgData = Array.isArray(orgRows) ? orgRows[0] : orgRows
          if (orgData) {
            setOrganizationEmail(orgData.email)
            if (orgData.custom_fields?.quality_field) setShowQualityField(true)
          }
        }

        // Fetch industries
        const { data: industriesData } = await pgFetch('select', 'industries', {
          select: 'id, name',
          orders: [{ column: 'name', ascending: true }],
        })
        if (industriesData) setIndustries(industriesData)

        // Fetch cities
        const { data: citiesData } = await pgFetch('select', 'cities', {
          select: 'id, name',
          orders: [{ column: 'name', ascending: true }],
        })
        if (citiesData) setCities(citiesData)

      } catch (error) {
        console.error('[v0] Error in fetchData:', error)
      }
    }

    fetchData().catch(err => console.error('[v0] fetchData promise rejected:', err))
  }, [userRole])
  
  // Fetch designations — wrapped in try/catch so a missing table never crashes the form
  useEffect(() => {
    const fetchDesignations = async () => {
      try {
        // Ensure the designations table exists first
        await fetch('/api/migrate-tables').catch(() => {})

        const [res1, res2] = await Promise.all([
          pgFetch('select', 'designations', { select: 'name', orders: [{ column: 'name', ascending: true }] }),
          pgFetch('select', 'candidates', { select: 'designation', filters: [{ column: 'designation', op: 'not.is', value: null }] }),
        ])

        const masterNames: string[] = Array.isArray(res1.data) ? res1.data.map((d: any) => d.name).filter(Boolean) : []
        const candidateNames: string[] = Array.isArray(res2.data) ? res2.data.map((c: any) => c.designation?.trim()).filter(Boolean) : []

        const seen = new Set<string>()
        const merged: string[] = []
        ;[...masterNames, ...candidateNames].forEach(name => {
          const key = name.toLowerCase()
          if (!seen.has(key)) { seen.add(key); merged.push(name) }
        })
        merged.sort((a, b) => a.localeCompare(b))
        if (merged.length > 0) setDesignationsDB(merged)
      } catch (err) {
        // Non-fatal — form works fine without designation suggestions
        console.warn('[add-candidate] designations fetch skipped:', err)
      }
    }
    fetchDesignations()
  }, [])

  // Fetch skills from skills table
  useEffect(() => {
    const fetchSkills = async () => {
      try {
      const { data: skillsData, error } = await pgFetch('select', 'skills', {
        select: 'id, skill_name, category',
        orders: [{ column: 'skill_name', ascending: true }],
      })
      if (error) {
        console.warn('[add-candidate] skills fetch skipped')
      } else if (skillsData) {
        setSkillsDatabase(skillsData)
      }
      } catch (err) { console.warn('[add-candidate] skills fetch skipped:', err) }
    }
    fetchSkills()
  }, [])
  
  // Close industry dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-dropdown-container]')) {
        setShowIndustryDropdown(false)
        setShowDesignationDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])


  
  // Fetch last candidate's location for new candidates (auto-fill location field)
  useEffect(() => {
    const fetchLastCandidateLocation = async () => {
      // Only fetch once and only for new candidates (not in edit mode)
const editIdFromUrl = getEditId()

      if (editIdFromUrl || locationAutoFilledRef.current) return
      
      // Also check if user has already entered a location
      if (formData.current_location) return
      
      try {
        const { data: rows } = await pgFetch('select', 'candidates', {
          select: 'current_location',
          orders: [{ column: 'created_at', ascending: false }],
          limit: 1,
        })
        const data = Array.isArray(rows) ? rows[0] : null
        if (data && data.current_location) {
          setFormData(prev => ({
            ...prev,
            current_location: data.current_location
          }))
          setLocationInput(data.current_location)
          locationAutoFilledRef.current = true
          console.log('[v0] AddCandidateForm: Auto-filled location from last entry:', data.current_location)
        }
      } catch (error) {
        console.error('[v0] AddCandidateForm: Error fetching last location:', error)
      }
    }
    
    fetchLastCandidateLocation()
  }, [])
  
  // Check for edit mode - runs when component mounts and when searchParams change
  useEffect(() => {
    const editIdFromUrl = getEditId()
    


    const isFormDataEmpty = !formData.name && !formData.email
    const shouldFetch = editIdFromUrl && (loadedCandidateRef.current !== editIdFromUrl || isFormDataEmpty)
    
    if (shouldFetch) {
      // Mark this candidate as being loaded
      loadedCandidateRef.current = editIdFromUrl
      console.log('[v0] AddCandidateForm: NEW EDIT MODE DETECTED - Loading candidate data')
      setIsEditMode(true)
      setEditCandidateId(editIdFromUrl)
      
      // Fetch candidate data
      const fetchCandidate = async () => {
        try {
          const { data: rows, error } = await pgFetch('select', 'candidates', {
            filters: [{ column: 'id', op: '=', value: editIdFromUrl }],
          })
          const data = Array.isArray(rows) ? rows[0] : null

          if (error || !data) {
            console.error('[v0] AddCandidateForm: Error fetching candidate:', error)
            toast({
              title: 'Error',
              description: `Failed to load candidate: ${error?.message || 'Not found'}`,
              variant: 'destructive',
            })
            return
          }
          
          if (data) {
            console.log('[v0] AddCandidateForm: Candidate data loaded for edit:', data.id)
            
            // Store existing CV URL if present
            if (data.cv_url) {
              console.log('[v0] AddCandidateForm: Setting existing CV URL:', data.cv_url)
              setExistingCvUrl(data.cv_url)
            }
            
          // Normalize notice period value to match Select options
          let normalizedNoticePeriod = data.notice_period || ''
          if (normalizedNoticePeriod === 'Immediate') {
            normalizedNoticePeriod = 'Immediate Joiner'
          }
          
          const newFormData = {
            name: data.name || '',
            mobile_number: data.mobile_number || '',
            alternate_mobile: data.alternate_mobile || '',
            email: data.email || '',
            dob: data.dob || '',
            gender: data.gender || '',
          current_location: data.current_location || '',
          preferred_location: data.preferred_location || '',
          area: data.area || '',
          skills: data.skills || '',
            industry: data.industry || '',
            designation: data.designation || '',
            experience_years: data.experience || data.years_of_experience?.toString() || '',
            current_ctc: data.current_ctc?.toString() || '',
            expected_ctc: data.expected_ctc?.toString() || '',
          notice_period: normalizedNoticePeriod,
          buyout_available: data.buyout_available || '',
          source: data.source || '',
          feedback: data.feedback || '',
          status: data.status || 'linedup',
          job_id: data.job_id ? (Array.isArray(data.job_id) ? data.job_id : [data.job_id]) : [],
          quality: data.quality || '',
        }
          
          // Show quality field if it has a value
          if (data.quality) {
            setShowQualityField(true)
          }
            
          setFormData(newFormData)
          
          // Initialize preferred locations array from comma-separated string
          if (data.preferred_location) {
            const locations = data.preferred_location.split(',').map((loc: string) => loc.trim()).filter(Boolean)
            setPreferredLocations(locations)
          }

          if (data.current_location) {
            setLocationInput(data.current_location)
            // Mark location as valid since it was previously saved from the database
            setIsValidCurrentLocation(true)
          }

          if (data.industry) {
            setIndustryInput(data.industry)
          }
          if (data.designation) {
            setDesignationInput(data.designation)
          }

          if (data.skills) {
            const skillsFromData = data.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
            setSkillsArray(skillsFromData)
          }
          } else {
            console.log('[v0] AddCandidateForm: No candidate data found for ID:', editIdFromUrl)
          }
        } catch (err) {
          console.error('[v0] AddCandidateForm: Exception while fetching candidate:', err)
        }
      }
      
      fetchCandidate()
    } else if (!editIdFromUrl) {
      console.log('[v0] AddCandidateForm: No edit ID in URL - showing new candidate form')
      // Reset edit mode if there's no edit ID
      if (isEditMode) {
        setIsEditMode(false)
        setEditCandidateId(null)
        loadedCandidateRef.current = null
      }
    } else {
      console.log('[v0] AddCandidateForm: Candidate already loaded - skipping fetch')
    }
    

  }, [toast])

  useEffect(() => {
    const fetchData = async () => {
      setLoadingJobs(true)
      try {
        const userStr = localStorage.getItem('hyrix_user')
        if (!userStr) return
        const user = JSON.parse(userStr)

        // Use authOrgId from AuthContext as primary source
        const organizationId: string =
          authOrgId || user.organizationId || user.organization_id || user.id || ''

        // Fetch active jobs for this org
        const filters: any[] = [{ column: 'status', op: '=', value: 'active' }]
        if (organizationId) filters.push({ column: 'organization_id', op: '=', value: organizationId })

        const { data: jobsData } = await pgFetch('select', 'jobs', {
          select: 'id, job_id, title, client_name, location, status, organization_id, assigned_recruiter, created_by',
          filters,
          orders: [{ column: 'created_at', ascending: false }],
        })

        let filteredJobsData = jobsData || []

        if (userRole === 'hiring_manager') {
          filteredJobsData = filteredJobsData.filter((j: any) => j.created_by === user.email)
        } else if (userRole === 'recruiter') {
          // Get recruiter name for comparison
          const { data: recRows } = await pgFetch('select', 'org_team', {
            select: 'name',
            filters: [{ column: 'email', op: '=', value: user.email }],
          })
          const recruiterName = (Array.isArray(recRows) ? recRows[0] : recRows)?.name || ''
          filteredJobsData = filteredJobsData.filter((j: any) =>
            j.assigned_recruiter === recruiterName || j.assigned_recruiter === user.email
          )
        }

        setJobs(filteredJobsData)
        setFilteredJobs(filteredJobsData)

        // Fetch active team members
        if (['admin', 'super_admin', 'recruiter', 'hiring_manager'].includes(userRole) && organizationId) {
          const { data: membersData } = await pgFetch('select', 'org_team', {
            select: 'id, name, email, role, organization_id, status',
            filters: [
              { column: 'organization_id', op: '=', value: organizationId },
              { column: 'status', op: '=', value: 'active' },
            ],
          })
          setTeamMembers(membersData || [])
        }
      } catch (err) {
        console.error('[v0] Error in jobs/team fetchData:', err)
      } finally {
        setLoadingJobs(false)
      }
    }

    fetchData()
  }, [userRole])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCvFile(e.target.files[0])
    }
  }

  const handleParseResume = async () => {
    if (!cvFile) {
      toast({
        title: 'No file selected',
        description: 'Please upload a CV first',
        variant: 'destructive',
      })
      return
    }

    setParsing(true)
    console.log('[v0] Starting resume parsing with enhanced extraction...')

    try {
      // Create FormData to pass file to server action
      const formDataForParsing = new FormData()
      formDataForParsing.append('file', cvFile)
      
      const result = await parseResume(formDataForParsing)
      console.log('[v0] Parse result:', result)

      if (result.success && result.data) {
        const parsedData = result.data
        
        setFormData({
          ...formData,
          name: parsedData.name || formData.name,
          mobile_number: parsedData.mobile_number || formData.mobile_number,
          email: parsedData.email || formData.email,
          skills: parsedData.skills || formData.skills,
          experience_years: parsedData.experience_years || formData.experience_years,
          current_location: parsedData.current_location || formData.current_location,
          current_ctc: parsedData.current_ctc || formData.current_ctc,
          expected_ctc: parsedData.expected_ctc || formData.expected_ctc,
          notice_period: parsedData.notice_period || formData.notice_period,
        })

        console.log('[v0] Form updated with parsed data:', {
          name: parsedData.name,
          mobile: parsedData.mobile_number
        })
      }

      toast({
        title: 'Resume Parsed Successfully!',
        description: 'Form has been auto-filled with parsed data',
        className: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0',
      })
    } catch (error) {
      console.error('[v0] Error parsing resume:', error)
      toast({
        title: 'Parsing Failed',
        description: 'Could not extract data from resume. Please fill manually.',
        variant: 'destructive',
      })
    } finally {
      setParsing(false)
    }
  }

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && 'preventDefault' in e) e.preventDefault()
    console.log('[v0] handleSubmit entered, isSubmitting:', isSubmittingRef.current, 'orgId:', authOrgId, 'name:', formData.name)
    if (isSubmittingRef.current) { console.log('[v0] blocked by ref'); return }
    isSubmittingRef.current = true
    
    // Validate all required fields
  const requiredFields = [
    { field: 'name',             label: 'Full Name' },
    { field: 'current_location', label: 'Location' },
    { field: 'status',           label: 'Status' },
    { field: 'source',           label: 'Source' },
  ]
    
    const missingFields: string[] = []
    const missingFieldKeys: string[] = []

    // For current_location: also accept what the user has typed in locationInput
    const effectiveLocation = formData.current_location?.trim() || locationInput?.trim() || ''
    if (effectiveLocation && !formData.current_location?.trim()) {
      setFormData(prev => ({ ...prev, current_location: effectiveLocation }))
    }

    for (const { field, label } of requiredFields) {
      const val = field === 'current_location'
        ? effectiveLocation
        : (formData[field as keyof typeof formData] ?? '').toString().trim()
      if (!val) {
        missingFields.push(label)
        missingFieldKeys.push(field)
      }
    }

    // Check email validation error only if email was provided
    if (emailError && formData.email.trim()) {
      missingFields.push('Valid Primary Email ID')
      missingFieldKeys.push('email')
    }

    // Phone: only validate format if a value was actually entered — never block on empty
    const phoneVal = formData.mobile_number?.trim()
    if (phoneVal && phoneVal.replace(/\D/g, '').length !== 10) {
      missingFields.push('Valid Phone Number (10 digits)')
      missingFieldKeys.push('mobile_number')
    }

    if (missingFields.length > 0) {
      isSubmittingRef.current = false
      setFieldErrors(missingFieldKeys)
      toast({
        title: 'Missing Required Fields',
        description: `Please fill: ${missingFields.join(', ')}`,
        variant: 'destructive',
      })
      const firstErrorField = document.getElementById(missingFieldKeys[0]) || 
                             document.querySelector(`[data-field="${missingFieldKeys[0]}"]`)
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }
    
    // Clear field errors if validation passes
    setFieldErrors([])
    
    setLoading(true)

    // Declared outside try so toast/redirect can read it after the try-catch completes
    let savedCandidateId: string | null = null
    let submitSuccess = false

    try {
      // ── Step 1: Upload CV if provided ─────────────────────────────────────
      let cvUrl = ''
      if (cvFile) {
        try {
          const uploadFormData = new FormData()
          uploadFormData.append('file', cvFile)
          const res    = await fetch('/api/upload-cv', { method: 'POST', body: uploadFormData })
          const result = await res.json()
          if (result.success && result.url) {
            cvUrl = result.url
          } else {
            toast({ title: 'CV Upload Failed', description: result.error || 'Could not upload CV.', variant: 'destructive' })
          }
        } catch (uploadErr: any) {
          toast({ title: 'CV Upload Failed', description: 'Network error uploading CV.', variant: 'destructive' })
        }
      }

      // ── Step 2: Resolve org ID ────────────────────────────────────────────
      // Primary: authOrgId from AuthContext (already loaded from localStorage)
      // Fallback: currentOrgId state (set by fetchData) → raw localStorage
      let organizationId: string =
        authOrgId || currentOrgId || ''
      let teamMemberId: string =
        authUserId || currentTeamMemberId || ''

      if (!organizationId) {
        try {
          const userStr = localStorage.getItem('hyrix_user')
          if (userStr) {
            const u = JSON.parse(userStr)
            organizationId = u.organizationId || u.organization_id || u.id || ''
            teamMemberId   = teamMemberId || u.id || ''
          }
        } catch {}
      }

      if (!organizationId) {
        toast({ title: 'Session Error', description: 'Could not determine your organisation. Please log out and log in again.', variant: 'destructive' })
        isSubmittingRef.current = false
        setLoading(false)
        return
      }

      // ── Step 3: Build payload ──────────────────────────────────────────────
      const effectiveLoc = formData.current_location?.trim() || locationInput?.trim() || ''
      const candidatePayload: Record<string, any> = {
        name:                toTitleCase(formData.name),
        mobile_number:       formData.mobile_number,
        email:               formData.email?.trim() || null,
        current_location:    effectiveLoc,
        preferred_location:  formData.preferred_location || null,
        area:                formData.area || null,
        skills:              formData.skills || null,
        industry:            formData.industry || null,
        designation:         formData.designation || null,
        years_of_experience: parseFloat(formData.experience_years) || 0,
        current_ctc:         formData.current_ctc || null,
        expected_ctc:        formData.expected_ctc || null,
        notice_period:       formData.notice_period || null,
        buyout_available:    formData.buyout_available || null,
        source:              formData.source || 'Direct',
        feedback:            formData.feedback || null,
        status:              formData.status || 'linedup',
        quality:             formData.quality || null,
        cv_url:              cvUrl || (isEditMode ? existingCvUrl : null),
        organization_id:     organizationId,
        job_id:              Array.isArray(formData.job_id) && formData.job_id.length > 0 ? formData.job_id[0] : null,
        job_ids:             Array.isArray(formData.job_id) && formData.job_id.length > 0 ? formData.job_id : null,
        assigned_to:         teamMemberId,
        created_by:          teamMemberId,
      }

      // ── Step 4: POST to /api/candidates (Lightsail pg) ────────────────────
      console.log('[v0] Submitting candidate — orgId:', organizationId, 'teamMemberId:', teamMemberId, 'mode:', isEditMode ? 'update' : 'create')
      const apiRes  = await fetch('/api/candidates', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          mode: isEditMode ? 'update' : 'create',
          id:   isEditMode ? editCandidateId : undefined,
          ...candidatePayload,
        }),
      })
      const apiData = await apiRes.json()

      if (!apiData.success) {

        if (apiData.duplicate) {
          toast({ title: 'Candidate Already Exists', description: apiData.error, variant: 'destructive' })
        } else {
          toast({ title: 'Error Saving Candidate', description: apiData.error || 'Please try again.', variant: 'destructive' })
        }
        return
      }

      // Mark success — toast + redirect happen after try block
      savedCandidateId = apiData.candidate?.id ?? null
      submitSuccess = true

    } catch (unexpectedErr: any) {
      console.error('[api/candidates]', unexpectedErr?.message)
      toast({
        title: 'Error',
        description: unexpectedErr?.message || 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      isSubmittingRef.current = false
    }

    if (!submitSuccess) return

    toast({
      title: isEditMode
        ? `${formData.name || 'Candidate'} has been updated successfully!`
        : `${formData.name || 'Candidate'} has been added successfully!`,
      duration: 6000,
      className: 'border bg-background text-foreground shadow-lg min-w-[320px]',
    })

    setTimeout(() => {
      const target = redirectPath || (userRole === 'recruiter' ? '/recruiter?tab=candidates' : '/admin?tab=candidates')
      try {
        if (window.top && window.top !== window.self) {
          window.top.location.href = target
        } else {
          router.push(target)
        }
      } catch {
        window.location.href = target
      }
    }, 2500)

    // Fire job applications in background via API — non-blocking
    if (Array.isArray(formData.job_id) && formData.job_id.length > 0 && savedCandidateId) {
      const candId = savedCandidateId
      Promise.allSettled(
        (formData.job_id as string[]).map(jobId =>
          fetch('/api/applications', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
              job_id:           jobId,
              candidate_id:     candId,
              candidate_name:   toTitleCase(formData.name),
              experience_years: parseFloat(formData.experience_years) || 0,
              skills:           formData.skills ? formData.skills.split(',').map(s => s.trim()) : [],
              stage:            'applied',
              stage_order:      1,
              applied_at:       new Date().toISOString(),
            }),
          })
        )
      ).catch(console.error)
    }
  }

  useEffect(() => {
    if (!jobSearch.trim()) {
      setFilteredJobs(jobs)
      return
    }
    const searchLower = jobSearch.toLowerCase().trim()
    const filtered = jobs.filter((job) => {
      const title = (job.title || '').toLowerCase()
      const jobId = (job.job_id || '').toLowerCase()
      const clientName = (job.client_name || '').toLowerCase()
      const location = (job.location || '').toLowerCase()
      return (
        title.includes(searchLower) ||
        jobId.includes(searchLower) ||
        clientName.includes(searchLower) ||
        location.includes(searchLower)
      )
    })
    setFilteredJobs(filtered)
  }, [jobSearch, jobs])

  // Show spinner while auth or permissions are still loading — NEVER show Access Denied prematurely
  if (authLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  // Check permission - Add Candidate for new, also for edit
  if (!hasModuleAccess('Add Candidate')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Lock className="h-16 w-16 text-gray-400" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-sm text-gray-600">You don't have permission to add or edit candidates.</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
        </Button>
      </div>
    )
  }

  return (
  <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e) }} noValidate className="max-w-5xl mx-auto">
      <div className="space-y-1">
        {/* Candidate Information - 3 Column Layout */}
        <Card className="relative pt-2 shadow-sm">
          <div className="absolute -top-1.5 left-3 bg-white px-1.5">
            <h3 className="text-[10px] font-semibold text-gray-700">Candidate Information</h3>
          </div>
          {/* Add Field button - Only visible to super_admin */}
          {userRole === 'super_admin' && (
            <div className="absolute -top-1.5 right-3 bg-white px-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2.5 text-[11px] gap-1.5 font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0 rounded-md transition-all shadow-sm hover:shadow-md"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Field
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 shadow-lg border-gray-200">
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Custom Fields
                  </div>
                  <DropdownMenuItem
                    onClick={async () => {
                      console.log('[v0] ADD FIELD: Button clicked!')
                      setShowQualityField(true)
                      
                      // Save to database
                      const userStr = localStorage.getItem('hyrix_user')
                      console.log('[v0] ADD FIELD: User from localStorage:', userStr ? 'Found' : 'NOT FOUND')
                      
                      if (userStr) {
                        const user = JSON.parse(userStr)
                        console.log('[v0] ADD FIELD: User email:', user.email)
                        
                        // Resolve org ID via pgFetch
                        let organizationId: string | null = currentOrgId || null
                        if (!organizationId) {
                          if (userRole === 'recruiter' || userRole === 'hiring_manager') {
                            const { data } = await pgFetch('select', 'org_team', { select: 'organization_id', filters: [{ column: 'email', op: '=', value: user.email }] })
                            organizationId = (Array.isArray(data) ? data[0] : data)?.organization_id ?? null
                          } else {
                            const { data } = await pgFetch('select', 'organization', { select: 'id', filters: [{ column: 'email', op: '=', value: user.email }] })
                            organizationId = (Array.isArray(data) ? data[0] : data)?.id ?? null
                          }
                        }
                        if (organizationId) {
                          const { error } = await pgFetch('update', 'organization', {
                            data: { custom_fields: JSON.stringify({ quality_field: true }) },
                            filters: [{ column: 'id', op: '=', value: organizationId }],
                          })
                          if (error) console.error('[v0] ADD FIELD: Error saving custom field:', error)
                        }
                      }
                    }}
                    disabled={showQualityField}
                    className="text-[13px] cursor-pointer py-2 px-3 font-medium focus:bg-indigo-50 focus:text-indigo-700"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>Quality</span>
                      {showQualityField && (
                        <Check className="h-3.5 w-3.5 text-indigo-600" />
                      )}
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
            <CardContent className="pt-1 pb-1.5 px-2.5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-2 gap-y-3">
              {/* Upload & Parse Resume - Upload in column 1, Parse in column 2 */}
              <div className="space-y-0.5">
                <Label htmlFor="cv" className="text-[10px] font-semibold text-gray-900">
                  Upload Resume
                </Label>
                <div className="flex items-center gap-1.5">
                  <Input 
                    id="cv" 
                    type="file" 
                    accept=".pdf,.doc,.docx" 
                    onChange={handleFileChange}
                    className="h-7 max-w-[220px] cursor-pointer border border-gray-300 hover:border-blue-400 transition-colors text-[10px] file:mr-2 file:h-full file:py-0 file:px-2 file:border-0 file:bg-gradient-to-r file:from-[#4F46E5] file:to-[#7C3AED] hover:file:from-[#4338CA] hover:file:to-[#6D28D9] file:text-white file:text-[10px] file:font-medium file:cursor-pointer"
                  />
                  {existingCvUrl && isEditMode && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(existingCvUrl, '_blank')}
                      className="border-gray-300 h-7 px-2 text-[10px]"
                    >
                      <Eye className="h-2.5 w-2.5 mr-0.5" />
                      View
                    </Button>
                  )}
                </div>
                {cvFile && (
                  <p className="text-[9px] text-emerald-600 mt-0.5 flex items-center gap-1">
                    <Check className="h-2 w-2" />
                    {cvFile.name}
                  </p>
                )}
              </div>
              
              {/* Parse Button - Column 2 */}
              <div className="space-y-0.5 flex flex-col justify-end">
                <Label className="text-[10px] invisible">Parse</Label>
                <Button 
                  type="button" 
                  onClick={handleParseResume} 
                  disabled={!cvFile || parsing} 
                  className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white disabled:opacity-50 h-7 max-w-[220px] text-[10px] font-medium"
                >
                  {parsing ? (
                    <>
                      <Loader2 className="h-2.5 w-2.5 animate-spin mr-1" />
                      Parsing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-2.5 w-2.5 mr-1" />
                      AI Parse
                    </>
                  )}
                </Button>
              </div>

              {/* Empty Column 3 - Force new row */}
              <div className="hidden md:block"></div>
              
              {/* Row 2: Full Name, Primary Email ID, Phone Number */}
  <div className="space-y-0.5">
  <Label htmlFor="name" className="text-[10px]">Full Name *</Label>
  <Input
  id="name"
  value={formData.name}
  onChange={(e) => {
    setFormData({ ...formData, name: e.target.value })
    if (fieldErrors.includes('name')) {
      setFieldErrors(prev => prev.filter(f => f !== 'name'))
    }
  }}
  placeholder="Enter name"
  className={`h-7 text-[10px] max-w-[220px] ${fieldErrors.includes('name') ? 'border-red-500 border-2' : ''}`}
  />
              </div>
              <div className="space-y-0.5">
                <Label htmlFor="email" className="text-[10px]">Primary Email ID</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                onChange={(e) => {
                  const email = e.target.value
                  setFormData({ ...formData, email })
                  
                  // Email validation regex - only validate if email is provided
                  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
                  if (email && !emailRegex.test(email)) {
                    setEmailError('Please enter a valid email address (e.g., user@gmail.com)')
                  } else {
                    setEmailError('')
                  }
                }}
                  placeholder="Enter email"
                  className={`h-7 text-[10px] max-w-[220px] ${emailError ? 'border-red-500' : ''}`}
                />
                {emailError && (
                  <p className="text-xs text-red-500 mt-1">{emailError}</p>
                )}
              </div>
  <div className="space-y-0.5">
  <Label htmlFor="mobile" className="text-[10px]">Phone Number *</Label>
  <div className="flex gap-1">
  <div className="relative w-[110px]">
  <Input
  value={countryCodeSearch}
  onChange={(e) => {
    setCountryCodeSearch(e.target.value)
    setShowCountryCodePopover(true)
  }}
  onClick={() => setShowCountryCodePopover(!showCountryCodePopover)}
  className={`h-7 text-[10px] pr-6 cursor-pointer ${fieldErrors.includes('mobile_number') ? 'border-red-500 border-2' : ''}`}
  readOnly
  />
                      {showCountryCodePopover && (
                        <div className="absolute z-50 w-[280px] mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-[200px] overflow-y-auto">
                          {(() => {
                            const search = (countryCodeSearch || '').toLowerCase()
                            const filtered = COUNTRY_CODES.filter(c => {
                              return (c.country || '').toLowerCase().includes(search) ||
                                (c.abbr || '').toLowerCase().includes(search) ||
                                (c.code || '').includes(search)
                            })
                            
                            if (filtered.length === 0) {
                              return (
                                <div className="px-3 py-2 text-xs text-gray-500">
                                  No country found.
                                </div>
                              )
                            }
                            
                            return filtered.map((country) => (
                              <button
                                key={country.code}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault()
                                  setCountryCode(country.code)
                                  setCountryCodeSearch(`${country.abbr} ${country.code}`)
                                  setShowCountryCodePopover(false)
                                }}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 flex items-center gap-2"
                              >
                                <span className="inline-flex items-center justify-center w-8 h-5 text-[9px] font-bold bg-blue-600 text-white rounded">{country.abbr}</span>
                                <span>{country.country} {country.code}</span>
                              </button>
                            ))
                          })()}
                        </div>
                      )}
                    </div>
  <Input
  id="mobile"
  value={formData.mobile_number}
  onChange={(e) => {
  const phone = e.target.value.replace(/\D/g, '') // Only allow digits
  
  // Limit to 10 digits
  if (phone.length <= 10) {
  setFormData({ ...formData, mobile_number: phone })
  if (fieldErrors.includes('mobile_number')) {
    setFieldErrors(prev => prev.filter(f => f !== 'mobile_number'))
  }
  }
                      
                      // Validate 10 digits
                      if (phone && phone.length !== 10) {
                        setPhoneError('Invalid phone number - must be exactly 10 digits')
                      } else {
                        setPhoneError('')
                      }
                    }}
                    placeholder="Enter 10-digit number"
                    maxLength={10}
                    className={`h-7 text-[10px] flex-1 ${phoneError || fieldErrors.includes('mobile_number') ? 'border-red-500 border-2' : ''}`}
                  />
                </div>
                {phoneError && (
                  <p className="text-xs text-red-500 mt-1">{phoneError}</p>
                )}
              </div>
              
              {/* Row 2: Experience, Current CTC, Expected CTC */}
  <div className="space-y-0.5">
  <Label htmlFor="experience" className="text-[10px]">Experience (Years)</Label>
  <Input
  id="experience"
  value={formData.experience_years}
  onChange={(e) => {
    setFormData({ ...formData, experience_years: e.target.value })
    if (fieldErrors.includes('experience_years')) {
      setFieldErrors(prev => prev.filter(f => f !== 'experience_years'))
    }
  }}
  placeholder="e.g. 5.6"
  className={`h-7 text-[10px] max-w-[220px] ${fieldErrors.includes('experience_years') ? 'border-red-500 border-2' : ''}`}
  />
              </div>
  <div className="space-y-0.5">
  <Label htmlFor="current_ctc" className="text-[10px]">Current CTC (LPA)</Label>
  <Input
  id="current_ctc"
  type="text"
  value={formData.current_ctc ? parseFloat(String(formData.current_ctc).replace(/,/g, '')).toLocaleString('en-IN') : ''}
  onChange={(e) => {
    const rawValue = e.target.value.replace(/,/g, '')
    if (!isNaN(Number(rawValue)) || rawValue === '') {
      setFormData({ ...formData, current_ctc: rawValue })
      if (fieldErrors.includes('current_ctc')) {
        setFieldErrors(prev => prev.filter(f => f !== 'current_ctc'))
      }
    }
  }}
  placeholder="Enter amount"
  className={`h-7 text-[10px] max-w-[220px] ${fieldErrors.includes('current_ctc') ? 'border-red-500 border-2' : ''}`}
  />
              </div>
  <div className="space-y-0.5">
  <Label htmlFor="expected_ctc" className="text-[10px]">Expected CTC (LPA)</Label>
  <Input
  id="expected_ctc"
  type="text"
  value={formData.expected_ctc ? parseFloat(String(formData.expected_ctc).replace(/,/g, '')).toLocaleString('en-IN') : ''}
  onChange={(e) => {
    const rawValue = e.target.value.replace(/,/g, '')
    if (!isNaN(Number(rawValue)) || rawValue === '') {
      setFormData({ ...formData, expected_ctc: rawValue })
      if (fieldErrors.includes('expected_ctc')) {
        setFieldErrors(prev => prev.filter(f => f !== 'expected_ctc'))
      }
    }
  }}
  placeholder="Enter amount"
  className={`h-7 text-[10px] max-w-[220px] ${fieldErrors.includes('expected_ctc') ? 'border-red-500 border-2' : ''}`}
  />
              </div>
              
              {/* Row 3: Industry, Department, Designation, Current Location, Preferred Location */}
              <div className="space-y-0.5" data-dropdown-container>
                <Label htmlFor="industry" className="text-[10px]">Industry</Label>
                <div className="relative">
                  <Input
                    id="industry"
                    placeholder="Select"
                    value={industryInput !== '' ? industryInput : formData.industry}
                    onChange={(e) => {
                      setIndustryInput(e.target.value)
                      setFormData({ ...formData, industry: e.target.value })
                      setShowIndustryDropdown(true)
                    }}
                    onFocus={() => setShowIndustryDropdown(true)}
                    className="h-7 text-[10px] max-w-[220px]"
                  />
                  {showIndustryDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto max-w-[220px]">
                      {industries
                        .filter((industry) =>
                          industry.name.toLowerCase().includes((industryInput || formData.industry || '').toLowerCase())
                        )
                        .map((industry) => (
                          <button
                            key={industry.id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, industry: industry.name })
                              setIndustryInput('')
                              setShowIndustryDropdown(false)
                            }}
                            className="w-full px-2 py-1 text-left hover:bg-gray-100 text-[10px]"
                          >
                            {industry.name}
                          </button>
                        ))}
                      {industries.filter((industry) =>
                        industry.name.toLowerCase().includes((industryInput || formData.industry || '').toLowerCase())
                      ).length === 0 && (
                        <div className="px-2 py-1 text-[10px] text-gray-500">No industries found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Designation — required, autosuggest from DB, Add+ to save new */}
              <div className="space-y-0.5" data-dropdown-container>
                <Label htmlFor="designation" className="text-[10px] font-medium">
                  Designation <span className="text-black font-bold">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="designation"
                    placeholder="Type to search designation..."
                    value={designationInput !== '' ? designationInput : formData.designation}
                    onChange={(e) => {
                      setDesignationInput(e.target.value)
                      setFormData(prev => ({ ...prev, designation: e.target.value }))
                      setShowDesignationDropdown(true)
                    }}
                    onFocus={() => setShowDesignationDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDesignationDropdown(false), 200)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape' || e.key === 'Enter') {
                        e.preventDefault()
                        setShowDesignationDropdown(false)
                      }
                    }}
                    className={`h-7 text-[10px] max-w-[220px] ${fieldErrors.includes('designation') ? 'border-red-500 border-2 focus-visible:ring-red-300' : ''}`}
                    autoComplete="off"
                  />
                  {showDesignationDropdown && (
                    <div className="absolute z-[9999] w-[220px] mt-1 bg-white border border-gray-200 rounded-md shadow-xl max-h-48 overflow-y-auto">
                      {(() => {
                        const query = (designationInput || formData.designation || '').toLowerCase().trim()
                        const filtered = designationsDB
                          .filter(d => query === '' || d.toLowerCase().includes(query))
                          .slice(0, 12)
                        const exactMatch = designationsDB.some(d => d.toLowerCase() === query)
                        const typedValue = (designationInput || formData.designation || '').trim()

                        return (
                          <>
                            {filtered.length === 0 && !typedValue && (
                              <div className="px-3 py-2 text-[10px] text-gray-400 italic">Start typing to search...</div>
                            )}
                            {filtered.map(d => (
                              <button
                                key={d}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, designation: d }))
                                  setDesignationInput('')
                                  setShowDesignationDropdown(false)
                                }}
                                className="w-full px-3 py-1.5 text-left hover:bg-blue-50 text-[10px] border-b border-gray-50 last:border-0 transition-colors"
                              >
                                {d}
                              </button>
                            ))}
                            {typedValue && !exactMatch && (
                              <button
                                type="button"
                                disabled={addingDesignation}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={async () => {
                                  if (!typedValue || addingDesignation) return
                                  setAddingDesignation(true)
                                  try {
                                    await pgFetch('upsert', 'designations', {
                                      data: { name: typedValue, organization_id: null },
                                      opts: { onConflict: 'name' },
                                    })
                                    setDesignationsDB(prev => {
                                      const alreadyExists = prev.some(d => d.toLowerCase() === typedValue.toLowerCase())
                                      if (alreadyExists) return prev
                                      return [...prev, typedValue].sort((a, b) => a.localeCompare(b))
                                    })
                                    setFormData(prev => ({ ...prev, designation: typedValue }))
                                    setDesignationInput('')
                                    setShowDesignationDropdown(false)
                                    toast({ title: 'Designation Added', description: `"${typedValue}" saved for future use.` })
                                  } finally {
                                    setAddingDesignation(false)
                                  }
                                }}
                                className="w-full px-3 py-2 text-left text-[10px] flex items-center gap-1.5 text-blue-600 hover:bg-blue-50 font-semibold border-t border-gray-200 transition-colors disabled:opacity-50"
                              >
                                <Plus className="h-3 w-3 shrink-0" />
                                {addingDesignation ? 'Adding...' : `Add "${typedValue}"`}
                              </button>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  )}
                </div>
              </div>
  <div className="space-y-0.5">
  <Label htmlFor="location" className="text-[10px]">Location *</Label>
  <div className="max-w-[220px]">
    <LocationAutocomplete
      value={formData.current_location}
      onChange={(value) => {
        setFormData({ ...formData, current_location: value })
        if (fieldErrors.includes('current_location')) {
          setFieldErrors(prev => prev.filter(f => f !== 'current_location'))
        }
      }}
      onValidCity={(isValid, cityName) => {
        setIsValidCurrentLocation(isValid)
        if (isValid && cityName) {
          setFormData({ ...formData, current_location: cityName })
          // Clear field error when valid city is selected
          if (fieldErrors.includes('current_location')) {
            setFieldErrors(prev => prev.filter(f => f !== 'current_location'))
          }
        }
      }}
      placeholder="Enter city"
      className="h-7 text-[10px]"
      required
    />
  </div>
</div>
                <div className="space-y-0.5" data-dropdown-container>
                  <Label htmlFor="preferred_location" className="text-[10px]">Preferred Location</Label>
                  <div className="relative">
                    <div className="relative flex items-center min-h-[28px] w-full max-w-[220px] rounded-md border border-input bg-background px-2 py-1 text-[10px] focus-within:ring-1 focus-within:ring-ring">
                      {/* Selected cities chips inside */}
                      <div className="flex flex-wrap gap-1 items-center flex-1">
                        {preferredLocations.map((city, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-0.5 bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[9px]"
                          >
                            {city}
                            <button
                              type="button"
                              onClick={() => {
                                const newLocations = preferredLocations.filter((_, i) => i !== index)
                                setPreferredLocations(newLocations)
                                setFormData({ ...formData, preferred_location: newLocations.join(', ') })
                              }}
                              className="hover:text-blue-600 ml-0.5"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        <input
                          id="preferred_location"
                          type="text"
                          value={preferredLocationInput}
                          onChange={(e) => {
                            const value = e.target.value
                            setPreferredLocationInput(value)
                            setShowPreferredLocationDropdown(value.length > 0)
                          }}
                          onFocus={() => {
                            if (preferredLocationInput.length > 0) {
                              setShowPreferredLocationDropdown(true)
                            }
                          }}
                          onBlur={() => setTimeout(() => setShowPreferredLocationDropdown(false), 200)}
                          placeholder={preferredLocations.length === 0 ? "Enter city name" : ""}
                          className="flex-1 min-w-[80px] outline-none bg-transparent text-[10px]"
                        />
                      </div>
                    </div>
                    {showPreferredLocationDropdown && preferredLocationInput && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto max-w-[220px]">
                        {cities
                          .filter((city) => 
                            city.name.toLowerCase().includes(preferredLocationInput.toLowerCase()) &&
                            !preferredLocations.includes(city.name)
                          )
                          .map((city) => (
                            <button
                              key={city.id}
                              type="button"
                              onClick={() => {
                                const newLocations = [...preferredLocations, city.name]
                                setPreferredLocations(newLocations)
                                setFormData({ ...formData, preferred_location: newLocations.join(', ') })
                                setPreferredLocationInput('')
                                setShowPreferredLocationDropdown(false)
                              }}
                              className="w-full px-2 py-1 text-left hover:bg-gray-100 text-[10px]"
                            >
                              {city.name}
                            </button>
                          ))}
                        {cities.filter((city) => 
                          city.name.toLowerCase().includes(preferredLocationInput.toLowerCase()) &&
                          !preferredLocations.includes(city.name)
                        ).length === 0 && (
                          <div className="px-2 py-1 text-[10px] text-gray-500">No cities found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              <div className="space-y-0.5">
                <Label htmlFor="area" className="text-[10px]">Area</Label>
                <Input
                  id="area"
                  placeholder="Enter area"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  className="h-7 text-[10px] max-w-[220px]"
                />
              </div>
              
              {/* Row 4: Status, Notice Period, Buyout Available */}
  <div className="space-y-0.5">
  <Label htmlFor="status" className="text-[10px]">Status *</Label>
  <Select value={formData.status} onValueChange={(value) => {
    setFormData({ ...formData, status: value })
    if (fieldErrors.includes('status')) {
      setFieldErrors(prev => prev.filter(f => f !== 'status'))
    }
  }}>
  <SelectTrigger className={`!h-7 text-[10px] !min-h-0 !py-0 ${fieldErrors.includes('status') ? 'border-red-500 border-2' : ''}`} data-field="status">
                    <SelectValue />
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
              </div>
  <div className="space-y-0.5">
  <Label htmlFor="notice_period" className="text-[10px]">Notice Period</Label>
  <Select value={formData.notice_period} onValueChange={(value) => {
    setFormData({ ...formData, notice_period: value })
    if (fieldErrors.includes('notice_period')) {
      setFieldErrors(prev => prev.filter(f => f !== 'notice_period'))
    }
  }}>
  <SelectTrigger className={`!h-7 text-[10px] !min-h-0 !py-0 ${fieldErrors.includes('notice_period') ? 'border-red-500 border-2' : ''}`} data-field="notice_period">
                    <SelectValue placeholder="Select notice period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Immediate Joiner">Immediate Joiner</SelectItem>
                    <SelectItem value="0-7 Days">0–7 Days</SelectItem>
                    <SelectItem value="8-15 Days">8–15 Days</SelectItem>
                    <SelectItem value="16-30 Days">16–30 Days</SelectItem>
                    <SelectItem value="31-45 Days">31–45 Days</SelectItem>
                    <SelectItem value="46-60 Days">46–60 Days</SelectItem>
                    <SelectItem value="61-90 Days">61–90 Days</SelectItem>
                    <SelectItem value="Serving Notice Period">Serving Notice Period</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-0.5">
                <Label htmlFor="buyout_available" className="text-[10px]">Buyout Available</Label>
                <Select value={formData.buyout_available} onValueChange={(value) => setFormData({ ...formData, buyout_available: value })}>
                  <SelectTrigger className="!h-7 text-[10px] !min-h-0 !py-0">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                    <SelectItem value="NA">NA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
  {/* Row 5: Source and other fields */}
  <div className="space-y-0.5">
  <Label htmlFor="source" className="text-[10px]">Source *</Label>
  <Select value={formData.source} onValueChange={(value) => {
    setFormData({ ...formData, source: value })
    if (fieldErrors.includes('source')) {
      setFieldErrors(prev => prev.filter(f => f !== 'source'))
    }
  }}>
  <SelectTrigger className={`!h-7 text-[10px] !min-h-0 !py-0 ${fieldErrors.includes('source') ? 'border-red-500 border-2' : ''}`} data-field="source">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Direct">Direct</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Shine">Shine</SelectItem>
                    <SelectItem value="WorkIndia">WorkIndia</SelectItem>
                    <SelectItem value="Indeed">Indeed</SelectItem>
                    <SelectItem value="Apna">Apna</SelectItem>
                    <SelectItem value="Naukri">Naukri</SelectItem>
                    <SelectItem value="IIM Jobs">IIM Jobs</SelectItem>
                    <SelectItem value="Data">Data</SelectItem>
                    <SelectItem value="Old Candidate">Old Candidate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Row 5: Skills - Full width spanning all 3 columns */}
              <div className="space-y-0.5 md:col-span-3 relative">
                <Label htmlFor="skills" className="text-[10px]">Skills (Keywords related to profile)</Label>
                <div className="border rounded-md p-1 bg-white min-h-[28px] flex flex-wrap items-center gap-0.5">
                  {skillsArray.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="px-1.5 py-0 text-[9px] flex items-center gap-0.5 h-5">
                      {skill}
                      <button
                        type="button"
                        onClick={() => {
                          const newSkills = skillsArray.filter((_, i) => i !== index)
                          setSkillsArray(newSkills)
                          setFormData({ ...formData, skills: newSkills.join(', ') })
                        }}
                        className="ml-0.5 hover:text-destructive text-base leading-none"
                        title="Remove skill"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                  <Input
                    id="skills"
                    placeholder="Type to add skills"
                    value={skillInput}
                    onChange={(e) => {
                      setSkillInput(e.target.value)
                      setShowSkillsDropdown(true)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && skillInput.trim()) {
                        e.preventDefault()
                        if (!skillsArray.includes(skillInput.trim())) {
                          const newSkills = [...skillsArray, skillInput.trim()]
                          setSkillsArray(newSkills)
                          setFormData({ ...formData, skills: newSkills.join(', ') })
                        }
                        setSkillInput('')
                        setShowSkillsDropdown(false)
                      }
                    }}
                    onFocus={() => setShowSkillsDropdown(true)}
                    onBlur={() => setTimeout(() => setShowSkillsDropdown(false), 200)}
                    className="text-[10px] border-none focus-visible:ring-0 h-5 px-1 flex-1 min-w-[120px]"
                  />
                  {showSkillsDropdown && skillInput && skillsDatabase.length > 0 && (
                    <div className="absolute z-50 w-full mt-0.5 bg-white border rounded-md shadow-lg max-h-32 overflow-y-auto left-0">
                      {skillsDatabase
                        .filter(skill => 
                          skill.skill_name.toLowerCase().includes(skillInput.toLowerCase()) &&
                          !skillsArray.includes(skill.skill_name)
                        )
                        .slice(0, 10)
                        .map(skill => (
                          <div
                            key={skill.id}
                            className="px-2 py-1 hover:bg-gray-100 cursor-pointer text-[10px] flex items-center justify-between"
                            onClick={() => {
                              if (!skillsArray.includes(skill.skill_name)) {
                                const newSkills = [...skillsArray, skill.skill_name]
                                setSkillsArray(newSkills)
                                setFormData({ ...formData, skills: newSkills.join(', ') })
                              }
                              setSkillInput('')
                              setShowSkillsDropdown(false)
                              document.getElementById('skills')?.focus()
                            }}
                          >
                            <span>{skill.skill_name}</span>
                            <span className="text-[10px] text-gray-500">{skill.category}</span>
                          </div>
                        ))}
                      {skillsDatabase.filter(skill => 
                        skill.skill_name.toLowerCase().includes(skillInput.toLowerCase()) &&
                        !skillsArray.includes(skill.skill_name)
                      ).length === 0 && (
                        <div className="px-2 py-1 text-[10px] text-gray-500">
                          No matching skills. Press Enter to add "{skillInput}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Row 6: Assign to Job (Multiple Selection) */}
              <div className="space-y-0.5">
                <Label className="text-[10px]">Assign to Job (Optional)</Label>
                <Popover open={showJobDropdown} onOpenChange={setShowJobDropdown}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={showJobDropdown} className="w-full h-7 justify-between text-[10px] bg-transparent">
                      {Array.isArray(formData.job_id) && formData.job_id.length > 0 
                        ? `${formData.job_id.length} job(s) selected` 
                        : 'Select jobs'}
                      <Search className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[500px] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput placeholder="Search by job title, ID, company name..." value={jobSearch} onValueChange={setJobSearch} />
                      <CommandList>
                        {loadingJobs ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : filteredJobs.length === 0 ? (
                          <CommandEmpty>No jobs found.</CommandEmpty>
                        ) : (
                          <>
                            {/* Selected Jobs Section */}
                            {Array.isArray(formData.job_id) && formData.job_id.length > 0 && (
                              <div className="border-b p-2 bg-blue-50">
                                <div className="text-xs font-medium text-blue-900 mb-2">Selected Jobs ({formData.job_id.length})</div>
                                <div className="grid grid-cols-2 gap-2">
                                  {formData.job_id.map((jobId) => {
                                    const job = jobs.find(j => j.id === jobId)
                                    return job ? (
                                      <div key={jobId} className="flex items-start gap-2 p-2 bg-white rounded border border-blue-200">
                                        <input
                                          type="checkbox"
                                          checked={true}
                                          onChange={() => {
                                            const newJobIds = formData.job_id.filter(id => id !== jobId)
                                            setFormData({ ...formData, job_id: newJobIds })
                                          }}
                                          className="mt-1"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <div className="text-xs font-medium truncate">{job.title}</div>
                                          <div className="text-[10px] text-muted-foreground truncate">
                                            {job.job_id} • {job.location}
                                          </div>
                                        </div>
                                      </div>
                                    ) : null
                                  })}
                                </div>
                              </div>
                            )}
                            
                            {/* All Jobs List with Checkboxes */}
                            <CommandGroup>
                              <div className="grid grid-cols-2 gap-1 p-2">
                                {filteredJobs.map((job) => {
                                  const isSelected = Array.isArray(formData.job_id) && formData.job_id.includes(job.id)
                                  return (
                                    <div
                                      key={job.id}
                                      onClick={() => {
                                        const currentIds = Array.isArray(formData.job_id) ? formData.job_id : []
                                        const newJobIds = isSelected
                                          ? currentIds.filter(id => id !== job.id)
                                          : [...currentIds, job.id]
                                        setFormData({ ...formData, job_id: newJobIds })
                                      }}
                                      className="flex items-start gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer border"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {}}
                                        className="mt-1"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium truncate">{job.title}</div>
                                        <div className="text-[10px] text-muted-foreground truncate">
                                          {job.job_id} • {job.client_name}
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </CommandGroup>
                          </>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              
              {/* Quality Field - Visible to managers always, others when enabled */}
              {(showQualityField || userRole === 'hiring_manager' || userRole === 'account_manager') && (
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="quality" className="text-[10px]">Quality</Label>
                    {userRole === 'super_admin' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          setShowQualityField(false)
                          setFormData({ ...formData, quality: '' })
                          
                          // Update database to remove field
                          const userStr = localStorage.getItem('hyrix_user')
                          if (userStr) {
                            const user = JSON.parse(userStr)
                            let organizationId: string | null = currentOrgId || null
                            if (!organizationId) {
                              if (userRole === 'recruiter' || userRole === 'hiring_manager') {
                                const { data } = await pgFetch('select', 'org_team', { select: 'organization_id', filters: [{ column: 'email', op: '=', value: user.email }] })
                                organizationId = (Array.isArray(data) ? data[0] : data)?.organization_id ?? null
                              } else {
                                const { data } = await pgFetch('select', 'organization', { select: 'id', filters: [{ column: 'email', op: '=', value: user.email }] })
                                organizationId = (Array.isArray(data) ? data[0] : data)?.id ?? null
                              }
                            }
                            if (organizationId) {
                              const { error } = await pgFetch('update', 'organization', {
                                data: { custom_fields: JSON.stringify({ quality_field: false }) },
                                filters: [{ column: 'id', op: '=', value: organizationId }],
                              })
                              if (error) {
                                console.error('[v0] Error removing custom field:', error)
                              } else {
                                console.log('[v0] Quality field removed from database')
                              }
                            }
                          }
                        }}
                        className="h-4 w-4 p-0 hover:bg-red-50"
                      >
                        <X className="h-3 w-3 text-gray-500 hover:text-red-600" />
                      </Button>
                    )}
                  </div>
                  <Select
                    value={formData.quality}
                    onValueChange={(value) => setFormData({ ...formData, quality: value })}
                  >
                    <SelectTrigger className="!h-7 text-[10px] !min-h-0 !py-0">
                      <SelectValue placeholder="Select quality rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A1" className="text-[10px]">A1</SelectItem>
                      <SelectItem value="B1" className="text-[10px]">B1</SelectItem>
                      <SelectItem value="B2" className="text-[10px]">B2</SelectItem>
                      <SelectItem value="C1" className="text-[10px]">C1</SelectItem>
                      <SelectItem value="C2" className="text-[10px]">C2</SelectItem>
                      <SelectItem value="C3" className="text-[10px]">C3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Feedback - Full width spanning all 3 columns */}
              <div className="space-y-0.5 md:col-span-3">
                <Label htmlFor="feedback" className="text-[10px]">Notes / Feedback</Label>
                <Textarea
                  id="feedback"
                  value={formData.feedback}
                  onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                  rows={2}
                  placeholder="Add notes"
                  className="text-xs resize-none"
                />
              </div>
              
              {/* Submit Buttons - Full width spanning all 3 columns */}
              <div className="md:col-span-3 flex gap-2 mt-0">
                <Button type="button" onClick={() => { console.log('[v0] Add Candidate button clicked'); handleSubmit() }} disabled={loading} className="flex-1 h-8 text-xs font-medium">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditMode ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    isEditMode ? 'Update Candidate' : 'Add Candidate'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
        setFormData({
          name: '',
          email: '',
          mobile_number: '',
          experience_years: '',
          current_ctc: '',
          expected_ctc: '',
          notice_period: '',
          buyout_available: 'NA',
          industry: '',
          designation: '',
          current_location: '',
          preferred_location: '',
          quality: '',
          skills: '',
          status: 'linedup',
          feedback: '',
          job_id: '',
          assigned_to: '',
        })
        setDesignationInput('')
                    setCvFile(null)
                  }}
                  className="bg-transparent h-8 text-xs font-medium flex-1"
                >
                  Preview
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()} className="bg-transparent h-8 text-xs font-medium flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
