'use client'

import React from "react"

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { usePermissions } from '@/hooks/use-permissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Briefcase,
  FileText,
  Settings,
  Sparkles,
  Eye,
  CheckCircle,
  Menu,
  X,
  LayoutDashboard,
  Users,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Settings as SettingsIcon,
  Sliders,
  Rocket,
  LogOut,
  Save,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Plus,
  UserCircle,
  History,
  Lock,
  Facebook,
  Linkedin,
  Twitter,
  Instagram,
  Mail,
  Copy,
  Download,
  Upload,
  ExternalLink,
  UserCog,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { generateJobId } from '@/lib/generate-job-id'
import RichTextEditor from '@/components/rich-text-editor'

interface JobCreationFormProps {
  userRole?: 'admin' | 'recruiter' | 'super_admin' | 'hiring_manager'
}

export default function JobCreationForm({ userRole = 'admin' }: JobCreationFormProps) {
  console.log('[v0] JobCreationForm component initializing - userRole:', userRole) 
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { hasModuleAccess, loading: permissionsLoading } = usePermissions()
  const supabase = createClient()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [isPublished, setIsPublished] = useState(false)
  const [publishedJobId, setPublishedJobId] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editJobId, setEditJobId] = useState<string | null>(null)
  const [uploadingJD, setUploadingJD] = useState(false)
  const [organizationLogo, setOrganizationLogo] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  
  console.log('[v0] Initial state - currentStep:', currentStep, 'loading:', loading)
  
  // Detect edit mode from URL parameter
  useEffect(() => {
    const jobId = searchParams.get('id')
    if (jobId) {
      console.log('[v0] Edit mode detected - Job ID from URL:', jobId)
      setIsEditMode(true)
      setEditJobId(jobId)
    }
  }, [searchParams])
  
  // Load user email from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('hyrix_user')
    if (userStr) {
      try {
        const userData = JSON.parse(userStr)
        if (userData.email) {
          setUserEmail(userData.email)
        }
      } catch (error) {
        console.error('[v0] Error parsing user data:', error)
      }
    }
  }, [])

  // Fetch organization logo
  useEffect(() => {
    const fetchOrganizationLogo = async () => {
      if (!userEmail) return

      const { data: orgData } = await supabase
        .from('organization')
        .select('logo_url')
        .eq('email', userEmail)
        .single()

      if (orgData?.logo_url) {
        setOrganizationLogo(orgData.logo_url)
      }
    }

    fetchOrganizationLogo()
  }, [userEmail, supabase])

  // Check for edit mode via URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const jobId = urlParams.get('id')
    if (jobId) {
      console.log('[v0] Edit mode detected - Job ID:', jobId)
      setIsEditMode(true)
      setEditJobId(jobId)
      setLoading(true)
    }
  }, [])
  
  const [formData, setFormData] = useState({
    job_id: '',
    title: '',
    position_type: 'full-time',
    location: '',
    remote_option: 'office',
    skill_level: 'entry',
    visibility: 'public',
    salary_type: 'yearly',
    salary_min: '',
    salary_max: '',
  department: '',
  min_experience: '',
  max_experience: '',
  description: '',
  requirements: '',
  responsibilities: '',
  skills: '',
  benefits: '',
  work_mode: 'office',
  client_name: '',
  account_manager: '',
  assigned_recruiter: [] as string[],
  hiring_manager: [] as string[],
  industry: '',
  contact_name: [] as string[],
    job_opening_status: 'active',
    education: '',
    about_company: '',
    company_size: '',
    company_website: '',
    work_environment: ''
  })
  
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const editorRef = useRef<HTMLTextAreaElement>(null)
  
  // History for recruiters and contacts
  const [recruiterHistory, setRecruiterHistory] = useState<string[]>([])
  const [hiringManagerHistory, setHiringManagerHistory] = useState<string[]>([])
  const [hiringManagerInput, setHiringManagerInput] = useState('')
  const [showHiringManagerDropdown, setShowHiringManagerDropdown] = useState(false)
  const [contactHistory, setContactHistory] = useState<string[]>([])
  const [showRecruiterDropdown, setShowRecruiterDropdown] = useState(false)
  const [showContactDropdown, setShowContactDropdown] = useState(false)
  
  // Helper function to format numbers with Indian comma separation (e.g., 4,00,000)
  const formatIndianNumber = (value: string) => {
    if (!value) return ''
    // Remove existing commas
    const numStr = value.replace(/,/g, '')
    if (!/^\d+$/.test(numStr)) return value
    
    // Indian numbering system: last 3 digits, then groups of 2
    const lastThree = numStr.slice(-3)
    const otherNumbers = numStr.slice(0, -3)
    const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + (otherNumbers ? ',' : '') + lastThree
    return formatted
  }
  
  // Helper function to parse formatted number back to plain string
  const parseFormattedNumber = (value: string) => {
    return value.replace(/,/g, '')
  }
  
  // Team members from org_team table
  const [teamMembers, setTeamMembers] = useState<Array<{id: string, name: string, role: string, email: string}>>([])
  const [accountManagers, setAccountManagers] = useState<Array<{id: string, name: string, email: string}>>([])
  const [showAccountManagerDropdown, setShowAccountManagerDropdown] = useState(false)
  
  // Clients from clients table
  const [clients, setClients] = useState<Array<{id: string, company_name: string, email: string, phone: string, company_overview?: string}>>([])
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [clientInput, setClientInput] = useState('')
  const [selectedClientEmails, setSelectedClientEmails] = useState<string[]>([])
  const [selectedClientContactNames, setSelectedClientContactNames] = useState<string[]>([])
  
  // Cities from cities table
  const [cities, setCities] = useState<Array<{id: string, name: string}>>([])
  const [locationInput, setLocationInput] = useState('')
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false)
  const [newClientForm, setNewClientForm] = useState({
    company_name: '',
    email: '',
    phone: '',
    address: '',
    industry: '',
    gst: ''
  })
  
  // Industries from industries table
  const [industries, setIndustries] = useState<Array<{id: string, name: string}>>([])
  const [industryInput, setIndustryInput] = useState('')
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false)
  const [clientIndustryInput, setClientIndustryInput] = useState('')
  const [showClientIndustryDropdown, setShowClientIndustryDropdown] = useState(false)
  
  // Departments from departments table
  const [departments, setDepartments] = useState<Array<{id: string, department_name: string, industry_id: string}>>([])
  const [departmentInput, setDepartmentInput] = useState('')
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false)
  
  // Skills from skills table
  const [skillsDatabase, setSkillsDatabase] = useState<Array<{id: number, skill_name: string, category: string}>>([])
  const [showSkillsDropdown, setShowSkillsDropdown] = useState(false)
  const [jobDescriptionTemplates, setJobDescriptionTemplates] = useState<Array<{id: string, name: string, content: string}>>([])
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  
  // Input tracking for adding new names
  const [accountManagerInput, setAccountManagerInput] = useState('')
  const [contactNameInput, setContactNameInput] = useState('')
  const [recruiterInput, setRecruiterInput] = useState('')
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-dropdown-container]')) {
        setShowContactDropdown(false)
  setShowRecruiterDropdown(false)
  setShowHiringManagerDropdown(false)
  setShowContactDropdown(false)
  setShowClientDropdown(false)
  setShowAccountManagerDropdown(false)
      setShowIndustryDropdown(false)
      setShowClientIndustryDropdown(false)
      setShowDepartmentDropdown(false)
      setShowSkillsDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])


  // Fetch recruiter and contact history from previous jobs, and team members
  useEffect(() => {
    console.log('[v0] useEffect: Starting to fetch history data')
    const fetchHistory = async () => {
      try {
        // Get logged-in admin's email from localStorage
        const userStr = localStorage.getItem('hyrix_user')
        if (!userStr) {
          console.error('[v0] fetchHistory: No logged-in user found')
          return
        }
        
        const user = JSON.parse(userStr)
        console.log('[v0] fetchHistory: Logged-in admin email:', user.email)
        
        console.log('[v0] fetchHistory: Creating Supabase client')
        const supabase = createClient()
        let managersFromTeam: Array<{id: string, name: string, email: string}> = []
        
      // Fetch organization ID - try organization table first (for admin), then org_team (for recruiter)
      console.log('[v0] fetchHistory: Fetching organization data for:', user.email, 'role:', user.role)
      let organizationId = null
      
      if (user.role === 'recruiter' || user.role === 'hiring_manager') {
        // For recruiters and hiring managers, get organization from org_team table
        const { data: teamData, error: teamError } = await supabase
          .from('org_team')
          .select('organization_id')
          .eq('email', user.email)
          .maybeSingle()
        
        if (teamError) {
          console.error('[v0] fetchHistory: Error fetching org from org_team:', teamError)
        }
        organizationId = teamData?.organization_id
        console.log('[v0] fetchHistory (recruiter/hiring_manager): Organization ID from org_team:', organizationId)
      } else {
        // For admin/super_admin, query organization table
        const { data: orgData, error: orgError } = await supabase
          .from('organization')
          .select('id')
          .eq('email', user.email)
          .maybeSingle()
        
        if (orgError) {
          console.error('[v0] fetchHistory: Error fetching organization:', orgError)
        }
        organizationId = orgData?.id
        console.log('[v0] fetchHistory (admin): Organization ID from organization table:', organizationId)
      }
    
      if (organizationId) {
        setOrganizationId(organizationId)
        
        // Fetch job description templates
        const { data: templatesData, error: templatesError } = await supabase
          .from('templates')
          .select('id, name, content')
          .eq('organization_id', organizationId)
          .eq('type', 'job_description')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
        
        if (templatesError) {
          console.error('[v0] fetchHistory: Error fetching templates:', templatesError)
        } else if (templatesData) {
          console.log('[v0] fetchHistory: Fetched templates:', templatesData.length)
          setJobDescriptionTemplates(templatesData)
        }
        
        console.log('[v0] fetchHistory: Fetching team data for org:', organizationId)
        const { data: teamData, error: teamError } = await supabase
          .from('org_team')
          .select('id, name, role, email')
          .eq('organization_id', organizationId)
          .eq('status', 'active')
        
        if (teamError) {
          console.error('[v0] fetchHistory: Error fetching team:', teamError)
        }
        console.log('[v0] fetchHistory: Team data:', teamData)
        
        if (teamData) {
          setTeamMembers(teamData)
          
          const allNames = teamData.map(member => member.name).filter(Boolean)
          setContactHistory(allNames)
          
          // Recruiters only
          const recruiters = teamData
            .filter(member => member.role === 'recruiter')
            .map(member => member.name)
            .filter(Boolean)
          setRecruiterHistory(recruiters.length > 0 ? recruiters : allNames)
          
          // Hiring managers only
          const hiringManagers = teamData
            .filter(member => member.role === 'hiring_manager')
            .map(member => member.name)
            .filter(Boolean)
          setHiringManagerHistory(hiringManagers.length > 0 ? hiringManagers : allNames)
          
          // Account managers only - from org_team role
          const accountMgrTeam = teamData
            .filter(member => member.role === 'account_manager')
            .map(member => ({ id: member.id, name: member.name, email: member.email }))
          if (accountMgrTeam.length > 0) {
            setAccountManagers(accountMgrTeam)
          }
          
          console.log('[v0] fetchHistory: Recruiters:', recruiters, 'Hiring Managers:', hiringManagers, 'Account Managers:', accountMgrTeam)
        }
        
        // Fetch clients from clients table
        const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('id, company_name, email, phone, contact_name, company_overview')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('company_name', { ascending: true })
        
        if (!clientsError && clientsData) {
          setClients(clientsData)
        }
        
        // Fetch industries from industries table
        console.log('[v0] fetchHistory: Fetching industries')
        const { data: industriesData, error: industriesError } = await supabase
          .from('industries')
          .select('id, name')
          .order('name', { ascending: true })
        
  if (industriesError) {
    console.error('[v0] fetchHistory: Error fetching industries:', industriesError)
  } else if (industriesData) {
    setIndustries(industriesData)
    console.log('[v0] fetchHistory: Industries loaded:', industriesData.length)
  }
  
  // Fetch departments from departments table
  console.log('[v0] fetchHistory: Fetching departments')
  const { data: departmentsData, error: departmentsError } = await supabase
    .from('departments')
    .select('id, department_name, industry_id')
    .eq('is_active', true)
    .order('department_name', { ascending: true })
  
  if (departmentsError) {
    console.error('[v0] fetchHistory: Error fetching departments:', departmentsError)
  } else if (departmentsData) {
    setDepartments(departmentsData)
    console.log('[v0] fetchHistory: Departments loaded:', departmentsData.length)
  }
  
  // Fetch skills from skills table
  console.log('[v0] fetchHistory: Fetching skills')
  const { data: skillsData, error: skillsError } = await supabase
    .from('skills')
    .select('id, skill_name, category')
    .order('skill_name', { ascending: true })
  
  if (skillsError) {
    console.error('[v0] fetchHistory: Error fetching skills:', skillsError)
  } else if (skillsData) {
    setSkillsDatabase(skillsData)
    console.log('[v0] fetchHistory: Skills loaded:', skillsData.length)
  }
  
  // Fetch cities from cities table
  console.log('[v0] fetchHistory: Fetching cities')
  const { data: citiesData, error: citiesError } = await supabase
    .from('cities')
    .select('id, name')
    .order('name', { ascending: true })
  
  if (citiesError) {
    console.error('[v0] fetchHistory: Error fetching cities:', citiesError)
  } else if (citiesData) {
    setCities(citiesData)
    console.log('[v0] fetchHistory: Cities loaded:', citiesData.length)
  }
  }
      
      // Fetch from previous jobs for historical data (only from user's organization)
      console.log('[v0] fetchHistory: Fetching jobs data for organization:', organizationId)
      const { data, error } = await supabase
        .from('jobs')
        .select('assigned_recruiter, contact_name, account_manager, organization_id')
        .eq('organization_id', organizationId)

      if (error) {
        console.error('[v0] fetchHistory: Error fetching jobs:', error)
      }
      console.log('[v0] fetchHistory: Jobs data count:', data?.length || 0)

      if (data && !error) {
        // DO NOT merge job history - only show currently active team members
        // Historical names could include inactive/revoked users
        console.log('[v0] fetchHistory: Using only active team members for contact/recruiter dropdowns (no historical merge)')
        
        // Merge historical account managers with org_team ones (avoid duplicates)
        const accountMgrs = [...new Set(data.map(job => job.account_manager).filter(Boolean).map(name => name.trim()))]
        if (accountMgrs.length > 0) {
          setAccountManagers(prev => {
            const existingNames = prev.map(m => m.name.toLowerCase())
            const newFromHistory = accountMgrs
              .filter(name => !existingNames.includes(name.toLowerCase()))
              .map(name => ({ id: `history-${name}`, name, email: '' }))
            return [...prev, ...newFromHistory]
          })
        }
      }
      console.log('[v0] fetchHistory: Data fetch completed successfully')
      } catch (error) {
        console.error('[v0] fetchHistory: Unexpected error:', error)
      }
    }
    fetchHistory()
  }, [])

  // Fetch job data for edit mode
  useEffect(() => {
    console.log('[v0] Edit mode useEffect triggered - isEditMode:', isEditMode, 'editJobId:', editJobId)
    if (isEditMode && editJobId) {
      const fetchJobData = async () => {
        try {
          console.log('[v0] Fetching job data for edit - ID:', editJobId)
          const supabase = createClient()
          
          const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('id', editJobId)
            .single()

          if (error) {
            console.error('[v0] Error fetching job data:', error)
            toast({
              title: 'Error',
              description: 'Failed to load job data',
              variant: 'destructive',
            })
            setLoading(false)
            return
          }

          if (data) {
            console.log('[v0] Job data loaded successfully:', data.title)
            
            // Helper to parse array fields
            const parseArrayField = (field: any): string => {
              if (!field) return ''
              if (Array.isArray(field)) return field.join('\n')
              if (typeof field === 'string') return field
              return ''
            }

            // Helper to parse string array fields (for multi-select)
            const parseStringArray = (field: any): string[] => {
              if (!field) return []
              if (Array.isArray(field)) return field
              if (typeof field === 'string') return [field]
              return []
            }

            // Parse salary range back to min and max values
            let parsedSalaryMin = ''
            let parsedSalaryMax = ''
            let parsedSalaryType = 'yearly'
            
            if (data.salary_range) {
              // Format: "₹3,50,000 - ₹5,00,000 / yearly"
              const salaryMatch = data.salary_range.match(/₹([\d,]+)\s*-\s*₹([\d,]+)\s*\/\s*(\w+)/)
              if (salaryMatch) {
                parsedSalaryMin = salaryMatch[1].replace(/,/g, '')
                parsedSalaryMax = salaryMatch[2].replace(/,/g, '')
                parsedSalaryType = salaryMatch[3] || 'yearly'
              }
            }

            // Pre-fill all form fields
            setFormData({
              job_id: data.job_id || '',
              title: data.title || '',
              position_type: data.employment_type || 'full-time',
              location: data.location || '',
              remote_option: data.remote_option || 'office',
              skill_level: data.skill_level || 'entry',
              visibility: data.visibility || 'public',
              salary_type: parsedSalaryType,
              salary_min: parsedSalaryMin,
              salary_max: parsedSalaryMax,
  department: data.department || '',
  min_experience: data.min_experience?.toString() || '',
  max_experience: data.max_experience?.toString() || '',
  description: data.description || '',
  requirements: parseArrayField(data.requirements),
  responsibilities: parseArrayField(data.responsibilities),
              company_info: data.company_info || '',
              application_process: data.application_process || '',
              keywords: data.keywords || '',
              status: data.status || 'draft',
              client_name: data.client_name || '',
              account_manager: data.account_manager || '',
              assigned_recruiter: parseStringArray(data.assigned_recruiter),
              hiring_manager: parseStringArray(data.hiring_manager),
              industry: data.industry || '',
              contact_name: parseStringArray(data.contact_name),
              job_opening_status: data.job_opening_status || 'draft',
              education: data.education || '',
              about_company: data.about_company || '',
              company_size: data.company_size || '',
              company_website: data.company_website || '',
              benefits: parseArrayField(data.benefits),
              work_environment: data.work_environment || ''
            })

  // Set skills if available - check multiple possible field names
  if (data.skills_required) {
    if (Array.isArray(data.skills_required)) {
      setSkills(data.skills_required)
    } else if (typeof data.skills_required === 'string') {
      setSkills(data.skills_required.split(',').map((s: string) => s.trim()).filter(Boolean))
    }
  } else if (data.skills) {
    // Fallback for older jobs that might have 'skills' field
    if (Array.isArray(data.skills)) {
      setSkills(data.skills)
    } else if (typeof data.skills === 'string') {
      setSkills(data.skills.split(',').map((s: string) => s.trim()).filter(Boolean))
    }
  } else if (data.keywords) {
              // Fallback to keywords field
              const keywordsList = data.keywords.split(',').map((s: string) => s.trim()).filter(Boolean)
              setSkills(keywordsList)
            }

            console.log('[v0] All form fields populated for edit mode')
            console.log('[v0] Loaded description length:', data.description?.length || 0)
            console.log('[v0] Loaded company_info length:', data.company_info?.length || 0)
            console.log('[v0] Loaded about_company length:', data.about_company?.length || 0)
            console.log('[v0] Loaded salary_range:', data.salary_range)
            console.log('[v0] Parsed salary:', parsedSalaryMin, '-', parsedSalaryMax)
          }
          
          setLoading(false)
        } catch (error) {
          console.error('[v0] Unexpected error fetching job:', error)
          toast({
            title: 'Error',
            description: 'An unexpected error occurred',
            variant: 'destructive',
          })
          setLoading(false)
        }
      }

      fetchJobData()
    }
  }, [isEditMode, editJobId, toast])

  const steps = [
  { number: 1, label: 'Details', icon: FileText },
  { number: 2, label: 'Description', icon: FileText },
  { number: 3, label: 'Preview', icon: CheckCircle },
  { number: 4, label: 'Success', icon: Rocket },
  ]

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { id: 'jobs', label: 'Jobs', icon: Briefcase, href: '/admin' },
    { id: 'candidates', label: 'Candidates', icon: Users, href: '/admin' },
    { id: 'reports', label: 'Reports', icon: BarChart3, href: '/admin' },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, href: '/admin' },
  ]

  const handleNext = async () => {
    console.log('[v0] handleNext: Current step:', currentStep)
    
    // Auto-save draft before moving to next step if there's content
    if (formData.title && formData.title.trim() !== '') {
      console.log('[v0] handleNext: Auto-saving draft before navigation')
      await handleSaveDraft(true) // Silent mode - no toast or redirect
    }
    
    setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const decodeHTMLEntities = (text: string): string => {
    // Create a temporary element to decode HTML entities
    const textArea = document.createElement('textarea')
    textArea.innerHTML = text
    return textArea.value
  }

  const cleanupHTML = (html: string): string => {
    // Remove wrapper <p> tags around block elements
    let cleaned = html
    
    // Remove <p> wrapper around headings: <p><h3>...</h3></p> -> <h3>...</h3>
    cleaned = cleaned.replace(/<p>\s*(<h[1-6][^>]*>.*?<\/h[1-6]>)\s*<\/p>/gi, '$1')
    
    // Remove <p> wrapper around lists: <p><ul>...</ul></p> -> <ul>...</ul>
    cleaned = cleaned.replace(/<p>\s*(<ul[^>]*>.*?<\/ul>)\s*<\/p>/gi, '$1')
    cleaned = cleaned.replace(/<p>\s*(<ol[^>]*>.*?<\/ol>)\s*<\/p>/gi, '$1')
    
    // Remove nested <p> tags: <p><p>content</p></p> -> <p>content</p>
    cleaned = cleaned.replace(/<p>\s*<p>/gi, '<p>')
    cleaned = cleaned.replace(/<\/p>\s*<\/p>/gi, '</p>')
    
    // Remove empty <p><br></p> tags
    cleaned = cleaned.replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '')
    
    // Remove empty list items: <li><br></li> or <li></li> or <li> </li>
    cleaned = cleaned.replace(/<li>\s*<br\s*\/?>\s*<\/li>/gi, '')
    cleaned = cleaned.replace(/<li>\s*<\/li>/gi, '')
    cleaned = cleaned.replace(/<li>\s+<\/li>/gi, '')
    
    // Remove multiple consecutive <br> tags
    cleaned = cleaned.replace(/(<br\s*\/?>\s*){3,}/gi, '<br><br>')
    
    return cleaned
  }

  const convertPlainTextToHTML = (text: string): string => {
    // First decode any HTML entities (like &lt; to <)
    let decodedText = text
    if (text.includes('&lt;') || text.includes('&gt;') || text.includes('&amp;')) {
      decodedText = decodeHTMLEntities(text)
      console.log('[v0] Decoded HTML entities:', decodedText.substring(0, 100))
    }
    
    // Check if content is already HTML (after decoding)
    if (decodedText.includes('<h') || decodedText.includes('<ul>') || decodedText.includes('<ol>') || decodedText.includes('<strong>') || decodedText.includes('<b>')) {
      // It's already HTML, clean up malformed structure
      const cleanedHTML = cleanupHTML(decodedText)
      console.log('[v0] Cleaned HTML:', cleanedHTML.substring(0, 100))
      return cleanedHTML
    }
    
    // Check if the original text had proper HTML tags before any encoding
    if (text.includes('<p>') || text.includes('<div>')) {
      return text
    }
    
    // Convert plain text with line breaks to HTML
    // Split by double line breaks for paragraphs
    const paragraphs = text.split(/\n\n+/)
    
    let html = ''
    for (const para of paragraphs) {
      if (!para.trim()) continue
      
      // Check if it looks like a heading (short, followed by content, ends with colon, or all caps)
      const lines = para.split('\n').filter(line => line.trim())
      
      if (lines.length === 1) {
        const line = lines[0].trim()
        // If line ends with colon or is short and bold-looking, make it a heading
        if (line.endsWith(':') || (line.length < 50 && line === line.toUpperCase())) {
          html += `<h3><strong>${line}</strong></h3>`
        } else {
          html += `<p>${line}</p>`
        }
      } else {
        // Multiple lines - treat first as heading if it ends with colon
        const firstLine = lines[0].trim()
        if (firstLine.endsWith(':')) {
          html += `<h3><strong>${firstLine}</strong></h3>`
          // Rest as list items or paragraphs
          if (lines.length > 1) {
            const hasListItems = lines.slice(1).some(line => line.trim().match(/^[-•*]\s/))
            if (hasListItems) {
              html += '<ul>'
              for (let i = 1; i < lines.length; i++) {
                const item = lines[i].trim().replace(/^[-•*]\s+/, '')
                if (item) html += `<li>${item}</li>`
              }
              html += '</ul>'
            } else {
              html += `<p>${lines.slice(1).join('<br>')}</p>`
            }
          }
        } else {
          // Regular paragraph with line breaks
          html += `<p>${lines.join('<br>')}</p>`
        }
      }
    }
    
    return html || `<p>${text}</p>`
  }

  const replaceTemplateVariables = (content: string, formData: any): string => {
    let replacedContent = content
    
    // Replace common variables with form data or placeholders
    const variables: { [key: string]: string } = {
      '{job_title}': formData.title || '[Job Title]',
      '{location}': formData.location || '[Location]',
      '{company_name}': formData.company_name || '[Company Name]',
      '{department}': formData.department || '[Department]',
      '{employment_type}': formData.employment_type || '[Employment Type]',
      '{experience_min}': formData.experience_min ? `${formData.experience_min}` : '[Min Years]',
      '{experience_max}': formData.experience_max ? `${formData.experience_max}` : '[Max Years]',
      '{salary_min}': formData.salary_min ? `${formData.salary_min}` : '[Min Salary]',
      '{salary_max}': formData.salary_max ? `${formData.salary_max}` : '[Max Salary]',
      '{experience}': formData.experience_min && formData.experience_max 
        ? `${formData.experience_min}-${formData.experience_max}`
        : formData.experience_min || '[Experience]',
      '{salary_range}': formData.salary_min && formData.salary_max
        ? `${formData.salary_min}-${formData.salary_max}`
        : '[Salary Range]',
    }
    
    // Replace each variable
    for (const [key, value] of Object.entries(variables)) {
      replacedContent = replacedContent.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value)
    }
    
    return replacedContent
  }

  const handleJDUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

  const fileName = file.name.toLowerCase()
  
  // Validate file type - .txt, .docx, and .pdf are supported
  if (!fileName.endsWith('.txt') && !fileName.endsWith('.docx') && !fileName.endsWith('.pdf')) {
    toast({
      title: 'Invalid File Type',
      description: 'Please upload a .txt, .docx, or .pdf file',
      variant: 'destructive',
    })
    e.target.value = ''
    return
  }

    setUploadingJD(true)
    
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      
      // Use server action to parse the file
      console.log('[v0] Importing parseJD from server action')
      const { parseJD } = await import('@/app/actions/parse-jd')
      console.log('[v0] Calling parseJD with file:', file.name, 'type:', file.type)
      const result = await parseJD(uploadFormData)
      console.log('[v0] parseJD result:', result.success ? 'SUCCESS' : 'FAILED', result.error || '')
      
      if (!result.success) {
        toast({
          title: 'Upload Failed',
          description: result.error || 'Failed to parse document',
          variant: 'destructive',
        })
        return
      }
      
      setFormData(prev => ({ ...prev, description: result.content || '' }))
      
      toast({
        title: 'JD Uploaded Successfully',
        description: 'Job description has been loaded with formatting preserved',
        className: 'bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white border-0',
      })
    } catch (error) {
      console.error('[v0] Error uploading JD:', error)
      toast({
        title: 'Upload Failed',
        description: 'Failed to read job description file',
        variant: 'destructive',
      })
    } finally {
      setUploadingJD(false)
      // Reset file input
      e.target.value = ''
    }
  }

  const handleCreateClient = async () => {
    if (!newClientForm.company_name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a company name',
        variant: 'destructive'
      })
      return
    }

    try {
      const supabase = createClient()
      const userStr = localStorage.getItem('hyrix_user')
      if (!userStr) return

      const user = JSON.parse(userStr)
      const { data: orgData } = await supabase
        .from('organization')
        .select('id')
        .eq('email', user.email)
        .single()

      if (!orgData) return

      const { data: newClient, error } = await supabase
        .from('clients')
        .insert({
          organization_id: orgData.id,
          company_name: newClientForm.company_name.trim(),
          email: newClientForm.email.trim(),
          phone: newClientForm.phone.trim(),
          address: newClientForm.address.trim(),
          industry: newClientForm.industry.trim(),
          gst: newClientForm.gst.trim(),
          status: 'active'
        })
        .select()
        .single()

      if (error) {
        console.error('[v0] Error creating client:', error)
        toast({
          title: 'Error',
          description: 'Failed to create client',
          variant: 'destructive'
        })
        return
      }

      setClients([...clients, { id: newClient.id, company_name: newClient.company_name }])
      setFormData({ ...formData, client_name: newClient.company_name })
      setClientInput('')
      setNewClientForm({
        company_name: '',
        email: '',
        phone: '',
        address: '',
        industry: '',
        gst: ''
      })
      setIsClientDialogOpen(false)

      toast({
        title: 'Success',
        description: 'Client created successfully'
      })
    } catch (error) {
      console.error('[v0] Error creating client:', error)
      toast({
        title: 'Error',
        description: 'Failed to create client',
        variant: 'destructive'
      })
    }
  }

  const handleSaveDraft = async (silent = false) => {
    console.log('[v0] handleSaveDraft: Starting to save draft', silent ? '(silent mode)' : '')
    if (!silent) setLoading(true)
    const supabase = createClient()
    
    // Get logged-in user's organization
    const userStr = localStorage.getItem('hyrix_user')
    console.log('[v0] handleSaveDraft: User data from localStorage:', userStr ? 'Found' : 'NOT FOUND')
    let organizationId = null
    let creatorEmail = null
    
    if (userStr) {
      const user = JSON.parse(userStr)
      creatorEmail = user.email
      console.log('[v0] handleSaveDraft: User email:', creatorEmail, 'Role:', user.role)
      
      // For recruiters and hiring managers, get organization from org_team table
      if (user.role === 'recruiter' || user.role === 'hiring_manager') {
        const { data: teamData, error: teamError } = await supabase
          .from('org_team')
          .select('organization_id')
          .eq('email', creatorEmail)
          .maybeSingle()
        
        if (teamError) {
          console.error('[v0] handleSaveDraft: Error fetching from org_team:', teamError)
        }
        organizationId = teamData?.organization_id
        console.log('[v0] handleSaveDraft: Recruiter/Hiring Manager organization ID from org_team:', organizationId)
      } else {
        // For admins/super_admins, get organization from organization table
        const { data: orgData } = await supabase
          .from('organization')
          .select('id')
          .eq('email', creatorEmail)
          .maybeSingle()
        organizationId = orgData?.id
        console.log('[v0] handleSaveDraft: Admin organization ID from organization table:', organizationId)
      }
    }
  
  // Check if client name is new and save it to clients table
  if (formData.client_name && organizationId) {
    const existingClient = clients.find(c => 
      c.company_name.toLowerCase() === formData.client_name.toLowerCase()
    )
    
    if (!existingClient) {
      console.log('[v0] handleSaveDraft: Saving new client:', formData.client_name)
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          organization_id: organizationId,
          company_name: formData.client_name,
          email: '', // Can be filled later from settings
          phone: '',
          address: '',
          industry: '',
          status: 'active'
        })
        .select()
        .single()
      
      if (clientError) {
        console.error('[v0] handleSaveDraft: Error saving new client:', clientError)
      } else {
        console.log('[v0] handleSaveDraft: New client saved successfully')
        // Add to local clients list so it appears in dropdown immediately
        if (newClient) {
          setClients([...clients, { id: newClient.id, company_name: newClient.company_name }])
        }
      }
    }
  }
  
  // Use user-entered Job ID, or auto-generate for new jobs
  const customJobId = isEditMode && editJobId ? null : (formData.job_id.trim() || generateJobId())
    
    // creatorEmail is already set above from hyrix_user
    console.log('[v0] handleSaveDraft: Creator email for created_by:', creatorEmail)
    
    // Map form data to database schema - include all fields
    const jobData: any = {
      title: formData.title,
      description: formData.description,
      location: formData.location,
      employment_type: formData.position_type,
      salary_range: formData.salary_min && formData.salary_max 
        ? `₹${formatIndianNumber(formData.salary_min)} - ₹${formatIndianNumber(formData.salary_max)} / ${formData.salary_type}`
        : 'As per company standards',
      department: formData.department,
      remote_option: formData.remote_option,
      education: formData.education,
      skill_level: formData.skill_level,
      visibility: formData.visibility,
      organization_id: organizationId,
      status: 'draft',
      close_date: formData.close_date,
      client_name: formData.client_name,
      account_manager: formData.account_manager,
      assigned_recruiter: formData.assigned_recruiter,
      hiring_manager: formData.hiring_manager,
      contact_name: formData.contact_name,
      industry: formData.industry,
      min_experience: formData.min_experience,
      max_experience: formData.max_experience,
      about_company: formData.about_company,
      requirements: formData.requirements,
      benefits: formData.benefits,
      work_environment: formData.work_environment,
      // Additional fields
    responsibilities: formData.responsibilities,
    company_info: formData.company_info,
    application_process: formData.application_process,
    keywords: formData.keywords,
    skills_required: skills.length > 0 ? skills.join(', ') : null,
    job_opening_status: 'draft', // Always set to draft when saving as draft
    updated_at: new Date().toISOString()
  }
    
    // Add created_by only for new jobs (not updates)
    if (!isEditMode && creatorEmail) {
      jobData.created_by = creatorEmail
    }
    
    // Only add job_id for new jobs
    if (customJobId) {
      jobData.job_id = customJobId
    }
  
  let error
  if (isEditMode && editJobId) {
    // UPDATE existing job when in edit mode
    console.log('[v0] handleSaveDraft: Updating existing job (draft) with ID:', editJobId)
    const result = await supabase
      .from('jobs')
      .update(jobData)
      .eq('id', editJobId)
    error = result.error
  } else {
    // INSERT new job as draft when creating
    console.log('[v0] handleSaveDraft: Inserting new draft job')
    const result = await supabase.from('jobs').insert([jobData])
    error = result.error
  }

    if (error) {
      console.log('[v0] Error saving draft:', error)
      if (!silent) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to save draft',
          variant: 'destructive'
        })
      }
    } else {
      if (!silent) {
        toast({
          title: 'Success',
          description: 'Job saved as draft successfully!'
        })
        
        // Navigate based on user role
        if (userStr) {
          const user = JSON.parse(userStr)
          if (user.role === 'recruiter') {
            router.push('/recruiter/postings')
          } else if (user.role === 'hiring_manager') {
            router.push('/hiring-manager')
          } else {
            router.push('/admin?tab=jobs')
          }
        } else {
          router.push('/admin?tab=jobs')
        }
      } else {
        console.log('[v0] Draft auto-saved silently')
      }
    }
    if (!silent) setLoading(false)
  }

  const handlePublish = async () => {
    setLoading(true)
    
    try {
      if (!formData.title.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Job title is required',
          variant: 'destructive'
        })
        setLoading(false)
        return
      }
      
      // Location is only required if the job is not remote
      if (!formData.location.trim() && formData.remote_option !== 'remote') {
        toast({
          title: 'Validation Error',
          description: 'Location is required for office and hybrid positions',
          variant: 'destructive'
        })
        setLoading(false)
        return
      }
      
      // Validate description minimum 100 characters only for new jobs (strip HTML tags for count)
      if (!isEditMode) {
        const descriptionText = formData.description.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
        if (descriptionText.length < 100) {
          toast({
            title: 'Validation Error',
            description: `Job description must be at least 100 characters. Currently ${descriptionText.length} characters.`,
            variant: 'destructive'
          })
          setLoading(false)
          return
        }
      }
      
      // Get logged-in user's organization (only required for new job creation)
      const userStr = localStorage.getItem('hyrix_user')
      let organizationId = null
      
      if (userStr) {
        const user = JSON.parse(userStr)
        
        if (user.role === 'recruiter' || user.role === 'hiring_manager') {
          const { data: teamData } = await supabase
            .from('org_team')
            .select('organization_id')
            .eq('email', user.email)
            .maybeSingle()
          organizationId = teamData?.organization_id
        } else {
          const { data: orgData } = await supabase
            .from('organization')
            .select('id')
            .eq('email', user.email)
            .maybeSingle()
          organizationId = orgData?.id
        }
      }
      
      // For new jobs, organization is required. For edits, skip this check.
      if (!isEditMode && !organizationId) {
        toast({
          title: 'Error',
          description: 'Could not determine your organization. Please try logging in again.',
          variant: 'destructive'
        })
        setLoading(false)
        return
      }
      
      // Check if client name is new and save it to clients table
      if (formData.client_name && organizationId) {
        const existingClient = clients.find(c => 
          c.company_name.toLowerCase() === formData.client_name.toLowerCase()
        )
        
        if (!existingClient) {
          const { data: newClient, error: clientError } = await supabase
            .from('clients')
            .insert({
              organization_id: organizationId,
              company_name: formData.client_name,
              email: '',
              phone: '',
              address: '',
              industry: '',
              status: 'active'
            })
            .select()
            .single()
          
          if (!clientError && newClient) {
            if (newClient) {
              setClients([...clients, { id: newClient.id, company_name: newClient.company_name }])
            }
          }
        }
      }
      
      // Map form data to database schema - include all fields
      const jobData: any = {
        title: formData.title.trim(),
        description: formData.description,
        location: formData.location.trim(),
        employment_type: formData.position_type,
        salary_range: formData.salary_min && formData.salary_max 
          ? `₹${formatIndianNumber(formData.salary_min)} - ₹${formatIndianNumber(formData.salary_max)} / ${formData.salary_type}`
          : 'As per company standards',
        department: formData.department,
        ...(organizationId ? { organization_id: organizationId } : {}),
        status: 'active', // Always set to 'active' when publishing
        updated_at: new Date().toISOString(),
        visibility: formData.visibility,
        remote_option: formData.remote_option,
        education: formData.education,
        skill_level: formData.skill_level,
        close_date: formData.close_date,
        client_name: formData.client_name,
        account_manager: formData.account_manager,
        assigned_recruiter: formData.assigned_recruiter,
        hiring_manager: formData.hiring_manager,
        contact_name: formData.contact_name,
        industry: formData.industry,
        min_experience: formData.min_experience,
        max_experience: formData.max_experience,
        about_company: formData.about_company,
        requirements: formData.requirements,
        benefits: formData.benefits,
        work_environment: formData.work_environment,
    responsibilities: formData.responsibilities,
    company_info: formData.company_info,
    application_process: formData.application_process,
    keywords: formData.keywords,
    skills_required: skills.length > 0 ? skills.join(', ') : null,
    job_opening_status: 'active' // Always set to 'active' when publishing
  }
      
      // Use user-entered Job ID or auto-generate, and add created_by for new jobs
      if (!isEditMode) {
        const customJobId = formData.job_id.trim() || generateJobId()
        jobData.job_id = customJobId
        
        // Get user email for created_by
        const userStr2 = localStorage.getItem('hyrix_user')
        if (userStr2) {
          try {
            const user2 = JSON.parse(userStr2)
            jobData.created_by = user2.email
          } catch (e) {
            // ignore
          }
        }
      }
      
      // Only add optional fields if they have values
      if (formData.description && formData.description.trim()) {
        jobData.description = formData.description
      }
      
      if (formData.salary_min && formData.salary_max) {
        jobData.salary_range = `₹${formatIndianNumber(formData.salary_min)} - ₹${formatIndianNumber(formData.salary_max)} / ${formData.salary_type}`
      }
      
      if (formData.requirements && formData.requirements.trim()) {
        jobData.requirements = formData.requirements
      }
      
      if (formData.department && formData.department.trim()) {
        jobData.department = formData.department
      }
      
      if (formData.client_name && formData.client_name.trim()) {
        jobData.client_name = formData.client_name
      }
      
      if (formData.account_manager && formData.account_manager.trim()) {
        jobData.account_manager = formData.account_manager
      }
      
      if (formData.assigned_recruiter.length > 0) {
        jobData.assigned_recruiter = formData.assigned_recruiter.join(', ')
      }
      
      if (formData.industry && formData.industry.trim()) {
        jobData.industry = formData.industry
      }
      
      if (formData.contact_name.length > 0) {
        jobData.contact_name = formData.contact_name.join(', ')
      }
      
      // Add company-related fields
      if (formData.about_company && formData.about_company.trim()) {
        jobData.about_company = formData.about_company
      }
      
      if (formData.company_size && formData.company_size.trim()) {
        jobData.company_size = formData.company_size
      }
      
      if (formData.company_website && formData.company_website.trim()) {
        jobData.company_website = formData.company_website
      }
      
      if (formData.benefits && formData.benefits.trim()) {
        jobData.benefits = formData.benefits
      }
      
      if (formData.work_environment && formData.work_environment.trim()) {
        jobData.work_environment = formData.work_environment
      }
      
      // Add additional fields
      if (formData.responsibilities && formData.responsibilities.trim()) {
        jobData.responsibilities = formData.responsibilities
      }
      
      if (formData.company_info && formData.company_info.trim()) {
        jobData.company_info = formData.company_info
      }
      
      if (formData.application_process && formData.application_process.trim()) {
        jobData.application_process = formData.application_process
      }
      
      if (formData.keywords && formData.keywords.trim()) {
        jobData.keywords = formData.keywords
      }
      
      // Note: job_opening_status is already set to 'active' in jobData above (line ~1333)
      // Do NOT override it here with formData.job_opening_status which may still be 'draft'
      
      let data, error
      
      if (isEditMode && editJobId) {
        console.log('[v0] UPDATE JOB - editJobId:', editJobId, '| fields:', Object.keys(jobData))
        const result = await supabase
          .from('jobs')
          .update(jobData)
          .eq('id', editJobId)
          .select()
        console.log('[v0] UPDATE result - data:', result.data, '| error:', result.error)
        data = result.data
        error = result.error
      } else {
        const result = await supabase
          .from('jobs')
          .insert([jobData])
          .select()
        data = result.data
        error = result.error
      }

      if (error) {
        console.error(`[v0] Error ${isEditMode ? 'updating' : 'publishing'} job:`, error)
        toast({
          title: 'Error',
          description: error.message || `Failed to ${isEditMode ? 'update' : 'publish'} job`,
          variant: 'destructive'
        })
        setLoading(false)
      } else {
        setLoading(false)

        if (isEditMode) {
          // For edit mode: show success toast and redirect back to jobs list
          toast({
            title: 'Job updated successfully!',
            duration: 4000,
          })
          setTimeout(() => {
            const target = userRole === 'recruiter' ? '/recruiter?tab=jobs' : '/admin?tab=jobs'
            router.push(target)
          }, 1500)
        } else {
          // For new jobs: go to step 4 (success/share page)
          const jobId = data?.[0]?.id || editJobId
          setPublishedJobId(jobId)
          setIsPublished(true)
          setCurrentStep(4)
        }
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      })
      setLoading(false)
    }
  }

  // Check permissions - Create Job for new, Edit Job for editing
  const requiredPermission = isEditMode ? 'Edit Job' : 'Create Job'
  if (!permissionsLoading && !hasModuleAccess(requiredPermission)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-background">
        <Lock className="h-16 w-16 text-gray-400" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-sm text-gray-600">
            You don't have permission to {isEditMode ? 'edit' : 'create'} jobs.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
        </Button>
      </div>
    )
  }

  return (
  <div className="flex h-screen overflow-hidden bg-background">
      {/* Left Sidebar - Collapsible */}
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} border-r bg-white shadow-sm flex-shrink-0 transition-all duration-300`}>
        <div className="flex h-full flex-col">
          {/* Logo - Always Visible */}
          <div className="flex h-16 items-center border-b bg-gradient-to-r from-white to-blue-50/30 relative px-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white font-bold text-sm shadow-lg shadow-[#4F46E5]/20 flex-shrink-0">
                HX
              </div>
  {!isSidebarCollapsed && (
  <div>
  <span className="text-lg font-bold bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent">
  Hyrix
  </span>
  <p className="text-xs text-gray-500 font-medium">
    {userRole === 'super_admin' ? 'Super Admin Portal' : userRole === 'recruiter' ? 'Recruiter Portal' : 'Admin Portal'}
  </p>
  </div>
  )}
            </div>
            {/* Toggle Button - Enhanced Visibility */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="absolute -right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] border-2 border-white shadow-xl hover:shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-all z-50"
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="h-5 w-5 font-bold stroke-[3]" />
              ) : (
                <ChevronLeft className="h-5 w-5 font-bold stroke-[3]" />
              )}
            </button>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = item.id === 'jobs'
              return (
                <button
                  key={item.id}
                  onClick={() => router.push(item.href)}
                  className={`flex w-full items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isSidebarCollapsed && item.label}
                </button>
              )
            })}
          </nav>

          <div className="border-t p-4 space-y-3">
            {isSidebarCollapsed ? (
              <div className="flex flex-col items-center gap-3">
                {/* Organization Icon - Visible when collapsed */}
                <div className="flex justify-center" title={userEmail || 'admin@jobkarle.com'}>
                  {organizationLogo ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white border-2 border-gray-200 flex-shrink-0 hover:border-[#4F46E5] transition-all cursor-pointer">
                      <img
                        src={organizationLogo || "/placeholder.svg"}
                        alt="Organization"
                        className="w-full h-full object-contain p-0.5"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center text-white text-sm font-bold flex-shrink-0 hover:scale-110 transition-all cursor-pointer shadow-lg">
                      {userEmail?.charAt(0).toUpperCase() || 'A'}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-2">
                {organizationLogo ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-white border border-gray-200 flex-shrink-0">
                    <img
                      src={organizationLogo || "/placeholder.svg"}
                      alt="Organization"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {userEmail?.charAt(0).toUpperCase() || 'A'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 truncate">
                    {userEmail || 'admin@jobkarle.com'}
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={() => {
                localStorage.removeItem('hyrix_user')
                router.push('/login')
              }}
              className={`flex w-full items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} rounded-xl px-4 py-3 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all`}
              title={isSidebarCollapsed ? 'Logout' : undefined}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!isSidebarCollapsed && 'Logout'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex-shrink-0 h-16 border-b bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80 shadow-sm z-10">
          <div className="flex h-full items-center justify-between px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <Menu className="h-5 w-5" />
  </Button>
  <div>
  <h1 className="text-base sm:text-xl font-semibold">{isEditMode ? 'Edit Job Posting' : 'Create New Job'}</h1>
  <p className="text-xs sm:text-sm text-muted-foreground">Step {currentStep} of 5</p>
  </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleSaveDraft(false)} disabled={loading} className="hidden sm:flex bg-transparent">
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
              <Button variant="outline" size="icon" onClick={() => handleSaveDraft(false)} disabled={loading} className="sm:hidden bg-transparent">
                <Save className="h-4 w-4" />
              </Button>
              {(currentStep === 3 || isEditMode) && (
                  <Button
                    className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90"
                    onClick={handlePublish}
                    disabled={loading}
                  >
                    <span className="hidden sm:inline">{isEditMode ? 'Update Job' : 'Publish Job'}</span>
                    <span className="sm:hidden">{isEditMode ? 'Update' : 'Publish'}</span>
                  </Button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-gradient-to-br from-blue-50/30 via-white to-purple-50/20">
          <div className="max-w-3xl mx-auto">
            {/* Main Form Area */}
            <div className="w-full">
              {/* Step Progress */}
              <div className="mb-8 overflow-x-auto pb-2">
                <div className="flex items-center justify-between min-w-max px-2">
                  {steps.map((step, index) => {
                    const Icon = step.icon
                    const isActive = step.number === currentStep
                    const isCompleted = step.number < currentStep
                    
                    return (
                      <div key={step.number} className="flex items-center">
                        <button
                          onClick={() => setCurrentStep(step.number)}
                          className="flex flex-col items-center cursor-pointer group"
                        >
                          <div
                            className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border-2 transition-all ${
                              isActive
                                ? 'border-[#4F46E5] bg-[#4F46E5] text-white shadow-md'
                                : isCompleted
                                ? 'border-green-500 bg-green-500 text-white'
                                : 'border-gray-300 bg-background text-muted-foreground group-hover:border-[#4F46E5]/50 group-hover:bg-[#4F46E5]/5'
                            }`}
                          >
                            {isCompleted ? <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                          </div>
                          <p className={`mt-1.5 text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap ${
                            isActive ? 'text-[#4F46E5]' : 'text-muted-foreground group-hover:text-[#4F46E5]'
                          }`}>
                            {step.label}
                          </p>
                        </button>
                        {index < steps.length - 1 && (
                          <ChevronRight className="mx-2 sm:mx-4 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Step Content */}
              <div className="bg-white rounded-lg border p-4 sm:p-6">
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Job Details</h2>
                      <p className="text-muted-foreground">Provide basic information about the position</p>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor="title" className="text-sm font-medium">
                            Position Title *
                          </Label>
                          <Input
                            id="title"
                            placeholder="e.g. Customer Service Representative"
                            value={formData.title}
                            onChange={(e) => {
                              setFormData({ ...formData, title: e.target.value })
                            }}
                            className="text-base"
                          />
                          <p className="text-xs text-muted-foreground">Enter the title of the job position</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="job_id" className="text-sm font-medium">
                            Job ID
                          </Label>
                          <Input
                            id="job_id"
                            placeholder="Auto-generated if empty"
                            value={formData.job_id}
                            onChange={(e) => {
                              setFormData({ ...formData, job_id: e.target.value })
                            }}
                            className="text-base"
                            disabled={isEditMode}
                          />
                          <p className="text-xs text-muted-foreground">
                            Custom or auto-generated
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2" data-dropdown-container>
                          <Label htmlFor="client_name">Client Name</Label>
                          <div className="relative">
                            <Input
                              id="client_name"
                              placeholder="Type or select client"
                              value={clientInput || formData.client_name}
                              onChange={(e) => {
                                setClientInput(e.target.value)
                                setFormData({ ...formData, client_name: e.target.value })
                                setShowClientDropdown(true)
                              }}
                              onFocus={() => setShowClientDropdown(true)}
                              className="text-base pr-10"
                            />
                            {/* Add New Client button - Admin only */}
                            {(userRole === 'admin' || userRole === 'super_admin') && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsClientDialogOpen(true)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 rounded-full hover:bg-blue-50"
                                title="Add new client"
                              >
                                <Plus className="h-4 w-4 text-blue-600" />
                              </Button>
                            )}
                            {showClientDropdown && clients.length > 0 && (
                              <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {clients
                                  .filter(client => {
                                    const searchTerm = (clientInput || formData.client_name || '').toLowerCase()
                                    return !searchTerm || client.company_name.toLowerCase().includes(searchTerm)
                                  })
                                  .map(client => (
                                    <div
                                      key={client.id}
                                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                      onClick={() => {
                                        setFormData({ 
                                          ...formData, 
                                          client_name: client.company_name,
                                          about_company: client.company_overview || formData.about_company
                                        })
                                        setClientInput('')
                                        setShowClientDropdown(false)
                                        
                                        // Parse client emails (stored as JSON array or single email)
                                        let clientEmails: string[] = []
                                        try {
                                          if (client.email) {
                                            const parsed = JSON.parse(client.email)
                                            clientEmails = Array.isArray(parsed) ? parsed : [client.email]
                                          }
                                        } catch {
                                          clientEmails = client.email ? [client.email] : []
                                        }
                                        setSelectedClientEmails(clientEmails)
                                        
                                        // Parse client contact names (stored as JSON array)
                                        let clientContactNames: string[] = []
                                        try {
                                          if ((client as any).contact_name) {
                                            const parsed = JSON.parse((client as any).contact_name)
                                            clientContactNames = Array.isArray(parsed) ? parsed.filter(Boolean) : []
                                          }
                                        } catch {
                                          clientContactNames = []
                                        }
                                        console.log('[v0] Client contact names parsed:', clientContactNames)
                                        setSelectedClientContactNames(clientContactNames)
                                      }}
                                    >
                                      {client.company_name}
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2" data-dropdown-container>
                          <Label htmlFor="contact_name">
                            <span>Contact Name</span>
                            {formData.contact_name.length > 0 && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({formData.contact_name.length} selected)
                              </span>
                            )}
                          </Label>
                          
                          <div className="relative">
                            {/* Combined view: tags + input in single container */}
                            <div 
                              className="min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-text"
                              onClick={() => {
                                document.getElementById('contact_name_hidden')?.focus()
                                setShowContactDropdown(true)
                              }}
                            >
                              <div className="flex flex-wrap gap-2 items-center">
                                {/* Selected contacts as inline tags */}
                                {formData.contact_name.map((contact, idx) => (
                                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-sm rounded">
                                    {contact}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setFormData({ 
                                          ...formData, 
                                          contact_name: formData.contact_name.filter(c => c !== contact) 
                                        })
                                      }}
                                      className="hover:text-blue-900 font-semibold"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                                {/* Inline input field */}
                                <input
                                  id="contact_name_hidden"
                                  type="text"
                                  placeholder={formData.contact_name.length === 0 ? "Type name or select from list" : ""}
                                  value={contactNameInput}
                                  onChange={(e) => {
                                    setContactNameInput(e.target.value)
                                    setShowContactDropdown(true)
                                  }}
                                  onFocus={() => setShowContactDropdown(true)}
                                  className="flex-1 min-w-[120px] outline-none bg-transparent"
                                />
                                <UserCircle className="h-5 w-5 text-gray-400 ml-auto" />
                              </div>
                            </div>
                            {showContactDropdown && (
                              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {(() => {
                            const searchValue = contactNameInput.toLowerCase()
                            
                            // If a client is selected but has no contact names, show message
                            const clientSelected = formData.client_name && formData.client_name.trim() !== ''
                            const hasClientContacts = selectedClientContactNames.length > 0
                            
                            // Use selected client contact names if available, or contact history if no client selected
                            // Don't use contact history for clients with no contacts
                            const contactSource = hasClientContacts 
                              ? selectedClientContactNames 
                              : (clientSelected ? [] : contactHistory)
                            
                            const filteredContacts = contactNameInput
                              ? contactSource.filter(contact =>
                                  contact.toLowerCase().includes(searchValue) &&
                                  !formData.contact_name.includes(contact)
                                )
                              : contactSource.filter(contact => !formData.contact_name.includes(contact))
                                  
                                  const isExactMatch = contactSource.some(c => 
                                    c.toLowerCase() === contactNameInput.toLowerCase()
                                  )
                                  
                                  return (
                                    <>
                                      {clientSelected && !hasClientContacts && filteredContacts.length === 0 ? (
                                        <div className="px-3 py-3 text-sm text-gray-500 text-center">
                                          No contact persons available for this client. Please add contact details in Client Management.
                                        </div>
                                      ) : filteredContacts.length === 0 && contactNameInput ? (
                                        <div className="px-3 py-2 text-sm text-gray-500">No matching contacts found</div>
                                      ) : null}
                                      
                                      {filteredContacts.map((contact, idx) => (
                                        <label
                                          key={idx}
                                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={formData.contact_name.includes(contact)}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                setFormData({ 
                                                  ...formData, 
                                                  contact_name: [...formData.contact_name, contact] 
                                                })
                                                setContactNameInput('')
                                              }
                                            }}
                                            className="rounded border-gray-300"
                                          />
                                          <UserCircle className="h-4 w-4 text-gray-400" />
                                          <span className="text-sm">{contact}</span>
                                        </label>
                                      ))}
                                      {contactNameInput.trim() && !isExactMatch && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newContact = contactNameInput.trim()
                                            setFormData({ 
                                              ...formData, 
                                              contact_name: [...formData.contact_name, newContact] 
                                            })
                                            setContactNameInput('')
                                          }}
                                          className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2 border-t text-[#4F46E5] font-medium"
                                        >
                                          <Plus className="h-4 w-4" />
                                          Add "{contactNameInput.trim()}"
                                        </button>
                                      )}
                                      {filteredContacts.length === 0 && !contactNameInput.trim() && formData.contact_name.length === 0 && (
                                        <div className="px-3 py-2 text-sm text-muted-foreground">
                                          No contacts available
                                        </div>
                                      )}
                                    </>
                                  )
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Add New Client</DialogTitle>
                            <DialogDescription>
                              Create a new client for job postings. All fields are saved to the clients table.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor="new-client-company">Company Name *</Label>
                                <Input
                                  id="new-client-company"
                                  placeholder="Enter company name"
                                  value={newClientForm.company_name}
                                  onChange={(e) => setNewClientForm({ ...newClientForm, company_name: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="new-client-email">Email</Label>
                                <Input
                                  id="new-client-email"
                                  type="email"
                                  placeholder="contact@company.com"
                                  value={newClientForm.email}
                                  onChange={(e) => setNewClientForm({ ...newClientForm, email: e.target.value })}
                                />
                              </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor="new-client-phone">Phone</Label>
                                <Input
                                  id="new-client-phone"
                                  placeholder="+91 98765 43210"
                                  value={newClientForm.phone}
                                  onChange={(e) => setNewClientForm({ ...newClientForm, phone: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2" data-dropdown-container>
                                <Label htmlFor="new-client-industry">Industry</Label>
                                <div className="relative">
                                  <Input
                                    id="new-client-industry"
                                    placeholder="Type to search industries..."
                                    value={clientIndustryInput || newClientForm.industry}
                                    onChange={(e) => {
                                      setClientIndustryInput(e.target.value)
                                      setNewClientForm({ ...newClientForm, industry: e.target.value })
                                      setShowClientIndustryDropdown(true)
                                    }}
                                    onFocus={() => setShowClientIndustryDropdown(true)}
                                  />
                                  {showClientIndustryDropdown && industries.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                      {industries
                                        .filter(industry => {
                                          const searchTerm = (clientIndustryInput || newClientForm.industry || '').toLowerCase()
                                          return !searchTerm || industry.name.toLowerCase().includes(searchTerm)
                                        })
                                        .map(industry => (
                                          <div
                                            key={industry.id}
                                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                            onClick={() => {
                                              setNewClientForm({ ...newClientForm, industry: industry.name })
                                              setClientIndustryInput('')
                                              setShowClientIndustryDropdown(false)
                                            }}
                                          >
                                            {industry.name}
                                          </div>
                                        ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor="new-client-address">Address</Label>
                                <Input
                                  id="new-client-address"
                                  placeholder="Full address"
                                  value={newClientForm.address}
                                  onChange={(e) => setNewClientForm({ ...newClientForm, address: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="new-client-gst">GST Number</Label>
                                <Input
                                  id="new-client-gst"
                                  placeholder="22AAAAA0000A1Z5"
                                  value={newClientForm.gst}
                                  onChange={(e) => setNewClientForm({ ...newClientForm, gst: e.target.value })}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-3 justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsClientDialogOpen(false)
                                setNewClientForm({
                                  company_name: '',
                                  email: '',
                                  phone: '',
                                  address: '',
                                  industry: '',
                                  gst: ''
                                })
                              }}
                            >
                              Cancel
                            </Button>
                            <Button type="button" onClick={handleCreateClient}>
                              Create Client
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2" data-dropdown-container>
                          <Label htmlFor="account_manager">Account Manager</Label>
                          <div className="relative">
                            <Input
                              id="account_manager"
                              placeholder="Type or select account manager"
                              value={accountManagerInput || formData.account_manager}
                              onChange={(e) => {
                                setAccountManagerInput(e.target.value)
                                setShowAccountManagerDropdown(true)
                              }}
                              onFocus={() => setShowAccountManagerDropdown(true)}
                            />
                            {showAccountManagerDropdown && (
                              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {(() => {
                                  const searchValue = accountManagerInput.toLowerCase()
                                  const filteredManagers = accountManagerInput
                                    ? accountManagers.filter(manager => 
                                        manager.name.toLowerCase().includes(searchValue)
                                      )
                                    : accountManagers
                                  
                                  const isExactMatch = accountManagers.some(m => 
                                    m.name.toLowerCase() === accountManagerInput.toLowerCase()
                                  )
                                  
                                  return (
                                    <>
                                      {filteredManagers.map((manager) => (
                                        <button
                                          key={manager.id}
                                          type="button"
                                          onClick={() => {
                                            setFormData({ ...formData, account_manager: manager.name })
                                            setAccountManagerInput('')
                                            setShowAccountManagerDropdown(false)
                                          }}
                                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                                        >
                                          <UserCircle className="h-4 w-4 text-gray-400" />
                                          <span>{manager.name}</span>
                                        </button>
                                      ))}
                                      {accountManagerInput.trim() && !isExactMatch && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setFormData({ ...formData, account_manager: accountManagerInput.trim() })
                                            setAccountManagerInput('')
                                            setShowAccountManagerDropdown(false)
                                          }}
                                          className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2 border-t text-[#4F46E5] font-medium"
                                        >
                                          <Plus className="h-4 w-4" />
                                          Add "{accountManagerInput.trim()}"
                                        </button>
                                      )}
                                      {filteredManagers.length === 0 && !accountManagerInput.trim() && (
                                        <div className="px-3 py-2 text-sm text-muted-foreground">
                                          Type to add new account manager
                                        </div>
                                      )}
                                    </>
                                  )
                                })()}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2" data-dropdown-container>
                          <Label htmlFor="assigned_recruiter">
                            <span>Assigned Recruiter</span>
                            {formData.assigned_recruiter.length > 0 && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({formData.assigned_recruiter.length} selected)
                              </span>
                            )}
                          </Label>
                          
                          <div className="relative">
                            {/* Combined view: tags + input in single container */}
                            <div 
                              className="min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-text"
                              onClick={() => {
                                document.getElementById('assigned_recruiter_hidden')?.focus()
                                setShowRecruiterDropdown(true)
                              }}
                            >
                              <div className="flex flex-wrap gap-2 items-center">
                                {/* Selected recruiters as inline tags */}
                                {formData.assigned_recruiter.map((recruiter, idx) => (
                                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-sm rounded">
                                    {recruiter}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setFormData({ 
                                          ...formData, 
                                          assigned_recruiter: formData.assigned_recruiter.filter(r => r !== recruiter) 
                                        })
                                      }}
                                      className="hover:text-blue-900 font-semibold"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                                {/* Inline input field */}
                                <input
                                  id="assigned_recruiter_hidden"
                                  type="text"
                                  placeholder={formData.assigned_recruiter.length === 0 ? "Type name or select from list" : ""}
                                  value={recruiterInput}
                                  onChange={(e) => {
                                    setRecruiterInput(e.target.value)
                                    setShowRecruiterDropdown(true)
                                  }}
                                  onFocus={() => setShowRecruiterDropdown(true)}
                                  className="flex-1 min-w-[120px] outline-none bg-transparent"
                                />
                                <Users className="h-5 w-5 text-gray-400 ml-auto" />
                              </div>
                            </div>
                            {showRecruiterDropdown && (
                              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {(() => {
                                  const searchValue = recruiterInput.toLowerCase()
                                  const filteredRecruiters = recruiterInput
                                    ? recruiterHistory.filter(recruiter => 
                                        recruiter.toLowerCase().includes(searchValue) &&
                                        !formData.assigned_recruiter.includes(recruiter)
                                      )
                                    : recruiterHistory.filter(recruiter => !formData.assigned_recruiter.includes(recruiter))
                                  
                                  const isExactMatch = recruiterHistory.some(r => 
                                    r.toLowerCase() === recruiterInput.toLowerCase()
                                  )
                                  
                                  return (
                                    <>
                                      {filteredRecruiters.map((recruiter, idx) => (
                                        <label
                                          key={idx}
                                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={formData.assigned_recruiter.includes(recruiter)}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                setFormData({ 
                                                  ...formData, 
                                                  assigned_recruiter: [...formData.assigned_recruiter, recruiter] 
                                                })
                                                setRecruiterInput('')
                                              }
                                            }}
                                            className="rounded border-gray-300"
                                          />
                                          <UserCircle className="h-4 w-4 text-gray-400" />
                                          <span className="text-sm">{recruiter}</span>
                                        </label>
                                      ))}
                                      {recruiterInput.trim() && !isExactMatch && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newRecruiter = recruiterInput.trim()
                                            setFormData({ 
                                              ...formData, 
                                              assigned_recruiter: [...formData.assigned_recruiter, newRecruiter] 
                                            })
                                            setRecruiterInput('')
                                          }}
                                          className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2 border-t text-[#4F46E5] font-medium"
                                        >
                                          <Plus className="h-4 w-4" />
                                          Add "{recruiterInput.trim()}"
                                        </button>
                                      )}
                                      {filteredRecruiters.length === 0 && !recruiterInput.trim() && formData.assigned_recruiter.length === 0 && (
                                        <div className="px-3 py-2 text-sm text-muted-foreground">
                                          No recruiters available
                                        </div>
                                      )}
                                    </>
                                  )
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2" data-dropdown-container>
                          <Label htmlFor="hiring_manager">
                            <span>Assign Hiring Manager</span>
                            {formData.hiring_manager.length > 0 && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({formData.hiring_manager.length} selected)
                              </span>
                            )}
                          </Label>
                          
                          <div className="relative">
                            <div 
                              className="min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-text"
                              onClick={() => {
                                document.getElementById('hiring_manager_hidden')?.focus()
                                setShowHiringManagerDropdown(true)
                              }}
                            >
                              <div className="flex flex-wrap gap-2 items-center">
                                {formData.hiring_manager.map((manager, idx) => (
                                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-sm rounded">
                                    {manager}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setFormData({ 
                                          ...formData, 
                                          hiring_manager: formData.hiring_manager.filter(m => m !== manager) 
                                        })
                                      }}
                                      className="hover:text-purple-900 font-semibold"
                                    >
                                      {'×'}
                                    </button>
                                  </span>
                                ))}
                                <input
                                  id="hiring_manager_hidden"
                                  type="text"
                                  placeholder={formData.hiring_manager.length === 0 ? "Type name or select from list" : ""}
                                  value={hiringManagerInput}
                                  onChange={(e) => {
                                    setHiringManagerInput(e.target.value)
                                    setShowHiringManagerDropdown(true)
                                  }}
                                  onFocus={() => setShowHiringManagerDropdown(true)}
                                  className="flex-1 min-w-[120px] outline-none bg-transparent"
                                />
                                <UserCog className="h-5 w-5 text-gray-400 ml-auto" />
                              </div>
                            </div>
                            {showHiringManagerDropdown && (
                              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {(() => {
                                  const searchValue = hiringManagerInput.toLowerCase()
                                  const filteredManagers = hiringManagerInput
                                    ? hiringManagerHistory.filter(m => 
                                        m.toLowerCase().includes(searchValue) &&
                                        !formData.hiring_manager.includes(m)
                                      )
                                    : hiringManagerHistory.filter(m => !formData.hiring_manager.includes(m))
                                  
                                  const isExactMatch = hiringManagerHistory.some(m => 
                                    m.toLowerCase() === hiringManagerInput.toLowerCase()
                                  )
                                  
                                  return (
                                    <>
                                      {filteredManagers.map((manager, idx) => (
                                        <label
                                          key={idx}
                                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={formData.hiring_manager.includes(manager)}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                setFormData({ 
                                                  ...formData, 
                                                  hiring_manager: [...formData.hiring_manager, manager] 
                                                })
                                                setHiringManagerInput('')
                                              }
                                            }}
                                            className="rounded border-gray-300"
                                          />
                                          <UserCog className="h-4 w-4 text-gray-400" />
                                          <span className="text-sm">{manager}</span>
                                        </label>
                                      ))}
                                      {hiringManagerInput.trim() && !isExactMatch && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newManager = hiringManagerInput.trim()
                                            setFormData({ 
                                              ...formData, 
                                              hiring_manager: [...formData.hiring_manager, newManager] 
                                            })
                                            setHiringManagerInput('')
                                          }}
                                          className="w-full px-3 py-2 text-left text-sm hover:bg-purple-50 flex items-center gap-2 border-t text-[#7C3AED] font-medium"
                                        >
                                          <Plus className="h-4 w-4" />
                                          {'Add "' + hiringManagerInput.trim() + '"'}
                                        </button>
                                      )}
                                      {filteredManagers.length === 0 && !hiringManagerInput.trim() && formData.hiring_manager.length === 0 && (
                                        <div className="px-3 py-2 text-sm text-muted-foreground">
                                          No hiring managers available
                                        </div>
                                      )}
                                    </>
                                  )
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="position_type">Position Type *</Label>
                          <Select
                            value={formData.position_type}
                            onValueChange={(value) => setFormData({ ...formData, position_type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="full-time">Full-Time</SelectItem>
                              <SelectItem value="part-time">Part-Time</SelectItem>
                              <SelectItem value="contract">Contract</SelectItem>
                              <SelectItem value="internship">Internship</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="skill_level">Skill Level *</Label>
                          <Select
                            value={formData.skill_level}
                            onValueChange={(value) => setFormData({ ...formData, skill_level: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="entry">Entry Level</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="senior">Senior Level</SelectItem>
                              <SelectItem value="expert">Expert</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="remote_option">Work Location *</Label>
                          <Select
                            value={formData.remote_option}
                            onValueChange={(value) => setFormData({ ...formData, remote_option: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="office">Office Only</SelectItem>
                              <SelectItem value="remote">Remote</SelectItem>
                              <SelectItem value="hybrid">Hybrid</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="visibility">Job Visibility *</Label>
                          <Select
                            value={formData.visibility}
                            onValueChange={(value) => setFormData({ ...formData, visibility: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="public">Public</SelectItem>
                              <SelectItem value="private">Private</SelectItem>
                              <SelectItem value="internal">Internal Only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

  {formData.remote_option !== 'remote' && (
  <div className="space-y-2" data-dropdown-container>
  <Label htmlFor="location">Office Location</Label>
  <div className="relative">
    <Input
    id="location"
    placeholder="Enter city name (e.g., Bengaluru, Mumbai, Delhi)"
    value={locationInput || formData.location}
    onChange={(e) => {
      const value = e.target.value
      setLocationInput(value)
      setFormData({ ...formData, location: value })
      setShowLocationDropdown(true)
    }}
    onFocus={() => setShowLocationDropdown(true)}
    onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
    className="text-sm"
    />
    {showLocationDropdown && (
      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
        {cities
          .filter((city) => 
            city.name.toLowerCase().includes((locationInput || formData.location || '').toLowerCase())
          )
          .map((city) => (
            <button
              key={city.id}
              type="button"
              onClick={() => {
                setFormData({ ...formData, location: city.name })
                setLocationInput('')
                setShowLocationDropdown(false)
              }}
              className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
            >
              {city.name}
            </button>
          ))}
        {cities.filter((city) => 
          city.name.toLowerCase().includes((locationInput || formData.location || '').toLowerCase())
        ).length === 0 && (
          <div className="px-3 py-2 text-sm text-gray-500">No cities found</div>
        )}
      </div>
    )}
  </div>
  </div>
  )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2" data-dropdown-container>
                          <Label htmlFor="industry">Industry</Label>
                          <div className="relative">
                            <Input
                              id="industry"
                              placeholder="Type to search industries..."
                              value={industryInput || formData.industry}
                              onChange={(e) => {
                                setIndustryInput(e.target.value)
                                setFormData({ ...formData, industry: e.target.value })
                                setShowIndustryDropdown(true)
                              }}
                              onFocus={() => setShowIndustryDropdown(true)}
                              className="text-base"
                            />
                            {showIndustryDropdown && industries.length > 0 && (
                              <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {industries
                                  .filter(industry => {
                                    const searchTerm = (industryInput || formData.industry || '').toLowerCase()
                                    return !searchTerm || industry.name.toLowerCase().includes(searchTerm)
                                  })
                                  .map(industry => (
                                    <div
                                      key={industry.id}
                                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                      onClick={() => {
                                        setFormData({ ...formData, industry: industry.name })
                                        setIndustryInput('')
                                        setShowIndustryDropdown(false)
                                      }}
                                    >
                                      {industry.name}
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>

                  <div className="space-y-2" data-dropdown-container>
                    <Label htmlFor="department">Department</Label>
                    <div className="relative">
                      <Input
                        id="department"
                        placeholder="Type to search departments..."
                        value={departmentInput || formData.department}
                        onChange={(e) => {
                          const value = e.target.value
                          setDepartmentInput(value)
                          setFormData({ ...formData, department: value })
                          // Only show dropdown if user has typed something
                          setShowDepartmentDropdown(value.length > 0)
                        }}
                        onFocus={() => {
                          // Only show dropdown if there's already text in the field
                          if ((departmentInput || formData.department)?.length > 0) {
                            setShowDepartmentDropdown(true)
                          }
                        }}
                        className="text-base"
                      />
                      {showDepartmentDropdown && departments.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {(() => {
                            const searchTerm = (departmentInput || formData.department || '').toLowerCase()
                            // Filter departments by search term and industry if selected
                            let filteredDepts = departments.filter(dept => {
                              const matchesSearch = dept.department_name.toLowerCase().includes(searchTerm)
                              
                              // If an industry is selected, filter by that industry
                              if (formData.industry) {
                                const selectedIndustry = industries.find(ind => ind.name === formData.industry)
                                if (selectedIndustry) {
                                  return matchesSearch && dept.industry_id === selectedIndustry.id
                                }
                              }
                              
                              return matchesSearch
                            })
                            
                            // Remove duplicates by department name
                            const uniqueDepts = Array.from(
                              new Map(
                                filteredDepts.map(dept => [dept.department_name.toLowerCase(), dept])
                              ).values()
                            )
                            
                            if (uniqueDepts.length === 0) {
                              return (
                                <div className="px-3 py-2 text-sm text-gray-500">
                                  {formData.industry ? `No departments found for ${formData.industry}` : 'No departments found'}
                                </div>
                              )
                            }
                            
                            return uniqueDepts.map(dept => (
                              <div
                                key={dept.id}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                onClick={() => {
                                  setFormData({ ...formData, department: dept.department_name })
                                  setDepartmentInput(dept.department_name)
                                  setShowDepartmentDropdown(false)
                                }}
                              >
                                {dept.department_name}
                              </div>
                            ))
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                    </div>

                    {/* Years of Experience Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="min_experience">Minimum Experience (Years)</Label>
                        <Input
                          id="min_experience"
                          type="number"
                          min="0"
                          placeholder="e.g. 2"
                          value={formData.min_experience}
                          onChange={(e) => setFormData({ ...formData, min_experience: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="max_experience">Maximum Experience (Years)</Label>
                        <Input
                          id="max_experience"
                          type="number"
                          min="0"
                          placeholder="e.g. 5"
                          value={formData.max_experience}
                          onChange={(e) => setFormData({ ...formData, max_experience: e.target.value })}
                        />
                      </div>
                    </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="job_opening_status">Job Opening Status</Label>
                          <Select
                            value={formData.job_opening_status}
                            onValueChange={(value) => setFormData({ ...formData, job_opening_status: value })}
                          >
                            <SelectTrigger>
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
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="education">Education</Label>
                          <Select
                            value={formData.education}
                            onValueChange={(value) => setFormData({ ...formData, education: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select education level" />
                            </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10th">10th</SelectItem>
                    <SelectItem value="12th">12th</SelectItem>
                    <SelectItem value="diploma">Diploma</SelectItem>
                    <SelectItem value="associate">Associate Degree</SelectItem>
                    <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                    <SelectItem value="master">Master's Degree</SelectItem>
                    <SelectItem value="phd">PhD</SelectItem>
                    <SelectItem value="none">None Required</SelectItem>
                  </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label>Compensation Range *</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="salary_type" className="text-xs">Salary Type</Label>
                            <Select
                              value={formData.salary_type}
                              onValueChange={(value) => setFormData({ ...formData, salary_type: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="yearly">Per Year</SelectItem>
                                <SelectItem value="monthly">Per Month</SelectItem>
                                <SelectItem value="hourly">Per Hour</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="salary_min" className="text-xs">Minimum</Label>
                            <Input
                              id="salary_min"
                              type="text"
                              placeholder="4,00,000"
                              value={formatIndianNumber(formData.salary_min)}
                              onChange={(e) => {
                                const value = parseFormattedNumber(e.target.value)
                                if (value === '' || /^\d+$/.test(value)) {
                                  setFormData({ ...formData, salary_min: value })
                                }
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="salary_max" className="text-xs">Maximum</Label>
                            <Input
                              id="salary_max"
                              type="text"
                              placeholder="8,00,000"
                              value={formatIndianNumber(formData.salary_max)}
                              onChange={(e) => {
                                const value = parseFormattedNumber(e.target.value)
                                if (value === '' || /^\d+$/.test(value)) {
                                  setFormData({ ...formData, salary_max: value })
                                }
                              }}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Please specify the estimated salary range for this role</p>
                      </div>
                    </div>
                    
                    {/* Step 1 Navigation */}
                    <div className="flex justify-end pt-6">
                      <Button
                        onClick={() => setCurrentStep(2)}
                        className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90"
                      >
                        Next
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Job Description</h2>
                      <p className="text-muted-foreground">Describe the position in detail</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="description">Job Description *</Label>
                        <div className="flex items-center justify-end gap-2 mb-2">
                          <Select onValueChange={(value) => {
                            if (value !== 'default' && value !== 'no-templates') {
                              console.log('[v0] Loading template content:', value.substring(0, 100))
                              // Convert plain text to HTML if needed
                              const htmlContent = convertPlainTextToHTML(value)
                              console.log('[v0] Converted to HTML:', htmlContent.substring(0, 100))
                              // Replace variables in template content
                              const contentWithVariables = replaceTemplateVariables(htmlContent, formData)
                              console.log('[v0] After variable replacement:', contentWithVariables.substring(0, 100))
                              setFormData({ ...formData, description: contentWithVariables })
                              toast({
                                title: 'Template Loaded',
                                description: 'Job description template has been loaded with formatting',
                              })
                            }
                          }}>
                            <SelectTrigger className="h-8 w-[200px] text-xs">
                              <SelectValue placeholder="Job Description Templates" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Select Template</SelectItem>
                              {jobDescriptionTemplates.length === 0 ? (
                                <SelectItem value="no-templates" disabled>
                                  No templates available
                                </SelectItem>
                              ) : (
                                jobDescriptionTemplates.map((template) => (
                                  <SelectItem key={template.id} value={template.content}>
                                    {template.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('jd-upload')?.click()}
                            disabled={uploadingJD}
                            className="bg-transparent h-8 text-xs whitespace-nowrap"
                            title="Upload a plain text (.txt) file with your job description"
                          >
                            {uploadingJD ? (
                              <>
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent mr-1.5" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-3 w-3 mr-1.5" />
                                Upload JD
                              </>
                            )}
                          </Button>
                          <input
                            id="jd-upload"
                            type="file"
                            accept=".txt,.docx,.pdf"
                            onChange={handleJDUpload}
                            className="hidden"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Select a template or upload a .txt, .docx, or .pdf file. Formatting like headings, bullets, and line breaks will be preserved.
                        </p>
                        <div className={(() => {
                          const descCharCount = formData.description.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length
                          return descCharCount > 0 && descCharCount < 100 ? 'border-2 border-red-500 rounded-md' : ''
                        })()}>
                          <RichTextEditor
                            value={formData.description}
                            onChange={(value) => setFormData({ ...formData, description: value })}
                            placeholder="Describe the job opening, location, and key details about this position..."
                          />
                        </div>
                        {(() => {
                          const charCount = formData.description.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length
                          const isBelow = charCount < 100
                          return (
                            <p className={`text-xs text-right ${isBelow ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                              {charCount} / 100 min characters {isBelow ? `(${100 - charCount} more needed)` : ''}
                            </p>
                          )
                        })()}
                      </div>

                      <div className="space-y-2 relative">
                        <Label htmlFor="skills">Skills Required *</Label>
                        <div className="border rounded-lg p-3 bg-white min-h-[120px]">
                          <div className="flex flex-wrap gap-2 mb-2">
                            {skills.map((skill, index) => (
                              <Badge key={index} variant="secondary" className="px-3 py-1 text-sm flex items-center gap-1">
                                {skill}
                                <button
                                  type="button"
                                  onClick={() => setSkills(skills.filter((_, i) => i !== index))}
                                  className="ml-1 hover:text-destructive text-lg leading-none"
                                  title="Remove skill"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2 relative">
                            <Input
                              id="skills"
                              placeholder="Type to search skills or add custom..."
                              value={skillInput}
                              onChange={(e) => {
                                setSkillInput(e.target.value)
                                setShowSkillsDropdown(true)
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && skillInput.trim()) {
                                  e.preventDefault()
                                  if (!skills.includes(skillInput.trim())) {
                                    setSkills([...skills, skillInput.trim()])
                                  }
                                  setSkillInput('')
                                  setShowSkillsDropdown(false)
                                }
                              }}
                              onFocus={() => setShowSkillsDropdown(true)}
                              onBlur={() => setTimeout(() => setShowSkillsDropdown(false), 300)}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              onClick={() => {
                                if (skillInput.trim() && !skills.includes(skillInput.trim())) {
                                  setSkills([...skills, skillInput.trim()])
                                  setSkillInput('')
                                  setShowSkillsDropdown(false)
                                }
                              }}
                              variant="outline"
                              size="sm"
                              className="bg-transparent"
                            >
                              Add
                            </Button>
                          </div>
                          {showSkillsDropdown && skillInput && skillsDatabase.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                              {skillsDatabase
                                .filter(skill => 
                                  skill.skill_name.toLowerCase().includes(skillInput.toLowerCase()) &&
                                  !skills.includes(skill.skill_name)
                                )
                                .slice(0, 10)
                                .map(skill => (
                                  <div
                                    key={skill.id}
                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm flex items-center justify-between"
                                    onMouseDown={(e) => {
                                      e.preventDefault() // Prevent blur from firing
                                      if (!skills.includes(skill.skill_name)) {
                                        setSkills([...skills, skill.skill_name])
                                      }
                                      setSkillInput('')
                                      setShowSkillsDropdown(false)
                                      setTimeout(() => {
                                        document.getElementById('skills')?.focus()
                                      }, 0)
                                    }}
                                  >
                                    <span>{skill.skill_name}</span>
                                    <span className="text-xs text-gray-500">{skill.category}</span>
                                  </div>
                                ))}
                              {skillsDatabase.filter(skill => 
                                skill.skill_name.toLowerCase().includes(skillInput.toLowerCase()) &&
                                !skills.includes(skill.skill_name)
                              ).length === 0 && (
                                <div className="px-3 py-2 text-sm text-gray-500">
                                  No matching skills. Press Enter to add "{skillInput}"
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Type to search from database or add custom skills. Press Enter or click to add each skill.
                        </p>
                      </div>

                      {/* Company Overview - Moved from About Company step */}
                      <div className="space-y-2 pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="about_company">Company Overview</Label>
                          <span className={`text-xs ${(formData.about_company?.length || 0) > 400 ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                            {formData.about_company?.length || 0}/400
                          </span>
                        </div>
                        <Textarea
                          id="about_company"
                          placeholder="Tell candidates about your company, mission, culture, and values..."
                          value={formData.about_company}
                          onChange={(e) => {
                            if (e.target.value.length <= 400) {
                              setFormData({ ...formData, about_company: e.target.value })
                            }
                          }}
                          maxLength={400}
                          rows={5}
                          className={(formData.about_company?.length || 0) > 400 ? 'border-destructive' : ''}
                        />
                        <p className="text-xs text-muted-foreground">
                          Provide a brief overview of your company (max 400 characters)
                        </p>
                      </div>
                    </div>
                    
                    {/* Step 2 Navigation */}
                    <div className="flex justify-between pt-6">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      {(() => {
                        const descCharCount = formData.description.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length
                        const isDescriptionValid = descCharCount >= 100
                        
                        return (
                          <div className="flex flex-col items-end gap-2">
                            {!isDescriptionValid && (
                              <p className="text-xs text-red-500">
                                Job description needs {100 - descCharCount} more characters (minimum 100)
                              </p>
                            )}
                            <Button
                              onClick={() => {
                                console.log('[v0] Step 2 Next clicked - Description length:', descCharCount)
                                if (isDescriptionValid) {
                                  setCurrentStep(3)
                                } else {
                                  toast({
                                    title: 'Validation Error',
                                    description: `Job description must be at least 100 characters. You need ${100 - descCharCount} more characters.`,
                                    variant: 'destructive'
                                  })
                                }
                              }}
                              disabled={!isDescriptionValid}
                              className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Next
                              <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                )}


                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Review & Publish</h2>
                      <p className="text-muted-foreground">Review your job posting before publishing</p>
                    </div>

                    <div className="space-y-6">
                      <div className="border rounded-xl p-6 bg-white shadow-sm">
                  <h3 className="font-bold text-2xl mb-3">{formData.title || 'Job Title'}</h3>
                  <div className="flex flex-wrap gap-2 mb-6 text-sm text-muted-foreground">
                    <span>
                      {formData.remote_option === 'remote' 
                        ? 'Remote' 
                        : formData.remote_option === 'hybrid'
                        ? `${formData.location || 'Location not specified'} (Hybrid)`
                        : formData.location || 'Location not specified'}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{formData.position_type}</span>
                          {formData.salary_min && formData.salary_max && (
                            <>
                              <span>•</span>
                              <span>
                                ₹{formatIndianNumber(formData.salary_min)} - ₹{formatIndianNumber(formData.salary_max)} / {formData.salary_type === 'yearly' ? 'LPA' : formData.salary_type}
                              </span>
                            </>
                          )}
                        </div>
                        
                        {formData.description && (
                          <div className="mb-6">
                            <h4 className="font-semibold mb-2">Job Description</h4>
                            <div 
                              className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none break-words overflow-wrap-anywhere"
                              dangerouslySetInnerHTML={{ __html: formData.description }}
                            />
                          </div>
                        )}
                        
                        {skills.length > 0 && (
                          <div className="mb-6">
                            <h4 className="font-semibold mb-2">Skills Required</h4>
                            <div className="flex flex-wrap gap-2">
                              {skills.map((skill, index) => (
                                <Badge key={index} variant="secondary" className="px-3 py-1">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {formData.requirements && (
                          <div className="mb-6">
                            <h4 className="font-semibold mb-2">Requirements</h4>
                            <div 
                              className="text-sm text-gray-700 prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: formData.requirements }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 bg-transparent"
                        onClick={() => handleSaveDraft(false)}
                        disabled={loading}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save as Draft
                      </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90"
                    onClick={handlePublish}
                    disabled={loading}
                  >
                    {loading ? (isEditMode ? 'Updating...' : 'Publishing...') : (isEditMode ? 'Update Job' : 'Publish Job')}
                  </Button>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-8">
                    {!isPublished ? (
                      // Show message if user tries to access Success page without publishing
                      <Dialog open={true} onOpenChange={() => setCurrentStep(3)}>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Publish Your Job First</DialogTitle>
                            <DialogDescription>
                              You need to publish your job before accessing the success page. Please go back to the Preview step and click "Publish Job".
                            </DialogDescription>
                          </DialogHeader>
                          <Button 
                            onClick={() => setCurrentStep(3)}
                            className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90"
                          >
                            Go to Preview
                          </Button>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <>
                        {/* Success Message */}
                        <div className="flex items-center gap-3 mb-6">
                          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900">Success! Your job has been posted.</h2>
                            <p className="text-sm text-gray-600 mt-1">
                              Your job posting is now live and ready to receive applications.
                            </p>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="grid gap-8 md:grid-cols-2">
                      {/* One Click Sharing */}
                      <Card className="border-0 shadow-md bg-white/80 backdrop-blur">
                        <CardHeader>
                          <CardTitle className="text-xl font-bold text-gray-900">One click sharing</CardTitle>
                          <CardDescription>Reach even more candidates by sharing your job</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Social Media Buttons */}
                          <div className="flex gap-3 flex-wrap">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-10 w-10 rounded-lg hover:bg-blue-50 bg-transparent"
                              onClick={() => {
                                const experience = formData.min_experience && formData.max_experience 
                                  ? `${formData.min_experience}-${formData.max_experience} years`
                                  : 'Experience Required'
                                const location = formData.remote_option === 'remote' 
                                  ? 'Remote' 
                                  : formData.location || 'Location TBD'
                                const shareText = `${formData.title} | ${experience} | ${location}`
                                const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                                const jobId = publishedJobId || 'preview'
                                const url = encodeURIComponent(window.location.origin + '/jobs/' + slug + '/' + jobId)
                                window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${encodeURIComponent(shareText)}`, '_blank', 'width=600,height=400')
                              }}
                              title="Share on Facebook"
                            >
                              <Facebook className="h-5 w-5 text-blue-600" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-10 w-10 rounded-lg hover:bg-blue-50 bg-transparent"
                              onClick={() => {
                                const experience = formData.min_experience && formData.max_experience 
                                  ? `${formData.min_experience}-${formData.max_experience} years`
                                  : 'Experience Required'
                                const location = formData.remote_option === 'remote' 
                                  ? 'Remote' 
                                  : formData.location || 'Location TBD'
                                const shareText = `${formData.title} | ${experience} | ${location}`
                                const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                                const jobId = publishedJobId || 'preview'
                                const url = encodeURIComponent(window.location.origin + '/jobs/' + slug + '/' + jobId)
                                const text = encodeURIComponent(shareText + '\n\n')
                                window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${text}${url}`, '_blank', 'width=600,height=600')
                              }}
                              title="Share on LinkedIn"
                            >
                              <Linkedin className="h-5 w-5 text-blue-700" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-10 w-10 rounded-lg hover:bg-gray-100 bg-transparent"
                              onClick={() => {
                                const experience = formData.min_experience && formData.max_experience 
                                  ? `${formData.min_experience}-${formData.max_experience} years`
                                  : 'Experience Required'
                                const location = formData.remote_option === 'remote' 
                                  ? 'Remote' 
                                  : formData.location || 'Location TBD'
                                const shareText = `${formData.title} | ${experience} | ${location}`
                                const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                                const jobId = publishedJobId || 'preview'
                                const url = encodeURIComponent(window.location.origin + '/jobs/' + slug + '/' + jobId)
                                window.open(`https://twitter.com/intent/tweet?url=${url}&text=${encodeURIComponent(shareText)}`, '_blank', 'width=600,height=400')
                              }}
                              title="Share on X (Twitter)"
                            >
                              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                              </svg>
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-10 w-10 rounded-lg hover:bg-pink-50 bg-transparent"
                              onClick={() => {
                                const experience = formData.min_experience && formData.max_experience 
                                  ? `${formData.min_experience}-${formData.max_experience} years`
                                  : 'Experience Required'
                                const location = formData.remote_option === 'remote' 
                                  ? 'Remote' 
                                  : formData.location || 'Location TBD'
                                const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                                const jobId = publishedJobId || 'preview'
                                const shareText = `${formData.title} | ${experience} | ${location}\n${window.location.origin}/jobs/${slug}/${jobId}`
                                navigator.clipboard.writeText(shareText)
                                toast({ title: 'Link copied!', description: 'Paste in Instagram' })
                              }}
                              title="Share on Instagram"
                            >
                              <Instagram className="h-5 w-5 text-pink-600" />
                            </Button>
                          </div>

                      {/* Copy Link */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Copy and Share Your Job Link</label>
                        <div className="flex gap-2">
                          <Input
                            value={(() => {
                              const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                              const jobId = publishedJobId || 'preview'
                              return window.location.origin + '/jobs/' + slug + '/' + jobId
                            })()}
                            readOnly
                            className="flex-1 bg-gray-50"
                          />
                          <Button
                            variant="outline"
                            onClick={() => {
                              const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                              const jobId = publishedJobId || 'preview'
                              router.push('/jobs/' + slug + '/' + jobId)
                            }}
                            className="bg-transparent"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Job
                          </Button>
                          <Button
                            onClick={() => {
                              const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                              const jobId = publishedJobId || 'preview'
                              const url = window.location.origin + '/jobs/' + slug + '/' + jobId
                              navigator.clipboard.writeText(url)
                              toast({ title: 'Link Copied!', description: 'Job link copied to clipboard' })
                            }}
                            className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Link
                          </Button>
                        </div>
                      </div>
                        </CardContent>
                      </Card>

                      {/* Share Your Hiring Image */}
                      <Card className="border-0 shadow-md bg-white/80 backdrop-blur">
                        <CardHeader>
                          <CardTitle className="text-xl font-bold text-gray-900">Share your hiring image</CardTitle>
                          <CardDescription>Download and share on social media to boost visibility</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="relative bg-gradient-to-br from-[#1e3a5f] to-[#0f2942] rounded-lg p-8 text-white min-h-[280px] flex flex-col justify-between">
                            {/* Decorative Pattern */}
                            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                              <div className="absolute inset-0 bg-white/20 rounded-full blur-xl"></div>
                            </div>
                            
                            <div className="relative z-10">
                              <h3 className="text-3xl font-bold mb-6">We are<br />HIRING</h3>
                              <div className="space-y-2">
                                <p className="font-semibold text-base">{formData.location || 'Remote'}</p>
                                <p className="text-gray-200 text-sm">{formData.title}</p>
                                <p className="text-gray-200 text-sm capitalize">{formData.position_type?.replace('-', ' ')}</p>
                              </div>
                            </div>
                            
                  <div className="relative z-10 mt-6">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-300">Powered by</span>
                      <span className="text-2xl font-bold tracking-tight">Hyrix</span>
                    </div>
                  </div>
                          </div>
                          
                          <Button
                            className="w-full mt-4 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90"
                            onClick={() => toast({ title: 'Coming soon!', description: 'Download feature will be available soon' })}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Here
                          </Button>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-center pt-6">
                      <Button
                        variant="outline"
                        onClick={() => router.push('/admin?tab=jobs')}
                        className="bg-transparent"
                      >
                        Back to Jobs
                      </Button>
                      <Button
                        className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90"
                        onClick={() => window.location.href = '/admin/jobs-new'}
                      >
                        Post Another Job
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
