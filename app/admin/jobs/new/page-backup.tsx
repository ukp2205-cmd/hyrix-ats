'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
  UserCog,
  BarChart3,
  ChevronRight,
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
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { generateJobId } from '@/lib/generate-job-id'
import RichTextEditor from '@/components/rich-text-editor'

export default function NewJobPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
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
    description: '',
    requirements: '',
    responsibilities: '',
    company_info: '',
    application_process: '',
    keywords: '',
    status: 'draft',
    client_name: '',
    account_manager: '',
    assigned_recruiter: [] as string[],
    industry: '',
    contact_name: [] as string[],
    job_opening_status: 'in-progress',
    education: '',
    about_company: '',
    company_size: '',
    company_website: '',
    benefits: '',
    work_environment: ''
  })
  
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const editorRef = useRef<HTMLTextAreaElement>(null)
  
  // History for recruiters and contacts
  const [recruiterHistory, setRecruiterHistory] = useState<string[]>([])
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
        setShowAccountManagerDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])


  // Fetch recruiter and contact history from previous jobs, and team members
  useEffect(() => {
    const fetchHistory = async () => {
      const supabase = createClient()
      let managersFromTeam: Array<{id: string, name: string, email: string}> = []
      
      // Fetch team members from org_team table for Hyrix organization
      const { data: orgData } = await supabase
        .from('organization')
        .select('id')
        .eq('email', 'hr@jobkarle.com')
        .single()
      
      if (orgData) {
        const { data: teamData } = await supabase
          .from('org_team')
          .select('id, name, role, email')
          .eq('organization_id', orgData.id)
          .eq('status', 'active')
        
        if (teamData) {
          setTeamMembers(teamData)
          
          // All team members (including account managers) can be recruiters or contacts
          const allNames = teamData.map(member => member.name).filter(Boolean)
          setRecruiterHistory(allNames)
          setContactHistory(allNames)
          
          console.log('[v0] All Hyrix team members:', allNames)
        }
      }
      
      // Fetch from previous jobs for historical data
      const { data, error } = await supabase
        .from('jobs')
        .select('assigned_recruiter, contact_name, account_manager')

      if (data && !error) {
        // Merge job history with team members for recruiters and contacts
        const recruitersFromJobs = [...new Set(
          data
            .map(job => job.assigned_recruiter)
            .filter(Boolean)
            .flatMap(r => r.split(',').map((name: string) => name.trim()))
        )]
        const contactsFromJobs = [...new Set(
          data
            .map(job => job.contact_name)
            .filter(Boolean)
            .flatMap(c => c.split(',').map((name: string) => name.trim()))
        )]
        
        // Merge with team members
        setRecruiterHistory(prev => [...new Set([...prev, ...recruitersFromJobs])])
        setContactHistory(prev => [...new Set([...prev, ...contactsFromJobs])])
        
        // Account managers: ONLY from job history, no org_team filtering
        const accountMgrs = [...new Set(data.map(job => job.account_manager).filter(Boolean).map(name => name.trim()))]
        
        console.log('[v0] Account managers from job history only:', accountMgrs)
        
        // Set account managers from historical data only
        if (accountMgrs.length > 0) {
          const historicalManagers = accountMgrs.map(name => ({ 
            id: `history-${name}`, 
            name, 
            email: '' 
          }))
          setAccountManagers(historicalManagers)
        }
      }
    }
    fetchHistory()
  }, [])

  const steps = [
  { number: 1, label: 'Details', icon: FileText },
  { number: 2, label: 'Description', icon: FileText },
  { number: 3, label: 'About Company', icon: Sliders },
  { number: 4, label: 'Preview', icon: CheckCircle },
  ]

  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, href: '/admin' },
    { id: 'jobs', label: 'Job Postings', icon: Briefcase, href: '/admin' },
    { id: 'candidates', label: 'Candidates', icon: Users, href: '/admin' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/admin' },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, href: '/admin' },
  ]

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSaveDraft = async () => {
    setLoading(true)
    const supabase = createClient()
    
    // Generate custom Job ID
    const customJobId = generateJobId()
    
    // Map form data to database schema
    const jobData = {
      job_id: customJobId,
      title: formData.title,
      description: formData.description,
      location: formData.location,
      employment_type: formData.position_type,
                        salary_range: formData.salary_min && formData.salary_max
                          ? `₹${formatIndianNumber(formData.salary_min)} - ₹${formatIndianNumber(formData.salary_max)} / ${formData.salary_type}`
        : null,
      requirements: skills.join(', '),
      department: formData.department,
      client_name: formData.client_name,
      account_manager: formData.account_manager,
      assigned_recruiter: formData.assigned_recruiter.join(', '),
      industry: formData.industry,
      contact_name: formData.contact_name.join(', '),
      status: 'draft'
    }
    
    const { error } = await supabase.from('jobs').insert([jobData])

    if (error) {
      console.log('[v0] Error saving draft:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to save draft',
        variant: 'destructive'
      })
    } else {
      toast({
        title: 'Success',
        description: 'Draft saved successfully!'
      })
      router.push('/admin')
    }
    setLoading(false)
  }

  const handlePublish = async () => {
    setLoading(true)
    const supabase = createClient()
    
    // Validate required fields
    if (!formData.title || !formData.title.trim()) {
      toast({
        title: 'Missing Required Field',
        description: 'Job title is required',
        variant: 'destructive'
      })
      setLoading(false)
      return
    }
    
    if (!formData.location || !formData.location.trim()) {
      toast({
        title: 'Missing Required Field',
        description: 'Location is required',
        variant: 'destructive'
      })
      setLoading(false)
      return
    }
    
    // Generate custom Job ID
    const customJobId = generateJobId()
    
    console.log('[v0] Form data before mapping:', {
      title: formData.title,
      description_length: formData.description.length,
      location: formData.location,
      salary_min: formData.salary_min,
      salary_max: formData.salary_max
    })
    
    // Map form data to database schema - only include filled fields
    const jobData: any = {
      job_id: customJobId,
      title: formData.title.trim(),
      location: formData.location.trim(),
      employment_type: formData.position_type,
      status: 'active'
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
    
    console.log('[v0] Publishing job with data:', jobData)
    
    const { data, error } = await supabase.from('jobs').insert([jobData]).select()

    if (error) {
      console.log('[v0] Error publishing job:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to publish job',
        variant: 'destructive'
      })
    } else {
      console.log('[v0] Job published successfully:', data)
      const jobId = data?.[0]?.id
      toast({
        title: 'Success!',
        description: 'Your job has been published successfully'
      })
      router.push(`/admin`)
    }
    setLoading(false)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-white transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static shadow-sm ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
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
              const isActive = item.id === 'jobs'
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
                localStorage.removeItem('jobkarle_user')
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
                <h1 className="text-base sm:text-xl font-semibold">Create New Job</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Step {currentStep} of 5</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSaveDraft} disabled={loading} className="hidden sm:flex bg-transparent">
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
              <Button variant="outline" size="icon" onClick={handleSaveDraft} disabled={loading} className="sm:hidden bg-transparent">
                <Save className="h-4 w-4" />
              </Button>
              {currentStep === 5 && (
                <Button 
                  className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90"
                  onClick={handlePublish}
                  disabled={loading}
                >
                  <span className="hidden sm:inline">Publish Job</span>
                  <span className="sm:hidden">Publish</span>
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
                      <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-medium">
                          Position Title *
                        </Label>
                        <Input
                          id="title"
                          placeholder="e.g. Customer Service Representative"
                          value={formData.title}
                          onChange={(e) => {
                            console.log('[v0] Title changed to:', e.target.value)
                            setFormData({ ...formData, title: e.target.value })
                          }}
                          className="text-base"
                        />
                        <p className="text-xs text-muted-foreground">Enter the title of the job position</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="client_name">Client Name</Label>
                          <Input
                            id="client_name"
                            placeholder="Enter client name"
                            value={formData.client_name}
                            onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                          />
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
                                  const filteredContacts = contactNameInput
                                    ? contactHistory.filter(contact => 
                                        contact.toLowerCase().includes(searchValue) &&
                                        !formData.contact_name.includes(contact)
                                      )
                                    : contactHistory.filter(contact => !formData.contact_name.includes(contact))
                                  
                                  const isExactMatch = contactHistory.some(c => 
                                    c.toLowerCase() === contactNameInput.toLowerCase()
                                  )
                                  
                                  return (
                                    <>
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
                        <div className="space-y-2">
                          <Label htmlFor="location">Office Location</Label>
                          <Input
                            id="location"
                            placeholder="e.g. Phoenix Office, Mumbai Branch"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="industry">Industry</Label>
                          <Select
                            value={formData.industry}
                            onValueChange={(value) => setFormData({ ...formData, industry: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select industry" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="technology">Technology</SelectItem>
                              <SelectItem value="finance">Finance</SelectItem>
                              <SelectItem value="healthcare">Healthcare</SelectItem>
                              <SelectItem value="education">Education</SelectItem>
                              <SelectItem value="retail">Retail</SelectItem>
                              <SelectItem value="manufacturing">Manufacturing</SelectItem>
                              <SelectItem value="consulting">Consulting</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="department">Department</Label>
                          <Input
                            id="department"
                            placeholder="e.g. Engineering, Sales"
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
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
                              <SelectItem value="in-progress">In-progress</SelectItem>
                              <SelectItem value="waiting-for-approval">Waiting for approval</SelectItem>
                              <SelectItem value="on-hold">On-Hold</SelectItem>
                              <SelectItem value="filled">Filled</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                              <SelectItem value="declined">Declined</SelectItem>
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
                              <SelectItem value="high-school">High School</SelectItem>
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
                        <div className="flex justify-between items-center mb-2">
                          <Label htmlFor="description">Job Description *</Label>
                          <Select onValueChange={(value) => {
                            if (value !== 'default') {
                              setFormData({ ...formData, description: value })
                            }
                          }}>
                            <SelectTrigger className="h-8 w-[200px] text-xs">
                              <SelectValue placeholder="Job Description Templates" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Select Template</SelectItem>
                              <SelectItem value="<p><strong>Job Opening: [Position Title]</strong></p><p><br></p><p><strong>Location:</strong> [City, State]</p><p><br></p><p>[Company Name] is excited to announce an opening for a [Position Title]. This role is ideal for individuals who are passionate about [key responsibility] and thrive in a [work environment type].</p><p><br></p><p><strong>Duties &amp; Responsibilities:</strong></p><ul><li>[Responsibility 1]</li><li>[Responsibility 2]</li><li>[Responsibility 3]</li></ul>">
                                Customer Service Template
                              </SelectItem>
                              <SelectItem value="<p><strong>Position: Technical Specialist</strong></p><p><br></p><p><strong>Location:</strong> Remote</p><p><br></p><p>We are seeking a skilled Technical Specialist to join our engineering team. The ideal candidate will have strong problem-solving abilities and technical expertise.</p><p><br></p><p><strong>Key Requirements:</strong></p><ul><li>Bachelor's degree in Computer Science or related field</li><li>3+ years of relevant experience</li><li>Strong communication skills</li></ul>">
                                Technical Position Template
                              </SelectItem>
                              <SelectItem value="<p><strong>Management Role Opening</strong></p><p><br></p><p><strong>Location:</strong> [Office Location]</p><p><br></p><p>Join our leadership team as a [Manager Title]. This position requires excellent organizational skills and the ability to lead cross-functional teams.</p><p><br></p><p><strong>Responsibilities:</strong></p><ul><li>Team management and development</li><li>Strategic planning and execution</li><li>Budget oversight</li></ul>">
                                Management Template
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <RichTextEditor
                          value={formData.description}
                          onChange={(value) => setFormData({ ...formData, description: value })}
                          placeholder="Describe the job opening, location, and key details about this position..."
                        />
                        <p className="text-xs text-muted-foreground text-right">
                          Characters: {formData.description.length} / 3584
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="skills">Skills Required *</Label>
                        <div className="border rounded-lg p-3 bg-white min-h-[120px]">
                          <div className="flex flex-wrap gap-2 mb-2">
                            {skills.map((skill, index) => (
                              <Badge key={index} variant="secondary" className="px-3 py-1 text-sm">
                                {skill}
                                <button
                                  type="button"
                                  onClick={() => setSkills(skills.filter((_, i) => i !== index))}
                                  className="ml-2 hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              id="skills"
                              placeholder="Add a skill and press Enter..."
                              value={skillInput}
                              onChange={(e) => setSkillInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && skillInput.trim()) {
                                  e.preventDefault()
                                  setSkills([...skills, skillInput.trim()])
                                  setSkillInput('')
                                }
                              }}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              onClick={() => {
                                if (skillInput.trim()) {
                                  setSkills([...skills, skillInput.trim()])
                                  setSkillInput('')
                                }
                              }}
                              size="sm"
                              variant="outline"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">About Company</h2>
                      <p className="text-muted-foreground">Share information about your organization</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="about_company">Company Overview</Label>
                        <Textarea
                          id="about_company"
                          placeholder="Tell candidates about your company, mission, culture, and values..."
                          value={formData.about_company}
                          onChange={(e) => setFormData({ ...formData, about_company: e.target.value })}
                          rows={5}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="company_size">Company Size</Label>
                          <Select
                            value={formData.company_size || ''}
                            onValueChange={(value) => setFormData({ ...formData, company_size: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select company size" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1-10">1-10 employees</SelectItem>
                              <SelectItem value="11-50">11-50 employees</SelectItem>
                              <SelectItem value="51-200">51-200 employees</SelectItem>
                              <SelectItem value="201-500">201-500 employees</SelectItem>
                              <SelectItem value="501-1000">501-1000 employees</SelectItem>
                              <SelectItem value="1000+">1000+ employees</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="company_website">Company Website</Label>
                          <Input
                            id="company_website"
                            type="url"
                            placeholder="https://www.example.com"
                            value={formData.company_website || ''}
                            onChange={(e) => setFormData({ ...formData, company_website: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="benefits">Benefits & Perks</Label>
                        <Textarea
                          id="benefits"
                          placeholder="List the benefits and perks offered (e.g., health insurance, flexible hours, remote work, etc.)"
                          value={formData.benefits || ''}
                          onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                          rows={4}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="work_environment">Work Environment</Label>
                        <Textarea
                          id="work_environment"
                          placeholder="Describe the work environment and culture..."
                          value={formData.work_environment || ''}
                          onChange={(e) => setFormData({ ...formData, work_environment: e.target.value })}
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Review & Publish</h2>
                      <p className="text-muted-foreground">Review your job posting before publishing</p>
                    </div>

                    <div className="space-y-6">
                      <div className="border rounded-xl p-6 bg-white shadow-sm">
                        <h3 className="font-bold text-2xl mb-3">{formData.title || 'Job Title'}</h3>
                        <div className="flex flex-wrap gap-2 mb-6 text-sm text-muted-foreground">
                          <span>{formData.location || 'Location not specified'}</span>
                          <span>•</span>
                          <span className="capitalize">{formData.position_type}</span>
                          {formData.salary_min && formData.salary_max && (
                            <>
                              <span>•</span>
                              <span>
                                ₹{formatIndianNumber(formData.salary_min)} - ₹{formatIndianNumber(formData.salary_max)} / {formData.salary_type}
                              </span>
                            </>
                          )}
                        </div>
                        
                        {formData.description && (
                          <div className="mb-6">
                            <h4 className="font-semibold mb-2">Job Description</h4>
                            <div 
                              className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none"
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
                          onClick={handleSaveDraft}
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
                          {loading ? 'Publishing...' : 'Publish Job'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 1}
                  >
                    Back
                  </Button>
                  {currentStep < 5 && (
                    <Button
                      onClick={handleNext}
                      className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90"
                    >
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
