'use client'

import { PaginationNext } from "@/components/ui/pagination"

import { PaginationLink } from "@/components/ui/pagination"

import { PaginationPrevious } from "@/components/ui/pagination"

import { PaginationItem } from "@/components/ui/pagination"

import { PaginationContent } from "@/components/ui/pagination"

import { Pagination } from "@/components/ui/pagination"



import { SelectItem } from "@/components/ui/select"

import { SelectContent } from "@/components/ui/select"

import { SelectValue } from "@/components/ui/select"

import { SelectTrigger } from "@/components/ui/select"

import { Select } from "@/components/ui/select"

import { DialogDescription } from "@/components/ui/dialog"

import { DialogTitle } from "@/components/ui/dialog"

import { DialogHeader } from "@/components/ui/dialog"

import { DialogContent } from "@/components/ui/dialog"

import { Dialog } from "@/components/ui/dialog"

import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import React from "react"
import bcrypt from 'bcryptjs' // Import bcryptjs for password hashing
 import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { COUNTRY_CODES } from '@/lib/country-codes'
  import { Card } from '@/components/ui/card'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import { Switch } from '@/components/ui/switch'
  import { Textarea } from '@/components/ui/textarea'
import { 
  Building2, Mail, MapPin, Phone, User, Edit, Trash2, Plus, X, ArrowLeft, Eye, EyeOff,
  CheckCircle, AlertCircle, Save, Shield, Bell, Users, Lock, Briefcase, Globe, FileText, ChevronLeft, ChevronRight, Settings2, Search, Filter, Upload, UserPlus, RotateCcw, UserCog, MoreVertical, Pencil, MessageCircle, Inbox, Loader2, RefreshCw, TrendingUp
  } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import { TeamList } from '@/components/team-list'
import { TemplateManagement } from '@/components/template-management'
import { UserAccessView } from '@/components/user-access-view'
import { RolePermissionsManager } from '@/components/role-permissions-manager'
import { VendorManagement } from '@/components/vendor-management'
import { BDLeadSetup } from '@/components/bd-lead-setup'

type SettingsView = 'menu' | 'company' | 'notifications' | 'create-client' | 'manage-client' | 'security' | 'team' | 'add-member' | 'templates' | 'role-permissions' | 'domain-whitelist' | 'email-settings' | 'vendor-management' | 'add-vendor' | 'bd-lead-setup'

interface OrganizationData {
  id: string
  name: string
  email: string
  phone: string
  website: string
  address: string
  city: string
  state: string
  country: string
  industry: string
}

interface AdminSettingsProps {
  userRole?: 'admin' | 'recruiter' | 'super_admin' | 'hiring_manager'
  userEmail?: string | null
}

// Helper function to convert text to title case
const toTitleCase = (text: string | null | undefined): string => {
  if (!text) return ''
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function AdminSettings({ userRole = 'admin', userEmail }: AdminSettingsProps) {
  const { toast } = useToast()
  const { hasModuleAccess, getAccessLevel, loading: permissionsLoading } = usePermissions()
  const [currentView, setCurrentView] = useState<SettingsView>('menu')
  const [organizationData, setOrganizationData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditingCompanyInfo, setIsEditingCompanyInfo] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    country: '',
    industry: '',
    gst: '',
    logo_url: '',
    company_overview: ''
  })

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    newApplications: true,
    statusUpdates: true,
    weeklyReports: true
  })

  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    sessionTimeout: '24',
    passwordExpiry: '90'
  })

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'recruiter',
    location: '',
    department: '',
    password: '',
    status: 'active',
    team_id: ''
  })
  const [teamMemberCountryCode, setTeamMemberCountryCode] = useState('+91')
  const [teamMemberCountryCodeSearch, setTeamMemberCountryCodeSearch] = useState('IN +91')
  const [showTeamCountryCodePopover, setShowTeamCountryCodePopover] = useState(false)
  const [teamMemberEmailError, setTeamMemberEmailError] = useState('')
  const [teamMemberPhoneError, setTeamMemberPhoneError] = useState('')
  const [teams, setTeams] = useState<{id: string, team_name: string}[]>([])
  const [isEditingTeamMember, setIsEditingTeamMember] = useState(false)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [departments, setDepartments] = useState<Array<{id: string, department_name: string}>>([])
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false)
  const [showRevokeConfirmation, setShowRevokeConfirmation] = useState(false)
  const [originalStatus, setOriginalStatus] = useState<string>('active')
  
  // Domain whitelisting state
  const [whitelistedDomains, setWhitelistedDomains] = useState<string[]>([])
  const [newDomainInput, setNewDomainInput] = useState('')
  const [domainSaving, setDomainSaving] = useState(false)

  // Helper: save domains to DB immediately
  const saveDomainsToDB = async (domains: string[]) => {
    if (!organizationData?.id) return
    setDomainSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('organization')
      .update({ whitelisted_domains: domains })
      .eq('id', organizationData.id)
    
    if (error) {
      console.error('[v0] Failed to save domains:', error)
      toast({ title: 'Error', description: 'Failed to save domain changes.', variant: 'destructive' })
    } else {
      console.log('[v0] Domains saved:', domains)
      toast({ title: 'Saved', description: 'Domain list updated.' })
    }
    setDomainSaving(false)
  }
  
  // Client management state
  const [clients, setClients] = useState<any[]>([])
  const [clientViewMode, setClientViewMode] = useState<'active' | 'deleted'>('active') // Toggle between active and deleted clients
  const [activeClientCount, setActiveClientCount] = useState<number>(0)
  const [deletedClientCount, setDeletedClientCount] = useState<number>(0)
  const [clientForm, setClientForm] = useState({
    id: '',
    company_name: '',
    contacts: [] as Array<{email: string, contactName: string, phone: string, countryCode: string, emailError: string, phoneError: string}>,
    address: '',
    industry: '',
    gst: '',
    company_overview: ''
  })
  const [isClientFormOpen, setIsClientFormOpen] = useState(false)
  const [isEditingClient, setIsEditingClient] = useState(false)
  const [editingClientId, setEditingClientId] = useState<string | null>(null)
  
  // Create Team state
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false)
  const [teamForm, setTeamForm] = useState({
    team_name: '',
    location: '',
    hiring_manager_id: '',
    recruiter_ids: [] as string[],
    vendor_ids: [] as string[]
  })
  const [teamFormErrors, setTeamFormErrors] = useState({
    team_name: '',
    location: '',
    hiring_manager_id: '',
    recruiter_ids: ''
  })
  const [availableVendors, setAvailableVendors] = useState<Array<{ id: string; company_name: string; location: string | null }>>([])
  const [loadingVendors, setLoadingVendors] = useState(false)
  const [availableLocations, setAvailableLocations] = useState<string[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [citySearch, setCitySearch] = useState('')
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  const [memberCitySearch, setMemberCitySearch] = useState('')
  const [showMemberCityDropdown, setShowMemberCityDropdown] = useState(false)
  const [availableHiringManagers, setAvailableHiringManagers] = useState<any[]>([])
  const [availableRecruiters, setAvailableRecruiters] = useState<any[]>([])
  const [selectAllRecruiters, setSelectAllRecruiters] = useState(false)
  const [creatingTeam, setCreatingTeam] = useState(false)
  
  // Close city dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('#location') && !target.closest('.city-dropdown')) {
        setShowCityDropdown(false)
      }
      if (!target.closest('#user-location') && !target.closest('.member-city-dropdown')) {
        setShowMemberCityDropdown(false)
      }
    }
    
    if (showCityDropdown || showMemberCityDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCityDropdown, showMemberCityDropdown])
  const [teamDialogTab, setTeamDialogTab] = useState<'create' | 'view'>('create')
  
  // View Teams state
  const [allTeams, setAllTeams] = useState<any[]>([])
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null)
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<any[]>([])
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false)
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false)
  const [availableMembers, setAvailableMembers] = useState<any[]>([])
  const [selectedMembersToAdd, setSelectedMembersToAdd] = useState<string[]>([])
  
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false)
  const [clientFormErrors, setClientFormErrors] = useState({
    company_name: false,
    industry: false,
    address: false,
    email: false,
    contactName: false,
    phone: false
  })
  const [clientCountryCodeSearches, setClientCountryCodeSearches] = useState<{[key: number]: string}>({})
  const [showClientCountryCodePopover, setShowClientCountryCodePopover] = useState<{[key: number]: boolean}>({})

  const clientFormRef = useRef<HTMLDivElement>(null)
  const [clientCurrentPage, setClientCurrentPage] = useState(1)
  const [clientItemsPerPage, setClientItemsPerPage] = useState(10)
  const [clientSearchQuery, setClientSearchQuery] = useState('')
  const [settingsSearchQuery, setSettingsSearchQuery] = useState('')
  const [clientIndustryFilter, setClientIndustryFilter] = useState('all')
  
  // Industries from industries table
  const [industries, setIndustries] = useState<Array<{id: string, name: string}>>([])
  const [industryInput, setIndustryInput] = useState('')
  const [clientIndustryInput, setClientIndustryInput] = useState('')
  const [showClientIndustryDropdown, setShowClientIndustryDropdown] = useState(false)

  const fetchOrganizationData = async () => {
  const supabase = createClient()
  
  // Get logged-in user's organization
    const userStr = localStorage.getItem('hyrix_user')
    if (!userStr) return
    
    const user = JSON.parse(userStr)
    const currentUserEmail = userEmail || user.email
    const currentUserRole = userRole || user.role
  
  let orgId = null
  
  // For recruiters and hiring managers, get organization from org_team table
  if (currentUserRole === 'recruiter' || currentUserRole === 'hiring_manager') {
    const { data: teamData, error: teamError } = await supabase
      .from('org_team')
      .select('organization_id')
      .eq('email', currentUserEmail)
      .maybeSingle()
    
    if (teamError || !teamData) { setLoading(false); return }
    orgId = teamData.organization_id
  } else {
    const { data: orgData, error: orgError } = await supabase
      .from('organization')
      .select('id')
      .eq('email', currentUserEmail)
      .maybeSingle()
    if (orgError || !orgData) { setLoading(false); return }
    orgId = orgData.id
  }
  
  if (!orgId) { setLoading(false); return }
    
  const { data, error } = await supabase
    .from('organization')
    .select('*')
    .eq('id', orgId)
    .single()
    
  if (!error && data) {
    setOrganizationData(data)
    if (data.whitelisted_domains && Array.isArray(data.whitelisted_domains)) {
      setWhitelistedDomains(data.whitelisted_domains)
    }
  }
  setLoading(false)
  }

  useEffect(() => {
    fetchOrganizationData()
    
    // Fetch industries from industries table
    const fetchIndustries = async () => {
      const supabase = createClient()
      const { data: industriesData, error } = await supabase
        .from('industries')
        .select('id, name')
        .order('name', { ascending: true })
      
      if (!error && industriesData) {
        setIndustries(industriesData)
      }
    }
    
    fetchIndustries()
  }, [])
  
  // Populate company info form when organization data loads
  useEffect(() => {
    if (organizationData) {

      setCompanyInfo({
        name: organizationData.name || '',
        email: organizationData.email || '',
        phone: organizationData.phone || organizationData.mobile_number || '',
        website: organizationData.website || '',
        address: organizationData.address || '',
        city: organizationData.city || '',
        state: organizationData.state || '',
        country: organizationData.country || '',
        industry: organizationData.industry || '',
  gst: organizationData.gst || '',
  logo_url: organizationData.logo_url || '',
  company_overview: organizationData.company_overview || ''
  })
    }
  }, [organizationData])
  
  // Fetch clients when manage-client view is active and permissions are loaded
  useEffect(() => {
    if (currentView === 'manage-client' && organizationData && !permissionsLoading) {
      fetchClients()
    }
  }, [currentView, organizationData, clientViewMode, permissionsLoading])
  
  // Fetch departments for team member form
  useEffect(() => {
    const fetchDepartments = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('departments')
        .select('id, department_name')
        .eq('is_active', true)
        .order('department_name', { ascending: true })
      
      if (!error && data) setDepartments(data)
    }
    
    if (currentView === 'add-member') {
      fetchDepartments()
    }
  }, [currentView])
  
  // Initialize country code searches for client contacts
  useEffect(() => {
    const newSearches: {[key: number]: string} = {}
    clientForm.contacts.forEach((contact, index) => {
      if (!clientCountryCodeSearches[index]) {
        const selected = COUNTRY_CODES.find(c => c.code === contact.countryCode)
        newSearches[index] = selected ? `${selected.abbr} ${selected.code}` : 'IN +91'
      }
    })
    if (Object.keys(newSearches).length > 0) {
      setClientCountryCodeSearches({ ...clientCountryCodeSearches, ...newSearches })
    }
  }, [clientForm.contacts.length])
  
  // Close industry dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-dropdown-container]')) {
        setShowIndustryDropdown(false)
        setShowClientIndustryDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  async function fetchClients() {
    if (!organizationData) return
    
    const supabase = createClient()
    const clientAccess = getAccessLevel('Manage Clients')
    console.log('[v0] AdminSettings: Fetching clients for org:', organizationData.id, 'Access:', clientAccess, 'View:', clientViewMode)
    
    // If No Access, don't fetch
    if (clientAccess === 'No Access') {
      setClients([])
      setActiveClientCount(0)
      setDeletedClientCount(0)
      return
    }
    
    // For Own Jobs / Assigned Jobs / Limited, get allowed client names from jobs
    let allowedClientNames: string[] | null = null // null means full access
    
    if (clientAccess === 'Own Jobs' || clientAccess === 'Assigned Jobs' || clientAccess === 'Assigned Only' || clientAccess === 'Limited') {
      const { data: allOrgJobs } = await supabase
        .from('jobs')
        .select('client_name, created_by, assigned_recruiter')
        .eq('organization_id', organizationData.id)
      
      // Get recruiter name for matching
      let recruiterName = ''
      if (userEmail) {
        const { data: recruiterData } = await supabase
          .from('org_team')
          .select('name')
          .eq('email', userEmail)
          .maybeSingle()
        recruiterName = recruiterData?.name || ''
      }
      
      console.log('[v0] fetchClients: All org jobs count:', allOrgJobs?.length, 'recruiterName:', recruiterName, 'userEmail:', userEmail)
      
      const matchedJobs = (allOrgJobs || []).filter(j => {
        if (clientAccess === 'Own Jobs') {
          return (j.created_by || '').toLowerCase().trim() === (userEmail || '').toLowerCase().trim()
        }
        if (clientAccess === 'Assigned Jobs' || clientAccess === 'Assigned Only') {
          const ar = (j.assigned_recruiter || '').toLowerCase().trim()
          return ar === recruiterName.toLowerCase().trim() || ar === (userEmail || '').toLowerCase().trim()
        }
        if (clientAccess === 'Limited') {
          const isOwn = (j.created_by || '').toLowerCase().trim() === (userEmail || '').toLowerCase().trim()
          const ar = (j.assigned_recruiter || '').toLowerCase().trim()
          const isAssigned = ar === recruiterName.toLowerCase().trim() || ar === (userEmail || '').toLowerCase().trim()
          return isOwn || isAssigned
        }
        return false
      })
      
      allowedClientNames = [...new Set(matchedJobs.map(j => j.client_name).filter(Boolean))]
      console.log('[v0] fetchClients: Matched jobs:', matchedJobs.length, 'Allowed client names:', allowedClientNames)
    }
    
    // Fetch clients for current view mode
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('organization_id', organizationData.id)
      .eq('status', clientViewMode)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('[v0] fetchClients: Error:', error)
      setClients([])
    } else {
      let filteredData = data || []
      if (allowedClientNames !== null) {
        // Match by company_name (case-insensitive) OR by checking if client_name contains the company name
        filteredData = filteredData.filter(c => {
          const companyLower = (c.company_name || '').toLowerCase().trim()
          return allowedClientNames!.some(name => {
            const nameLower = name.toLowerCase().trim()
            return companyLower === nameLower || companyLower.includes(nameLower) || nameLower.includes(companyLower)
          })
        })
        console.log('[v0] fetchClients: All clients:', data?.length, 'After filtering:', filteredData.length, 'Names checked:', allowedClientNames)
      }
      setClients(filteredData)
    }
    
    // Fetch counts - also apply filtering for non-full access
    const { data: allActive } = await supabase
      .from('clients')
      .select('company_name')
      .eq('organization_id', organizationData.id)
      .eq('status', 'active')
    
    const { data: allDeleted } = await supabase
      .from('clients')
      .select('company_name')
      .eq('organization_id', organizationData.id)
      .eq('status', 'deleted')
    
    if (allowedClientNames !== null) {
      const activeFiltered = (allActive || []).filter(c => allowedClientNames!.some(name => (c.company_name || '').toLowerCase().trim() === name.toLowerCase().trim()))
      const deletedFiltered = (allDeleted || []).filter(c => allowedClientNames!.some(name => (c.company_name || '').toLowerCase().trim() === name.toLowerCase().trim()))
      setActiveClientCount(activeFiltered.length)
      setDeletedClientCount(deletedFiltered.length)
    } else {
      setActiveClientCount(allActive?.length || 0)
      setDeletedClientCount(allDeleted?.length || 0)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Error',
          description: 'Please upload an image file',
          variant: 'destructive'
        })
        return
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'Image size should be less than 2MB',
          variant: 'destructive'
        })
        return
      }

      const userStr = localStorage.getItem('hyrix_user')
      if (!userStr) return

      const user = JSON.parse(userStr)
      const fileName = `${user.email.replace('@', '_')}_${Date.now()}.${file.name.split('.').pop()}`

      const supabase = createClient() // Declare supabase variable
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('hyrix_org_logo')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        toast({
          title: 'Error',
          description: 'Failed to upload logo',
          variant: 'destructive'
        })
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('hyrix_org_logo')
        .getPublicUrl(fileName)

      // Update organization with logo URL
      const { data: orgData } = await supabase
        .from('organization')
        .select('id')
        .eq('email', user.email)
        .single()

      if (orgData) {
        const { error: updateError } = await supabase
          .from('organization')
          .update({ logo_url: publicUrl })
          .eq('id', orgData.id)

        if (updateError) {
          console.error('Update error:', updateError)
          toast({
            title: 'Error',
            description: 'Failed to save logo URL',
            variant: 'destructive'
          })
          return
        }

        setCompanyInfo({ ...companyInfo, logo_url: publicUrl })
        toast({
          title: 'Success',
          description: 'Company logo updated successfully'
        })
      }
    } catch (error) {
      console.error('Logo upload error:', error)
      toast({
        title: 'Error',
        description: 'An error occurred while uploading logo',
        variant: 'destructive'
      })
  }
  }
  
  // Create Team functions
  const fetchLocationsAndUsers = async () => {
    const supabase = createClient()
    
    // Fetch all cities from cities table
    const { data: citiesData, error: citiesError } = await supabase
      .from('cities')
      .select('id, name')
      .order('name', { ascending: true })
    
    if (citiesData) {
      setCities(citiesData)
    }
    
    // Fetch unique locations from org_team - use neq to avoid null locations
    const { data: teamData } = await supabase
      .from('org_team')
      .select('location')
      .eq('organization_id', organizationData?.id)
      .neq('location', '')
    
    if (teamData) {
      const uniqueLocations = [...new Set(teamData.map((t: any) => t.location).filter(Boolean))]
      setAvailableLocations(uniqueLocations)
    }
    
    // Fetch teams for the "Assign to Team" dropdown
    const { data: teamsData, error: teamsError } = await supabase
      .from('teams')
      .select('id, team_name')
      .eq('organization_id', organizationData?.id)
      .order('team_name', { ascending: true })
    
    if (teamsData) {
      setTeams(teamsData)
    }
  }

  const fetchHiringManagersAndRecruiters = async (location: string) => {
    const supabase = createClient()
    
    // First try fetching by exact location match
    const { data: managersForLocation } = await supabase
      .from('org_team')
      .select('id, name, email, location')
      .eq('organization_id', organizationData?.id)
      .eq('role', 'hiring_manager')
      .eq('location', location)
    
    // If no managers found for that location, fall back to all managers in org
    if (managersForLocation && managersForLocation.length > 0) {
      setAvailableHiringManagers(managersForLocation)
    } else {
      const { data: allManagers } = await supabase
        .from('org_team')
        .select('id, name, email, location')
        .eq('organization_id', organizationData?.id)
        .eq('role', 'hiring_manager')
      setAvailableHiringManagers(allManagers || [])
    }
    
    // First try fetching recruiters by exact location match
    const { data: recruitersForLocation } = await supabase
      .from('org_team')
      .select('id, name, email, location')
      .eq('organization_id', organizationData?.id)
      .eq('role', 'recruiter')
      .eq('location', location)
    
    // If no recruiters found for that location, fall back to all recruiters in org
    if (recruitersForLocation && recruitersForLocation.length > 0) {
      setAvailableRecruiters(recruitersForLocation)
    } else {
      const { data: allRecruiters } = await supabase
        .from('org_team')
        .select('id, name, email, location')
        .eq('organization_id', organizationData?.id)
        .eq('role', 'recruiter')
      setAvailableRecruiters(allRecruiters || [])
    }
  }

  const fetchVendorsForLocation = async (location: string) => {
    if (!organizationData?.id) return
    setLoadingVendors(true)
    try {
      const res = await fetch(`/api/vendors?organizationId=${organizationData.id}`)
      const data = await res.json()
      if (data.success) {
        // Show all vendors but mark ones matching location
        setAvailableVendors(data.vendors || [])
      }
    } catch {
      setAvailableVendors([])
    } finally {
      setLoadingVendors(false)
    }
  }

  const handleCreateTeam = async () => {
    // Validate form
    const errors = {
      team_name: '',
      location: '',
      hiring_manager_id: '',
      recruiter_ids: ''
    }
    
    if (!teamForm.team_name.trim()) {
      errors.team_name = 'Team name is required'
    }
    if (!teamForm.location) {
      errors.location = 'Location is required'
    }
    if (!teamForm.hiring_manager_id) {
      errors.hiring_manager_id = 'Hiring manager is required'
    }
    if (teamForm.recruiter_ids.length === 0) {
      errors.recruiter_ids = 'At least one recruiter must be selected'
    }
    
    setTeamFormErrors(errors)
    
    if (Object.values(errors).some(err => err !== '')) {
      return
    }
    
    setCreatingTeam(true)
    const supabase = createClient()
    
    try {
      // Check for duplicate team name in location
      const { data: existingTeam } = await supabase
        .from('teams')
        .select('id')
        .eq('team_name', teamForm.team_name)
        .eq('location', teamForm.location)
        .eq('organization_id', organizationData?.id)
        .single()
      
      if (existingTeam) {
        setTeamFormErrors({
          ...errors,
          team_name: 'Team name already exists in this location'
        })
        setCreatingTeam(false)
        return
      }
      
      // Create team
      const { data: newTeam, error: teamError } = await supabase
        .from('teams')
        .insert({
          team_name: teamForm.team_name,
          location: teamForm.location,
          hiring_manager_id: teamForm.hiring_manager_id,
          organization_id: organizationData?.id
        })
        .select()
        .single()
      
      if (teamError) throw teamError
      
      // Assign recruiters by updating team_id in org_team
      if (teamForm.recruiter_ids.length > 0) {
        const { error: recruitersError } = await supabase
          .from('org_team')
          .update({ team_id: newTeam.id })
          .in('id', teamForm.recruiter_ids)

        if (recruitersError) throw recruitersError
      }
      
      toast({
        title: 'Success',
        description: `Team "${teamForm.team_name}" created successfully with ${teamForm.recruiter_ids.length} recruiter(s).`
      })
      
      // Reset form and close modal
      setTeamForm({
        team_name: '',
        location: '',
        hiring_manager_id: '',
        recruiter_ids: [],
        vendor_ids: []
      })
      setAvailableVendors([])
      setTeamFormErrors({
        team_name: '',
        location: '',
        hiring_manager_id: '',
        recruiter_ids: ''
      })
      setSelectAllRecruiters(false)
      setShowCreateTeamModal(false)
      
    } catch (error: any) {
      console.error('[v0] Error creating team:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to create team',
        variant: 'destructive'
      })
    } finally {
      setCreatingTeam(false)
    }
  }

  // Fetch all teams for View Teams
  const fetchAllTeams = async () => {
    setLoadingTeams(true)
    try {
      const supabase = createClient()
      
      // Fetch teams with hiring manager info
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .eq('organization_id', organizationData?.id)
        .order('created_at', { ascending: false })

      if (teamsError) throw teamsError

      // For each team, fetch hiring manager name and recruiter count
      const teamsWithDetails = await Promise.all(
        (teamsData || []).map(async (team: any) => {
          // Get hiring manager name
          const { data: managerData } = await supabase
            .from('org_team')
            .select('name, email')
            .eq('id', team.hiring_manager_id)
            .single()

          // Get recruiter count directly from org_team using team_id
          const { count } = await supabase
            .from('org_team')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', team.id)

          return {
            ...team,
            hiring_manager_name: managerData?.name || 'Unknown',
            hiring_manager_email: managerData?.email || '',
            recruiter_count: count || 0
          }
        })
      )

      setAllTeams(teamsWithDetails)
    } catch (error: any) {
      console.error('Error fetching teams:', error)
      toast({ title: 'Error', description: 'Failed to fetch teams', variant: 'destructive' })
    } finally {
      setLoadingTeams(false)
    }
  }

  // Fetch team members for a specific team
  const fetchTeamMembers = async (teamId: string, hiringManagerId: string) => {
    setLoadingTeamMembers(true)
    try {
      const supabase = createClient()
      
      // Fetch all members assigned to this team directly from org_team
      const { data: membersData, error: membersError } = await supabase
        .from('org_team')
        .select('id, name, email, role, location, department')
        .eq('team_id', teamId)
        .eq('organization_id', organizationData?.id)

      if (membersError) throw membersError

      // Mark the hiring manager
      const members = (membersData || []).map((member: any) => ({
        ...member,
        team_role: member.id === hiringManagerId ? 'Hiring Manager' : 'Recruiter'
      }))

      // Sort: hiring manager first
      members.sort((a: any, b: any) => {
        if (a.team_role === 'Hiring Manager') return -1
        if (b.team_role === 'Hiring Manager') return 1
        return 0
      })

      setSelectedTeamMembers(members)
    } catch (error: any) {
      console.error('Error fetching team members:', error)
      toast({ title: 'Error', description: 'Failed to fetch team members', variant: 'destructive' })
    } finally {
      setLoadingTeamMembers(false)
    }
  }

  // Fetch available members — active recruiters in same location, not yet assigned to any team
  const fetchAvailableMembers = async () => {
    try {
      // Build filters: org + active + no team_id + location match (if team has a location)
      const filters: any[] = [
        { column: 'organization_id', op: '=', value: organizationData?.id },
        { column: 'status', op: '=', value: 'active' },
      ]
      // Only filter by location if the selected team has a location set
      if (selectedTeam?.location) {
        filters.push({ column: 'location', op: '=', value: selectedTeam.location })
      }

      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          op: 'select',
          table: 'org_team',
          select: 'id,name,email,role,location,status,team_id',
          filters,
          orders: [{ column: 'name', ascending: true }],
        }),
        cache: 'no-store',
      })
      const json = await res.json()
      // Only show members not already assigned to a team
      const unassigned = (json.data || []).filter((m: any) => !m.team_id)
      setAvailableMembers(unassigned)
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to fetch available members', variant: 'destructive' })
    }
  }

  // Add members to team (supports multiple)
  const handleAddMembersToTeam = async () => {
    if (selectedMembersToAdd.length === 0 || !selectedTeam) return

    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          op: 'update',
          table: 'org_team',
          data: { team_id: selectedTeam.id },
          filters: [{ column: 'id', op: 'in', value: selectedMembersToAdd }],
        }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error.message)

      toast({ title: `${selectedMembersToAdd.length} member(s) added to team` })
      setShowAddMemberDialog(false)
      setSelectedMembersToAdd([])
      fetchTeamMembers(selectedTeam.id, selectedTeam.hiring_manager_id)
    } catch (error: any) {
      console.error('Error adding members to team:', error)
      toast({ title: 'Error', description: 'Failed to add members to team', variant: 'destructive' })
    }
  }

  // Toggle member selection
  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembersToAdd(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  const handleSaveCompanyInfo = async () => {
    if (!organizationData) return
    
    const supabase = createClient()
    const { error } = await supabase
      .from('organization')
      .update({
        name: companyInfo.name,
        phone: companyInfo.phone,
      website: companyInfo.website,
      address: companyInfo.address,
      city: companyInfo.city,
      state: companyInfo.state,
      country: companyInfo.country,
      industry: companyInfo.industry,
      gst: companyInfo.gst,
      logo_url: companyInfo.logo_url,
      company_overview: companyInfo.company_overview,
      updated_at: new Date().toISOString()
    })
      .eq('id', organizationData.id)
    
    if (error) {
      console.error('[v0] Error updating company info:', error)
      toast({
        title: 'Error',
        description: 'Failed to update company information',
        variant: 'destructive'
      })
    } else {
      toast({
        title: 'Success',
        description: 'Company information updated successfully',
      })
      setIsEditingCompanyInfo(false)
      fetchOrganizationData()
    }
  }

  const handleSaveNotifications = () => {
    toast({
      title: 'Preferences Updated',
      description: 'Notification settings have been saved.',
    })
  }

  const handleSaveSecurity = () => {
    toast({
      title: 'Security Updated',
      description: 'Security settings have been applied.',
    })
  }

  const handleSaveClient = async () => {
    if (!organizationData) return
    
    // Reset errors
    const errors = {
      company_name: false,
      industry: false,
      address: false,
      email: false,
      contactName: false,
      phone: false
    }
    
    // Validate required fields
    const missingFields: string[] = []
    
    if (!clientForm.company_name || clientForm.company_name.trim() === '') {
      missingFields.push('Company Name')
      errors.company_name = true
    }
    
    if (!clientForm.industry || clientForm.industry.trim() === '') {
      missingFields.push('Industry')
      errors.industry = true
    }
    
    if (!clientForm.address || clientForm.address.trim() === '') {
      missingFields.push('Address')
      errors.address = true
    }
    
    if (clientForm.contacts.length === 0) {
      missingFields.push('at least one Contact (Email)')
      errors.email = true
      errors.contactName = true
      errors.phone = true
    } else {
      // Check if first contact has valid email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const firstContact = clientForm.contacts[0]
      if (!firstContact.email || !emailRegex.test(firstContact.email)) {
        missingFields.push('Valid Email Address')
        errors.email = true
      }
      
      // Check for contact name
      if (!firstContact.contactName || firstContact.contactName.trim() === '') {
        missingFields.push('Contact Name')
        errors.contactName = true
      }
      
      // Check for phone number
      if (!firstContact.phone || firstContact.phone.trim() === '') {
        missingFields.push('Phone Number')
        errors.phone = true
      }
    }
    
    if (missingFields.length > 0) {
      setClientFormErrors(errors)
      toast({
        title: 'Missing Required Fields',
        description: `Please fill the following fields to submit: ${missingFields.join(', ')}`,
        variant: 'destructive',
      })
      return
    }
    
    // Clear errors if validation passes
    setClientFormErrors({
      company_name: false,
      industry: false,
      address: false,
      email: false,
      contactName: false,
      phone: false
    })
    
    // Validate all contacts have valid emails
    const validContacts = clientForm.contacts.filter(c => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return c.email && emailRegex.test(c.email)
    })
    
    if (validContacts.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'At least one valid email is required',
        variant: 'destructive'
      })
      return
    }
    
    // Convert contacts to JSON strings for storage
    const emailsJson = JSON.stringify(validContacts.map(c => c.email))
    const contactNamesJson = JSON.stringify(validContacts.map(c => c.contactName || ''))
    const phonesJson = JSON.stringify(validContacts.map(c => c.phone && c.countryCode ? `${c.countryCode}${c.phone}` : '').filter(p => p))
    
    const supabase = createClient()
    
    if (isEditingClient) {
      // Update existing client
      const { error: updateError } = await supabase
        .from('clients')
        .update({
          company_name: clientForm.company_name,
          email: emailsJson,
          contact_name: contactNamesJson,
          phone: phonesJson,
          address: clientForm.address,
          industry: clientForm.industry,
          gst: clientForm.gst,
          company_overview: clientForm.company_overview,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientForm.id)
      
      if (updateError) {
        console.error('[v0] Error updating client:', updateError)
        toast({
          title: 'Error',
          description: 'Failed to update client',
          variant: 'destructive'
        })
      } else {
        toast({
          title: 'Success',
          description: 'Client updated successfully',
        })
          setIsClientFormOpen(false)
          setClientForm({ id: '', company_name: '', contacts: [], address: '', industry: '', gst: '', company_overview: '' })
          setIsEditingClient(false)
        setEditingClientId(null) // Close inline edit form
        fetchClients()
      }
    } else {
      // Create new client
      const { error } = await supabase
        .from('clients')
        .insert({
          organization_id: organizationData.id,
          company_name: clientForm.company_name,
          email: emailsJson,
          contact_name: contactNamesJson,
          phone: phonesJson,
          address: clientForm.address,
          industry: clientForm.industry,
          gst: clientForm.gst,
          company_overview: clientForm.company_overview,
          status: 'active'
        })
      
      if (error) {
        console.error('[v0] Error creating client:', error)
        toast({
          title: 'Error',
          description: 'Failed to create client',
          variant: 'destructive'
        })
      } else {
        toast({
          title: 'Success',
          description: 'Client added successfully',
        })
        setIsClientFormOpen(false)
        setClientForm({ id: '', company_name: '', contacts: [], address: '', industry: '', gst: '' })
        fetchClients()
      }
    }
  }
  
  const handleEditClient = (client: any) => {
    console.log('[v0] handleEditClient: Editing client:', client.company_name, client.id)
    
    // Parse email, contact_name, and phone from JSON strings
    let contacts: Array<{email: string, contactName: string, phone: string, countryCode: string, emailError: string, phoneError: string}> = []
    
    try {
      // Helper function to safely parse JSON or return plain value
      const safeParse = (value: string | null | undefined): string[] => {
        if (!value) return []
        
        // Check if it's already a JSON array
        if (value.trim().startsWith('[')) {
          try {
            const parsed = JSON.parse(value)
            return Array.isArray(parsed) ? parsed : [parsed]
          } catch {
            return [value]
          }
        }
        
        // It's a plain string, return as single-item array
        return [value]
      }
      
      const emails = safeParse(client.email)
      const contactNames = safeParse(client.contact_name)
      const phones = safeParse(client.phone)
      
      console.log('[v0] handleEditClient: Parsed data - emails:', emails, 'names:', contactNames, 'phones:', phones)
      
      // Map the arrays to contacts
      contacts = emails.map((email: string, index: number) => {
        const phone = phones[index] || ''
        let countryCode = '+91'
        let phoneNumber = phone
        
        // Try to extract country code from phone
        if (phone) {
          const phoneRegex = /^(\+\d{1,4})(.*)$/
          const match = phone.match(phoneRegex)
          if (match) {
            countryCode = match[1]
            phoneNumber = match[2]
          }
        }
        
        return {
          email,
          contactName: contactNames[index] || '',
          phone: phoneNumber,
          countryCode,
          emailError: '',
          phoneError: ''
        }
      })
    } catch (e) {
      console.error('[v0] handleEditClient: Error parsing client data:', e)
      // Fallback for old format
      contacts = [{email: client.email || '', contactName: '', phone: '', countryCode: '+91', emailError: '', phoneError: ''}]
    }
    
    if (contacts.length === 0) {
      contacts = [{email: '', contactName: '', phone: '', countryCode: '+91', emailError: '', phoneError: ''}]
    }
    
    console.log('[v0] handleEditClient: Setting form with contacts:', contacts)
    
    setClientForm({
      id: client.id,
      company_name: client.company_name,
      contacts,
      address: client.address || '',
      industry: client.industry || '',
      gst: client.gst || '',
      company_overview: client.company_overview || ''
    })
    setIsEditingClient(true)
    setIsClientFormOpen(true)
  }
  
  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client? You can restore it later from the Deleted Clients view.')) return
    
    console.log('[v0] handleDeleteClient: Starting soft delete for client:', clientId)
    
    const supabase = createClient()
    const { error, data } = await supabase
      .from('clients')
      .update({ status: 'deleted', updated_at: new Date().toISOString() })
      .eq('id', clientId)
      .select()
    
    console.log('[v0] handleDeleteClient: Update result:', { error, data })
    
    if (error) {
      console.error('[v0] handleDeleteClient: Error soft-deleting client:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete client',
        variant: 'destructive'
      })
    } else {
      console.log('[v0] handleDeleteClient: Client successfully moved to deleted status')
      toast({
        title: 'Success',
        description: 'Client moved to deleted history. You can restore it from the Deleted Clients view.',
      })
      fetchClients()
    }
  }
  
  const handleRestoreClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to restore this client?')) return
    
    console.log('[v0] handleRestoreClient: Starting restore for client:', clientId)
    
    const supabase = createClient()
    const { error, data } = await supabase
      .from('clients')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', clientId)
      .select()
    
    console.log('[v0] handleRestoreClient: Update result:', { error, data })
    
    if (error) {
      console.error('[v0] handleRestoreClient: Error restoring client:', error)
      toast({
        title: 'Error',
        description: 'Failed to restore client',
        variant: 'destructive'
      })
    } else {
      console.log('[v0] handleRestoreClient: Client successfully restored to active status')
      toast({
        title: 'Success',
        description: 'Client restored successfully',
      })
      fetchClients()
    }
  }
  
  const handlePermanentDeleteClient = async (clientId: string) => {
    if (!confirm('⚠️ WARNING: This will PERMANENTLY delete this client from the database. This action CANNOT be undone. Are you absolutely sure?')) return
    
    console.log('[v0] handlePermanentDeleteClient: Starting permanent deletion for client:', clientId)
    
    const supabase = createClient()
    const { error, data } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)
      .select()
    
    console.log('[v0] handlePermanentDeleteClient: Delete result:', { error, data })
    
    if (error) {
      console.error('[v0] handlePermanentDeleteClient: Error permanently deleting client:', error)
      toast({
        title: 'Error',
        description: 'Failed to permanently delete client',
        variant: 'destructive'
      })
    } else {
      console.log('[v0] handlePermanentDeleteClient: Client permanently deleted from database')
      toast({
        title: 'Success',
        description: 'Client permanently deleted from database',
      })
      fetchClients()
    }
  }
  
  const handleEditMember = async (member: any) => {
    const memberStatus = member.status || 'active'
    console.log('[v0] handleEditMember: Loading member data including team_id:', member.team_id)
    
    // Fetch cities and teams before showing the form
    await fetchLocationsAndUsers()
    
    setNewUser({
      name: member.name,
      email: member.email,
      phone: member.phone,
      role: member.role,
      department: member.department,
      location: member.location || '',
      password: '', // Don't pre-fill password for security
      status: memberStatus,
      team_id: member.team_id || ''
    })
    setOriginalStatus(memberStatus)
    setIsEditingTeamMember(true)
    setEditingMemberId(member.id)
    setCurrentView('add-member')
    setMemberCitySearch('')
    setShowMemberCityDropdown(false)
  }

  const handleCreateUser = async () => {
    if (!organizationData) return
    
    // Validate required fields
    if (!newUser.name || !newUser.email) {
      toast({
        title: 'Validation Error',
        description: 'Name and email are required',
        variant: 'destructive'
      })
      return
    }
    
    // If editing existing member
    if (isEditingTeamMember && editingMemberId) {
      // Prevent any changes if original status was revoked
      if (originalStatus === 'revoked') {
        toast({
          title: 'Cannot Update',
          description: 'Revoked users cannot be modified. This action is permanent.',
          variant: 'destructive'
        })
        return
      }

      const supabase = createClient()
  const updateData: any = {
    name: toTitleCase(newUser.name),
    email: newUser.email.trim().toLowerCase(),
    phone: newUser.phone,
    role: newUser.role,
    location: newUser.location,
    department: newUser.department,
    status: newUser.status || 'active',
    team_id: newUser.team_id || null
  }
  
  // Only update password if a new one is provided
  if (newUser.password) {
    const hashedPassword = await bcrypt.hash(newUser.password, 10)
    updateData.password = hashedPassword
  }
  
  const { error } = await supabase
    .from('org_team')
    .update(updateData)
    .eq('id', editingMemberId)
  
  if (error) {
    toast({
      title: 'Error',
      description: error.message || 'Failed to update team member',
      variant: 'destructive'
    })
  } else {
      
      toast({
        title: 'Member Updated',
        description: `${newUser.name} has been updated successfully.`,
      })
      setNewUser({ name: '', email: '', phone: '', role: 'recruiter', location: '', department: '', password: '', status: 'active', team_id: '' })
      setIsEditingTeamMember(false)
      setEditingMemberId(null)
      setOriginalStatus('active')
      setCurrentView('team')
    }
      return
    }
    
    // Validate password for new users
    if (!newUser.password) {
      toast({
        title: 'Validation Error',
        description: 'Password is required for new users',
        variant: 'destructive'
      })
      return
    }
    
    // Hash password using bcrypt (browser-compatible)
    const hashedPassword = await bcrypt.hash(newUser.password, 10)

    // Check if user with this email already exists (direct fetch — bypasses shim)
    const checkRes = await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        op: 'select',
        table: 'org_team',
        select: 'email,status',
        filters: [
          { column: 'email', op: '=', value: newUser.email.trim().toLowerCase() },
          { column: 'organization_id', op: '=', value: organizationData.id },
        ],
        limit: 1,
      }),
      cache: 'no-store',
    })
    const checkJson = await checkRes.json()
    const existingUser = checkJson.data?.[0]

    if (existingUser) {
      if (existingUser.status === 'revoked') {
        toast({
          title: 'Account Revoked',
          description: 'This account has been revoked. Please reactivate the user from the Revoked tab first.',
          variant: 'destructive',
        })
      } else {
        toast({ title: 'Error', description: 'A user with this email already exists', variant: 'destructive' })
      }
      return
    }

    // Insert new team member
    const insertRes = await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        op: 'insert',
        table: 'org_team',
        data: {
          name: toTitleCase(newUser.name),
          email: newUser.email.trim().toLowerCase(),
          phone: newUser.phone,
          role: newUser.role,
          location: newUser.location,
          department: newUser.department,
          password: hashedPassword,
          organization_id: organizationData.id,
          status: 'active',
          joined_date: new Date().toISOString(),
          team_id: newUser.team_id || null,
        },
      }),
    })
    const insertJson = await insertRes.json()

    if (insertJson.error) {
      toast({
        title: 'Error',
        description: insertJson.error.message || 'Failed to create team member',
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Team member created', description: `${newUser.name} has been added to your team.` })
      setNewUser({ name: '', email: '', phone: '', role: 'recruiter', location: '', department: '', password: '', status: 'active', team_id: '' })
      setCurrentView('team')
    }
  }

  const handleAddUser = async () => {
    // Check for validation errors
    if (teamMemberEmailError) {
      toast({
        title: 'Validation Error',
        description: teamMemberEmailError,
        variant: 'destructive',
      })
      return
    }
    
    if (teamMemberPhoneError) {
      toast({
        title: 'Validation Error',
        description: teamMemberPhoneError,
        variant: 'destructive',
      })
      return
    }
    
    // Check if phone is 10 digits
    const phoneDigits = newUser.phone.replace(/\D/g, '').replace(teamMemberCountryCode.replace('+', ''), '')
    if (phoneDigits && phoneDigits.length !== 10) {
      toast({
        title: 'Validation Error',
        description: 'Phone number must be exactly 10 digits',
        variant: 'destructive',
      })
      return
    }
    
    await handleCreateUser()
  }

  const settingsCards = [
    {
      id: 'email-settings',
      title: 'Email Settings',
      icon: Inbox,
      iconColor: 'text-sky-600',
      iconBg: 'bg-sky-100',
      description: 'Configure IMAP inbox to auto-fetch resumes from email',
      keywords: 'email imap inbox resume fetch auto import',
    },
    {
      id: 'company',
      title: 'Company Information',
      icon: Building2,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      description: 'Update organization details and branding',
      keywords: 'company name logo address city state gst industry overview organization branding',
    },
    {
      id: 'notifications',
      title: 'Notification Preferences',
      icon: Bell,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100',
      description: 'Control how you receive updates and alerts',
      keywords: 'notification email alert updates preferences',
    },
    {
      id: 'manage-client',
      title: 'Manage Clients',
      icon: Briefcase,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-50',
      description: 'Add and manage your client companies',
      keywords: 'client company add edit delete manage',
    },
    {
      id: 'bd-lead-setup',
      title: 'Business Development',
      icon: TrendingUp,
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-100',
      description: 'Add and manage potential client leads for BD pipeline',
      keywords: 'business development lead client potential crm bd pipeline linkedin referral',
    },
    {
      id: 'team',
      title: 'Manage Team',
      icon: Users,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-100',
      description: 'View and manage your team members',
      keywords: 'team member recruiter hiring manager account employee add remove',
    },
    {
      id: 'domain-whitelist',
      title: 'Domain Whitelisting',
      icon: Globe,
      iconColor: 'text-teal-600',
      iconBg: 'bg-teal-100',
      description: 'Manage allowed email domains for team members',
      keywords: 'domain whitelist email allowed restrict',
    },
    {
      id: 'security',
      title: 'Security Settings',
      icon: Shield,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
      description: 'Configure security and access controls',
      keywords: 'security password access control login authentication',
    },
    {
      id: 'role-permissions',
      title: 'Role & Permissions',
      icon: Shield,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100',
      description: 'Configure access levels for each role',
      keywords: 'role permission access level admin recruiter manager',
    },
    {
      id: 'templates',
      title: 'Templates',
      icon: FileText,
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-100',
      description: 'Manage email and document templates',
      keywords: 'template email document offer letter',
    },
    {
      id: 'vendor-management',
      title: 'Vendor Management',
      icon: Briefcase,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100',
      description: 'Manage vendors, GST, PAN and business documents',
      keywords: 'vendor gst pan cin certificate document business supplier',
    },
  ]

  // Determine if user has full CRUD access to clients
  const clientAccessLevel = getAccessLevel('Manage Clients')
  const isClientFullAccess = clientAccessLevel === 'Create / Edit / Delete' || clientAccessLevel === 'Full' || clientAccessLevel === 'Yes'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (currentView === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2">
              Manage your {organizationData?.name || 'organization'} settings and preferences
            </p>
          </div>

          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search settings..."
              value={settingsSearchQuery}
              onChange={(e) => setSettingsSearchQuery(e.target.value)}
              className="w-full pl-12 pr-10 h-11 rounded-full bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {settingsSearchQuery && (
              <button
                  onClick={() => setSettingsSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
>
                  <X className="h-4 w-4" />
                  </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {settingsCards.filter((card) => {
              // Domain whitelisting controlled by permissions (default: super_admin only)
              if (card.id === 'domain-whitelist' && !hasModuleAccess('Domain Whitelisting')) return false
              if (!settingsSearchQuery.trim()) return true
              const q = settingsSearchQuery.toLowerCase()
              return card.title.toLowerCase().includes(q) || card.description.toLowerCase().includes(q) || (card.keywords && card.keywords.toLowerCase().includes(q))
            }).map((card) => {
              const Icon = card.icon
              return (
                <Card
                  key={card.id}
                  className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group border-gray-200 bg-white"
                  onClick={() => setCurrentView(card.id as SettingsView)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${card.iconBg} group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className={`h-6 w-6 ${card.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">{card.description}</p>
                  </div>
                </div>
              </Card>
              )
          })}
          {settingsSearchQuery.trim() && settingsCards.filter((card) => {
            const q = settingsSearchQuery.toLowerCase()
            return card.title.toLowerCase().includes(q) || card.description.toLowerCase().includes(q) || (card.keywords && card.keywords.toLowerCase().includes(q))
          }).length === 0 && (
            <div className="col-span-full text-center py-16">
              <Search className="h-12 w-12 text-gray-200 mx-auto mb-4" />
              <p className="text-base font-medium text-gray-500">No settings found for "{settingsSearchQuery}"</p>
              <p className="text-sm text-gray-400 mt-1">Try searching for "team", "security", "domain", or "template"</p>
            </div>
          )}
        </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
  {/* Back Button - hide for views that have their own back button */}
  {currentView !== 'team' && currentView !== 'templates' && currentView !== 'role-permissions' && (
  <Button
  variant="ghost"
  onClick={() => setCurrentView('menu')}
  className="gap-2 mb-4"
  >
  <ArrowLeft className="h-4 w-4" />
  Back to Settings
  </Button>
  )}

  {/* Company Information */}
  {currentView === 'company' && !hasModuleAccess('Company Settings') && (
  <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
    <Lock className="h-16 w-16 text-gray-400" />
    <div className="text-center">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
      <p className="text-sm text-gray-600">You don't have permission to view Company Settings.</p>
    </div>
    <Button variant="outline" onClick={() => setCurrentView('menu')}>
      <ArrowLeft className="h-4 w-4 mr-2" /> Back to Settings
    </Button>
  </div>
  )}
  {currentView === 'company' && hasModuleAccess('Company Settings') && (
  <Card className="p-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <input
                type="file"
                id="logo-upload"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <label
                htmlFor="logo-upload"
                className="relative cursor-pointer group flex-shrink-0"
                title="Click to upload company logo"
              >
                <div className="bg-blue-100 rounded-lg w-16 h-16 flex items-center justify-center overflow-hidden group-hover:bg-blue-200 transition-colors border-2 border-blue-200">
                  {companyInfo.logo_url ? (
                    <img 
                      src={companyInfo.logo_url || "/placeholder.svg"} 
                      alt="Company Logo" 
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <Building2 className="h-8 w-8 text-blue-600" />
                  )}
                </div>
                <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Upload className="h-5 w-5 text-white" />
                </div>
              </label>
              <div>
                <h3 className="text-lg font-semibold">Company Information</h3>
                <p className="text-sm text-gray-500">
                  {isEditingCompanyInfo ? 'Update your organization details' : 'View your organization details'}
                </p>
              </div>
            </div>
            {!isEditingCompanyInfo && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditingCompanyInfo(true)}
                className="hover:bg-blue-50"
              >
                <Edit className="h-5 w-5 text-blue-600" />
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  value={companyInfo.name}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                  disabled={!isEditingCompanyInfo}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="company-email"
                    type="email"
                    className="pl-9 h-9"
                    value={companyInfo.email}
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company-phone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="company-phone"
                    className="pl-9 h-9"
                    value={companyInfo.phone}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                    disabled={!isEditingCompanyInfo}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-website">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="company-website"
                    className="pl-9 h-9"
                    value={companyInfo.website}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, website: e.target.value })}
                    disabled={!isEditingCompanyInfo}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-address">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="company-address"
                  className="pl-9 h-9"
                  value={companyInfo.address}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                  disabled={!isEditingCompanyInfo}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="company-city">City</Label>
                <Input
                  id="company-city"
                  value={companyInfo.city}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, city: e.target.value })}
                  disabled={!isEditingCompanyInfo}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-state">State</Label>
                <Input
                  id="company-state"
                  value={companyInfo.state}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, state: e.target.value })}
                  disabled={!isEditingCompanyInfo}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-country">Country</Label>
                <Input
                  id="company-country"
                  value={companyInfo.country}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, country: e.target.value })}
                  disabled={!isEditingCompanyInfo}
                  className="h-9"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2" data-dropdown-container>
                <Label htmlFor="company-industry">Industry</Label>
                <div className="relative">
                  <Input
                    id="company-industry"
                    placeholder="Type to search industries..."
                    value={industryInput || companyInfo.industry}
                    onChange={(e) => {
                      setIndustryInput(e.target.value)
                      setCompanyInfo({ ...companyInfo, industry: e.target.value })
                      if (isEditingCompanyInfo) setShowIndustryDropdown(true)
                    }}
                    onFocus={() => isEditingCompanyInfo && setShowIndustryDropdown(true)}
                    disabled={!isEditingCompanyInfo}
                    className="h-9"
                  />
                  {showIndustryDropdown && isEditingCompanyInfo && industries.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {industries
                        .filter(industry => {
                          const searchTerm = (industryInput || companyInfo.industry || '').toLowerCase()
                          return !searchTerm || industry.name.toLowerCase().includes(searchTerm)
                        })
                        .map(industry => (
                          <div
                            key={industry.id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                            onClick={() => {
                              setCompanyInfo({ ...companyInfo, industry: industry.name })
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
              
              <div className="space-y-2">
                <Label htmlFor="company-gst">GST Number</Label>
                <Input
                  id="company-gst"
                  value={companyInfo.gst}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, gst: e.target.value })}
                  placeholder="Enter GST number (e.g., 22AAAAA0000A1Z5)"
                  disabled={!isEditingCompanyInfo}
                  className="h-9"
                />
              </div>

            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="company-overview" className="text-sm font-medium">Company Overview</Label>
              <textarea
                id="company-overview"
                rows={6}
                value={companyInfo.company_overview}
                onChange={(e) => setCompanyInfo({ ...companyInfo, company_overview: e.target.value })}
                placeholder="Enter a brief overview of your company — mission, values, what makes you unique. This will be auto-populated in job postings."
                disabled={!isEditingCompanyInfo}
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm leading-relaxed ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">This overview will be automatically added to all new job postings.</p>
            </div>
          </div>

          {isEditingCompanyInfo && (
  <div className="flex gap-3">
  <Button onClick={handleSaveCompanyInfo} className="gap-2 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90 text-white">
  <Save className="h-4 w-4" />
  Save Company Information
  </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditingCompanyInfo(false)
                  // Reset form to original data
                  if (organizationData) {
                    setCompanyInfo({
                      name: organizationData.name || '',
                      email: organizationData.email || '',
                      phone: organizationData.phone || organizationData.mobile_number || '',
                      website: organizationData.website || '',
                      address: organizationData.address || '',
                      city: organizationData.city || '',
                      state: organizationData.state || '',
                      country: organizationData.country || '',
                      industry: organizationData.industry || '',
                      gst: organizationData.gst || '',
                      logo_url: organizationData.logo_url || ''
                    })
                  }
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Notification Preferences */}
      {currentView === 'notifications' && (
        <Card className="p-6 max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Bell className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Notification Preferences</h3>
              <p className="text-sm text-gray-500">Manage how you receive updates</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
              <Switch
                checked={notifications.emailNotifications}
                onCheckedChange={(checked) => setNotifications({ ...notifications, emailNotifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">New Applications</p>
                <p className="text-sm text-gray-500">Get notified when candidates apply</p>
              </div>
              <Switch
                checked={notifications.newApplications}
                onCheckedChange={(checked) => setNotifications({ ...notifications, newApplications: checked })}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Status Updates</p>
                <p className="text-sm text-gray-500">Updates on candidate status changes</p>
              </div>
              <Switch
                checked={notifications.statusUpdates}
                onCheckedChange={(checked) => setNotifications({ ...notifications, statusUpdates: checked })}
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Weekly Reports</p>
                <p className="text-sm text-gray-500">Receive weekly performance summaries</p>
              </div>
              <Switch
                checked={notifications.weeklyReports}
                onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyReports: checked })}
              />
            </div>
  
  <Button onClick={handleSaveNotifications} className="gap-2 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90 text-white">
  <Save className="h-4 w-4" />
  Save Preferences
  </Button>
          </div>
        </Card>
      )}

  {/* Manage Client */}
  {currentView === 'manage-client' && !hasModuleAccess('Manage Clients') && (
  <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
    <Lock className="h-16 w-16 text-gray-400" />
    <div className="text-center">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
      <p className="text-sm text-gray-600">You don't have permission to manage clients.</p>
    </div>
    <Button variant="outline" onClick={() => setCurrentView('menu')}>
      <ArrowLeft className="h-4 w-4 mr-2" /> Back to Settings
    </Button>
  </div>
  )}
  {currentView === 'manage-client' && hasModuleAccess('Manage Clients') && (
  <div className="space-y-4 max-w-5xl mx-auto">
  {/* Client Form - Shows FIRST when Add Client is clicked */}
  {isClientFormOpen && (
            <Card ref={clientFormRef} className="p-6 max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">
                  {isEditingClient ? 'Edit Client' : 'Add New Client'}
                </h3>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    setIsClientFormOpen(false)
                    setClientForm({ id: '', company_name: '', contacts: [], address: '', industry: '', gst: '' })
                    setIsEditingClient(false)
                  }}
                  className="bg-transparent"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client-company">Company Name *</Label>
                  <Input
                    id="client-company"
                    value={clientForm.company_name}
                    onChange={(e) => {
                      setClientForm({ ...clientForm, company_name: e.target.value })
                      if (clientFormErrors.company_name) {
                        setClientFormErrors({ ...clientFormErrors, company_name: false })
                      }
                    }}
                    placeholder="Acme Corporation"
                    className={clientFormErrors.company_name ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    required
                  />
                  {clientFormErrors.company_name && (
                    <p className="text-xs text-red-600">Company name is required</p>
                  )}
                </div>
                
                {/* Email and Phone in One Row */}
                {/* Contact Information - Email, Contact Name, Phone in one row */}
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-sm font-medium mb-1">
                    <div className="col-span-4">Email *</div>
                    <div className="col-span-3">Contact Name *</div>
                    <div className="col-span-5">Phone Number *</div>
                  </div>
                  {clientForm.contacts.map((contact, index) => (
                    <div key={index} className="space-y-1">
                      <div className="grid grid-cols-12 gap-2 items-start">
                        {/* Email */}
                        <div className="col-span-4">
                          <Input
                            type="email"
                            value={contact.email}
                            onChange={(e) => {
                              const value = e.target.value
                              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                              const error = value && !emailRegex.test(value) ? 'Invalid email format' : ''
                              const newContacts = [...clientForm.contacts]
                              newContacts[index] = { ...contact, email: value, emailError: error }
                              setClientForm({ ...clientForm, contacts: newContacts })
                              if (index === 0 && clientFormErrors.email) {
                                setClientFormErrors({ ...clientFormErrors, email: false })
                              }
                            }}
                            placeholder="contact@company.com"
                            className={
                              (contact.emailError || (index === 0 && clientFormErrors.email)) 
                                ? 'border-red-500 text-sm h-9 focus-visible:ring-red-500' 
                                : 'text-sm h-9'
                            }
                          />
                        </div>
                        
                        {/* Contact Name */}
                        <div className="col-span-3">
                          <Input
                            type="text"
                            value={contact.contactName}
                            onChange={(e) => {
                              const newContacts = [...clientForm.contacts]
                              newContacts[index] = { ...contact, contactName: e.target.value }
                              setClientForm({ ...clientForm, contacts: newContacts })
                              if (index === 0 && clientFormErrors.contactName) {
                                setClientFormErrors({ ...clientFormErrors, contactName: false })
                              }
                            }}
                            placeholder="John Doe"
                            className={
                              (index === 0 && clientFormErrors.contactName)
                                ? 'border-red-500 text-sm h-9 focus-visible:ring-red-500'
                                : 'text-sm h-9'
                            }
                          />
                        </div>
                        
                {/* Phone Number */}
                <div className="col-span-4 flex gap-1">
                  <div className="relative w-28">
                    <Input
                      value={clientCountryCodeSearches[index] || ''}
                      onChange={(e) => {
                        setClientCountryCodeSearches({ ...clientCountryCodeSearches, [index]: e.target.value })
                        setShowClientCountryCodePopover({ ...showClientCountryCodePopover, [index]: true })
                      }}
                      onFocus={() => {
                        setClientCountryCodeSearches({ ...clientCountryCodeSearches, [index]: '' })
                        setShowClientCountryCodePopover({ ...showClientCountryCodePopover, [index]: true })
                      }}
                      onBlur={() => {
                        setTimeout(() => {
                          setShowClientCountryCodePopover({ ...showClientCountryCodePopover, [index]: false })
                          const selected = COUNTRY_CODES.find(c => c.code === contact.countryCode)
                          setClientCountryCodeSearches({ 
                            ...clientCountryCodeSearches, 
                            [index]: selected ? `${selected.abbr} ${selected.code}` : '' 
                          })
                        }, 200)
                      }}
                      placeholder="Search"
                      className="h-9 text-xs"
                    />
                    {showClientCountryCodePopover[index] && (
                      <div className="absolute z-50 w-[280px] mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-[200px] overflow-y-auto">
                        {(() => {
                          const search = (clientCountryCodeSearches[index] || '').toLowerCase()
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
                                const newContacts = [...clientForm.contacts]
                                newContacts[index] = { ...contact, countryCode: country.code }
                                setClientForm({ ...clientForm, contacts: newContacts })
                                setClientCountryCodeSearches({ 
                                  ...clientCountryCodeSearches, 
                                  [index]: `${country.abbr} ${country.code}` 
                                })
                                setShowClientCountryCodePopover({ ...showClientCountryCodePopover, [index]: false })
                              }}
                              className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 flex items-center gap-2"
                            >
                              <span className="inline-flex items-center justify-center w-8 h-5 text-[10px] font-bold bg-blue-600 text-white rounded">{country.abbr}</span>
                              <span>{country.country} {country.code}</span>
                            </button>
                          ))
                        })()}
                      </div>
                    )}
                  </div>
                          <Input
                            type="tel"
                            value={contact.phone}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^\d]/g, '')
                              const error = value.length > 10 ? 'Max 10 digits' : ''
                              const newContacts = [...clientForm.contacts]
                              newContacts[index] = { ...contact, phone: value, phoneError: error }
                              setClientForm({ ...clientForm, contacts: newContacts })
                              if (index === 0 && clientFormErrors.phone) {
                                setClientFormErrors({ ...clientFormErrors, phone: false })
                              }
                            }}
                            placeholder="1234567890"
                            maxLength={10}
                            className={
                              (contact.phoneError || (index === 0 && clientFormErrors.phone))
                                ? 'border-red-500 text-sm h-9 flex-1 focus-visible:ring-red-500'
                                : 'text-sm h-9 flex-1'
                            }
                          />
                        </div>
                        
                        {/* Add/Remove Button */}
                        <div className="col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              if (index === clientForm.contacts.length - 1) {
                                // Add new contact row
                                setClientForm({ 
                                  ...clientForm, 
                                  contacts: [...clientForm.contacts, { email: '', contactName: '', phone: '', countryCode: '+91', emailError: '', phoneError: '' }] 
                                })
                              } else {
                                // Remove this contact
                                const newContacts = clientForm.contacts.filter((_, i) => i !== index)
                                setClientForm({ ...clientForm, contacts: newContacts })
                              }
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors mt-1"
                          >
                            {index === clientForm.contacts.length - 1 ? (
                              <Plus className="h-5 w-5" />
                            ) : (
                              <X className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {/* Error Messages */}
                      {(contact.emailError || contact.phoneError) && (
                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-4">
                            {contact.emailError && <p className="text-[10px] text-red-600">{contact.emailError}</p>}
                          </div>
                          <div className="col-span-3"></div>
                          <div className="col-span-4">
                            {contact.phoneError && <p className="text-[10px] text-red-600">{contact.phoneError}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client-address">Address *</Label>
                  <Textarea
                    id="client-address"
                    value={clientForm.address}
                    onChange={(e) => {
                      setClientForm({ ...clientForm, address: e.target.value })
                      if (clientFormErrors.address) {
                        setClientFormErrors({ ...clientFormErrors, address: false })
                      }
                    }}
                    placeholder="123 Main St, City, State, ZIP"
                    rows={3}
                    className={clientFormErrors.address ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    required
                  />
                  {clientFormErrors.address && (
                    <p className="text-xs text-red-600">Address is required</p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 relative">
                    <Label htmlFor="client-industry">Industry *</Label>
                    <Input
                      id="client-industry"
                      value={clientForm.industry}
                      onChange={(e) => {
                        const value = e.target.value
                        setClientForm({ ...clientForm, industry: value })
                        setShowIndustryDropdown(value.length > 0)
                        if (clientFormErrors.industry) {
                          setClientFormErrors({ ...clientFormErrors, industry: false })
                        }
                      }}
                      onFocus={() => {
                        if (clientForm.industry.length > 0) {
                          setShowIndustryDropdown(true)
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowIndustryDropdown(false), 200)
                      }}
                      placeholder="Start typing to search..."
                      className={clientFormErrors.industry ? 'text-sm border-red-500 focus-visible:ring-red-500' : 'text-sm'}
                      autoComplete="off"
                    />
                    {clientFormErrors.industry && (
                      <p className="text-xs text-red-600">Industry is required</p>
                    )}
                    {showIndustryDropdown && clientForm.industry && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {industries
                          .filter(ind => 
                            ind.name.toLowerCase().includes(clientForm.industry.toLowerCase())
                          )
                          .map((industry) => (
                            <button
                              key={industry.id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault()
                                console.log('[v0] Industry selected:', industry.name)
                                setClientForm({ ...clientForm, industry: industry.name })
                                setShowIndustryDropdown(false)
                              }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                            >
                              {industry.name}
                            </button>
                          ))}
                        {industries.filter(ind => 
                          ind.name.toLowerCase().includes(clientForm.industry.toLowerCase())
                        ).length === 0 && (
                          <div className="px-4 py-2 text-sm text-gray-500">
                            No industries found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
              <div className="space-y-2">
                <Label htmlFor="client-gst">GST Number</Label>
                <Input
                  id="client-gst"
                  value={clientForm.gst}
                  onChange={(e) => setClientForm({ ...clientForm, gst: e.target.value })}
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="client-company-overview">Company Overview</Label>
              <textarea
                id="client-company-overview"
                rows={4}
                value={clientForm.company_overview}
                onChange={(e) => setClientForm({ ...clientForm, company_overview: e.target.value })}
                placeholder="Enter a brief overview of the client company..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </div>
            
            <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleSaveClient}
                    className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90 text-white"
                    size="default"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isEditingClient ? 'Update Client' : 'Save Client'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsClientFormOpen(false)
                      setClientForm({ id: '', company_name: '', contacts: [], address: '', industry: '', gst: '' })
                      setIsEditingClient(false)
                    }}
                    className="bg-transparent"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}
          
          {/* Client List Card - Shows ONLY when form is closed */}
          {!isClientFormOpen && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Manage Clients</h3>
                <p className="text-sm text-gray-500">View and manage your client companies</p>
              </div>
              {isClientFullAccess && (
              <Button 
                onClick={() => {
  setClientForm({ id: '', company_name: '', contacts: [{email: '', contactName: '', phone: '', countryCode: '+91', emailError: '', phoneError: ''}], address: '', industry: '', gst: '' })
  setIsEditingClient(false)
  setIsClientFormOpen(true)
  }}
                className="gap-2 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90 text-white"
              >
                <Plus className="h-4 w-4" />
                Add Client
              </Button>
              )}
            </div>
            
            {/* Search and Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search clients by company name, email, or phone..."
                  value={clientSearchQuery}
                  onChange={(e) => {
                    setClientSearchQuery(e.target.value)
                    setClientCurrentPage(1)
                  }}
                  className="pl-9 h-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select value={clientIndustryFilter} onValueChange={(value) => {
                  setClientIndustryFilter(value)
                  setClientCurrentPage(1)
                }}>
                  <SelectTrigger className="w-[200px] h-10 bg-transparent">
                    <SelectValue placeholder="Filter by industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    {industries.map((industry) => (
                      <SelectItem key={industry.id} value={industry.name}>
                        {industry.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Pagination Info - Above Everything */}
            {clients.length > 0 && (() => {
              // Filter clients based on search and filter
              const filteredClients = clients.filter(client => {
                const matchesSearch = clientSearchQuery === '' || 
                  client.company_name?.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
                  client.email?.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
                  client.phone?.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
                  client.address?.toLowerCase().includes(clientSearchQuery.toLowerCase())
                
                const matchesIndustry = clientIndustryFilter === 'all' || 
                  client.industry === clientIndustryFilter
                
                return matchesSearch && matchesIndustry
              })
              
              const clientTotalPages = Math.ceil(filteredClients.length / clientItemsPerPage)
              const clientStartIndex = (clientCurrentPage - 1) * clientItemsPerPage
              const clientEndIndex = clientStartIndex + clientItemsPerPage
              const paginatedClients = filteredClients.slice(clientStartIndex, clientEndIndex)
              
  return (
    <>
                  
                  {/* Client Table with Tabs Attached */}
                  <div className="border rounded-lg overflow-x-auto">
                    {/* View Mode Toggle - Inside table border */}
                    <div className="flex items-center gap-8 px-4 border-b">
                      <button
                        onClick={() => {
                          setClientViewMode('active')
                          setClientCurrentPage(1)
                        }}
                        className={`pb-3 pt-4 text-sm font-medium transition-colors relative ${
                          clientViewMode === 'active'
                            ? 'text-[#4F46E5]'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Active Clients ({activeClientCount})
                        {clientViewMode === 'active' && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4F46E5]" />
                        )}
                      </button>
                      {isClientFullAccess && (
                        <button
                          onClick={() => {
                            setClientViewMode('deleted')
                            setClientCurrentPage(1)
                          }}
                          className={`pb-3 pt-4 text-sm font-medium transition-colors relative ${
                            clientViewMode === 'deleted'
                              ? 'text-[#4F46E5]'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Deleted History ({deletedClientCount})
                          {clientViewMode === 'deleted' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4F46E5]" />
                          )}
                        </button>
                      )}
                    </div>
                    <table className="w-full min-w-[1200px]">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Company Name</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Contact Name</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Phone Number</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Industry</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Address</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedClients.map((client) => {
                  // Parse JSON data for display
                  let emails: string[] = []
                  let contactNames: string[] = []
                  let phones: string[] = []
                  
                  try {
                    emails = JSON.parse(client.email || '[]')
                    if (!Array.isArray(emails)) emails = [emails].filter(Boolean)
                  } catch {
                    emails = client.email ? [client.email] : []
                  }
                  
                  try {
                    contactNames = JSON.parse(client.contact_name || '[]')
                    if (!Array.isArray(contactNames)) contactNames = []
                  } catch {
                    contactNames = []
                  }
                  
                  try {
                    phones = JSON.parse(client.phone || '[]')
                    if (!Array.isArray(phones)) phones = [phones].filter(Boolean)
                  } catch {
                    phones = client.phone ? [client.phone] : []
                  }
                  
                  // Combine into contacts for display
              const displayContacts = emails.map((email, idx) => ({
                email,
                name: contactNames[idx] || '',
                phone: phones[idx] || ''
              })).filter(c => c.email)
              
              return (
                        <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                              <span className="font-medium text-gray-900">{client.company_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1.5 text-sm">
                              {displayContacts.length > 0 ? (
                                displayContacts.map((contact, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-gray-700">
                                    <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                    <span>{contact.name || '-'}</span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1.5 text-sm">
                              {displayContacts.length > 0 ? (
                                displayContacts.map((contact, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-gray-700">
                                    <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                    <span className="break-words max-w-xs">{contact.email}</span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1.5 text-sm">
                              {displayContacts.length > 0 ? (
                                displayContacts.map((contact, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      if (contact.phone) {
                                        // Remove all non-digit characters from phone number
                                        const cleanPhone = contact.phone.replace(/\D/g, '')
                                        if (cleanPhone) {
                                          // Open WhatsApp with the phone number
                                          window.open(`https://wa.me/${cleanPhone}`, '_blank')
                                        } else {
                                          alert('No WhatsApp number available for this contact')
                                        }
                                      } else {
                                        alert('No WhatsApp number available for this contact')
                                      }
                                    }}
                                    className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors cursor-pointer"
                                    title="Send WhatsApp message"
                                  >
                                    <MessageCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                                    <span>{contact.phone || '-'}</span>
                                  </button>
                                ))
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {client.industry ? (
                              <Badge variant="secondary" className="text-xs">
                                {client.industry}
                              </Badge>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {(() => {
                              const s = client.status || 'active'
                              const isActive = s === 'active'
                              return (
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                  isActive
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                                  {isActive ? 'Active' : 'Deleted'}
                                </span>
                              )
                            })()}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-start gap-2 text-sm text-gray-600 max-w-[200px]">
                              {client.address ? (
                                <>
                                  <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                  <span className="line-clamp-2">{client.address}</span>
                                </>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex gap-1 justify-end">
                              {!isClientFullAccess ? (
                                <span className="text-xs text-gray-400 italic px-2">View Only</span>
                              ) : clientViewMode === 'active' ? (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleEditClient(client)}
                                    className="h-8 w-8 p-0 bg-transparent hover:bg-gray-100"
                                    title="Edit Client"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleDeleteClient(client.id)}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                                    title="Delete Client"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleRestoreClient(client.id)}
                                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 bg-transparent"
                                    title="Restore Client"
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handlePermanentDeleteClient(client.id)}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                                    title="Delete Permanently"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
              )
                })}
                      </tbody>
                    </table>
                  </div>
                  
              {/* Pagination Navigation - Below Client List */}
              {clientTotalPages > 1 && (
                <div className="flex justify-center py-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => clientCurrentPage > 1 && setClientCurrentPage(clientCurrentPage - 1)}
                          className={clientCurrentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: clientTotalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setClientCurrentPage(page)}
                            isActive={clientCurrentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => clientCurrentPage < clientTotalPages && setClientCurrentPage(clientCurrentPage + 1)}
                          className={clientCurrentPage === clientTotalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
              </>
              )
            })()}
            
            {/* Empty State */}
            {clients.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">No clients added yet</p>
                <Button 
                  onClick={() => {
                    setClientForm({ id: '', company_name: '', contacts: [{email: '', contactName: '', phone: '', countryCode: '+91', emailError: '', phoneError: ''}], address: '', industry: '', gst: '' })
                    setIsClientFormOpen(true)
                  }} 
                  variant="outline"
                  className="bg-transparent"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Client
                </Button>
              </div>
            )}
          </Card>
          )}
        </div>
      )}

  {/* Team Management */}
  {currentView === 'team' && !hasModuleAccess('Manage Users') && (
  <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
    <Lock className="h-16 w-16 text-gray-400" />
    <div className="text-center">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
      <p className="text-sm text-gray-600">You don't have permission to manage team members.</p>
    </div>
    <Button variant="outline" onClick={() => setCurrentView('menu')}>
      <ArrowLeft className="h-4 w-4 mr-2" /> Back to Settings
    </Button>
  </div>
  )}
  {currentView === 'team' && hasModuleAccess('Manage Users') && (
  <div className="space-y-4 max-w-5xl mx-auto">
  <Button 
    variant="ghost" 
    onClick={() => setCurrentView('menu')} 
    className="mb-4"
  >
    <ArrowLeft className="mr-2 h-4 w-4" />
    Back to Settings
  </Button>
  <Card className="p-6">
  <div className="flex items-center justify-between mb-6">
  <div className="flex items-center gap-3">
  <div className="p-2 bg-indigo-100 rounded-lg">
  <Users className="h-5 w-5 text-indigo-600" />
  </div>
  <div>
  <h3 className="text-lg font-semibold">Manage Team</h3>
  <p className="text-sm text-gray-500">Manage your {organizationData?.name} team members</p>
  </div>
  </div>
  <div className="flex flex-col gap-3">
  <Button onClick={() => {
    setShowCreateTeamModal(false)
    setCurrentView('add-member')
    setMemberCitySearch('')
    setShowMemberCityDropdown(false)
    fetchLocationsAndUsers()
  }} className="gap-2 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90 text-white">
    <UserPlus className="h-4 w-4" />
    Add Team Member
  </Button>
  {userRole === 'super_admin' && (
    <Button onClick={() => {
      setTeamDialogTab('create')
      setSelectedTeam(null)
      setSelectedTeamMembers([])
      setShowCreateTeamModal(true)
      fetchLocationsAndUsers()
    }} className="gap-2 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90 text-white">
      <Users className="h-4 w-4" />
      Create Team
    </Button>
  )}
  </div>
  </div>
  </Card>
        <TeamList onEditMember={handleEditMember} userRole={userRole} userEmail={userEmail} />
      </div>
  )}
  
  {/* Add Team Member */}
  {currentView === 'add-member' && (
  <Card className="p-6 max-w-3xl mx-auto">
  <div className="flex items-center gap-3 mb-6">
  <div className="p-2 bg-indigo-100 rounded-lg">
  {isEditingTeamMember ? <Edit className="h-5 w-5 text-indigo-600" /> : <UserPlus className="h-5 w-5 text-indigo-600" />}
  </div>
  <div>
  <h3 className="text-lg font-semibold">{isEditingTeamMember ? 'Edit Team Member' : 'Add Team Member'}</h3>
  <p className="text-sm text-gray-500">{isEditingTeamMember ? 'Update member information and status' : 'Create a new user account for your team'}</p>
  </div>
  </div>

          <div className="space-y-4">
            {/* Row 1: Full Name, Email */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="user-name">Full Name *</Label>
                <Input
                  id="user-name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="John Doe"
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-email">Email *</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => {
                      const email = e.target.value.toLowerCase()
                      setNewUser({ ...newUser, email })
                    
                    // Validate email domain against whitelisted domains
                    if (email && email.includes('@')) {
                      const userDomain = email.split('@')[1]?.toLowerCase()
                      if (whitelistedDomains.length > 0 && userDomain) {
                        const isAllowed = whitelistedDomains.some(d => d.toLowerCase() === userDomain)
                        if (!isAllowed) {
                          setTeamMemberEmailError(`Domain @${userDomain} is not whitelisted. Allowed: ${whitelistedDomains.map(d => '@' + d).join(', ')}`)
                        } else {
                          setTeamMemberEmailError('')
                        }
                      } else {
                        setTeamMemberEmailError('')
                      }
                    } else {
                      setTeamMemberEmailError('')
                    }
                  }}
                  placeholder="john@example.com"
                  className={`h-9 ${teamMemberEmailError ? 'border-red-500' : ''}`}
                />
                {teamMemberEmailError && (
                  <p className="text-xs text-red-500 mt-1">{teamMemberEmailError}</p>
                )}
              </div>
            </div>

            {/* Row 2: Phone Number, Role */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="user-phone">Phone *</Label>
                <div className="flex gap-2">
                  <div className="relative w-[120px]">
                    <Input
                      value={teamMemberCountryCodeSearch}
                      onChange={(e) => {
                        setTeamMemberCountryCodeSearch(e.target.value)
                        setShowTeamCountryCodePopover(true)
                      }}
                      onFocus={() => {
                        setTeamMemberCountryCodeSearch('')
                        setShowTeamCountryCodePopover(true)
                      }}
                      onBlur={() => {
                        setTimeout(() => {
                          setShowTeamCountryCodePopover(false)
                          const selected = COUNTRY_CODES.find(c => c.code === teamMemberCountryCode)
                          setTeamMemberCountryCodeSearch(selected ? `${selected.abbr} ${selected.code}` : '')
                        }, 200)
                      }}
                      placeholder="Search country"
                      className="h-9 text-sm"
                    />
                    {showTeamCountryCodePopover && (
                      <div className="absolute z-50 w-[280px] mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-[200px] overflow-y-auto">
                        {(() => {
                          const search = (teamMemberCountryCodeSearch || '').toLowerCase()
                          const filtered = COUNTRY_CODES.filter(c => {
                            return (c.country || '').toLowerCase().includes(search) ||
                              (c.abbr || '').toLowerCase().includes(search) ||
                              (c.code || '').includes(search)
                          })
                          
                          if (filtered.length === 0) {
                            return (
                              <div className="px-3 py-2 text-sm text-gray-500">
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
                                setTeamMemberCountryCode(country.code)
                                setTeamMemberCountryCodeSearch(`${country.abbr} ${country.code}`)
                                setShowTeamCountryCodePopover(false)
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                            >
                              <span className="inline-flex items-center justify-center w-9 h-6 text-xs font-bold bg-blue-600 text-white rounded">{country.abbr}</span>
                              <span>{country.country} {country.code}</span>
                            </button>
                          ))
                        })()}
                      </div>
                    )}
                  </div>
                  <Input
                    id="user-phone"
                    value={newUser.phone.replace(teamMemberCountryCode, '')}
                    onChange={(e) => {
                      const phone = e.target.value.replace(/\D/g, '')
                      
                      // Limit to 10 digits
                      if (phone.length <= 10) {
                        setNewUser({ ...newUser, phone: `${teamMemberCountryCode}${phone}` })
                      }
                      
                      // Validate 10 digits
                      if (phone && phone.length !== 10) {
                        setTeamMemberPhoneError('Phone number must be exactly 10 digits')
                      } else {
                        setTeamMemberPhoneError('')
                      }
                    }}
                    placeholder="Enter 10-digit number"
                    maxLength={10}
                    className={`h-9 flex-1 ${teamMemberPhoneError ? 'border-red-500' : ''}`}
                  />
                </div>
                {teamMemberPhoneError && (
                  <p className="text-xs text-red-500 mt-1">{teamMemberPhoneError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-role">Role *</Label>
                <select
                  id="user-role"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="recruiter">Recruiter</option>
                  <option value="hiring_manager">Hiring Manager</option>
                  <option value="account_manager">Account Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {/* Row 3: Assign to Team, Location */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="user-team">Assign to Team</Label>
                <select
                  id="user-team"
                  value={newUser.team_id}
                  onChange={(e) => setNewUser({ ...newUser, team_id: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">No Team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.team_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 relative">
                <Label htmlFor="user-location">Location</Label>
                <div className="relative">
                  <Input
                    id="user-location"
                    value={memberCitySearch || newUser.location || ''}
                    onChange={(e) => {
                      const value = e.target.value
                      setMemberCitySearch(value)
                      setShowMemberCityDropdown(true)
                    }}
                    onFocus={() => setShowMemberCityDropdown(true)}
                    placeholder="Type to search cities..."
                    className="h-9"
                  />
                  {showMemberCityDropdown && (
                    <div className="member-city-dropdown absolute z-50 w-full mt-1 max-h-60 overflow-auto rounded-md border bg-white shadow-lg">
                      {cities
                        .filter((city) => 
                          city.name.toLowerCase().includes((memberCitySearch || newUser.location || '').toLowerCase())
                        )
                        .slice(0, 50)
                        .map((city) => (
                          <button
                            key={city.id}
                            type="button"
                            onClick={() => {
                              console.log('[v0] Selected member city:', city.name)
                              setNewUser({ ...newUser, location: city.name })
                              setMemberCitySearch('')
                              setShowMemberCityDropdown(false)
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                          >
                            {city.name}
                          </button>
                        ))}
                      {cities.filter((city) => 
                        city.name.toLowerCase().includes((memberCitySearch || newUser.location || '').toLowerCase())
                      ).length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-500">No cities found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Row 4: Department, Password */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2" data-dropdown-container>
                <Label htmlFor="user-department">Department *</Label>
                <div className="relative">
                  <Input
                    id="user-department"
                    value={newUser.department}
                    onChange={(e) => {
                      const value = e.target.value
                      setNewUser({ ...newUser, department: value })
                      // Only show dropdown if user has typed something
                      setShowDepartmentDropdown(value.length > 0)
                    }}
                    onFocus={() => {
                      // Only show dropdown if there's already text in the field
                      if (newUser.department && newUser.department.length > 0) {
                        setShowDepartmentDropdown(true)
                      }
                    }}
                    onBlur={() => setTimeout(() => setShowDepartmentDropdown(false), 200)}
                    placeholder="Type department name..."
                    className="h-9"
                  />
                  {showDepartmentDropdown && departments.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {(() => {
                        const searchTerm = (newUser.department || '').toLowerCase()
                        // Filter and remove duplicates by department name
                        const uniqueDepts = Array.from(
                          new Map(
                            departments
                              .filter(dept => dept.department_name.toLowerCase().includes(searchTerm))
                              .map(dept => [dept.department_name.toLowerCase(), dept])
                          ).values()
                        )
                        
                        if (uniqueDepts.length === 0) {
                          return (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              No departments found
                            </div>
                          )
                        }
                        
                        return uniqueDepts.map(dept => (
                          <div
                            key={dept.id}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              setNewUser({ ...newUser, department: dept.department_name })
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
  <div className="space-y-2">
  <Label htmlFor="user-password">{isEditingTeamMember ? 'New Password (leave empty to keep current)' : 'Password *'}</Label>
  <div className="relative">
    <Input
    id="user-password"
    type={showPassword ? "text" : "password"}
    value={newUser.password}
    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
    placeholder={isEditingTeamMember ? 'Enter new password' : 'Create a strong password'}
    className="h-9 pr-10"
    />
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
    >
      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  </div>
  </div>
            </div>

            {isEditingTeamMember && (
              <div className="space-y-2">
                <Label htmlFor="user-status">Status</Label>
                {originalStatus === 'revoked' ? (
                  <div className="flex items-center gap-2 h-9 px-3 py-1 rounded-md border border-red-300 bg-red-50">
                    <Badge className="bg-red-600 text-white text-xs">Revoked</Badge>
                    <span className="text-xs text-red-700">This status is permanent and cannot be changed</span>
                  </div>
                ) : (
                  <select
                    id="user-status"
                    value={newUser.status || 'active'}
                    onChange={(e) => {
                      const newStatus = e.target.value
                      if (newStatus === 'revoked') {
                        setShowRevokeConfirmation(true)
                      } else {
                        setNewUser({ ...newUser, status: newStatus })
                      }
                    }}
                    disabled={originalStatus === 'revoked'}
                    className="flex h-9 w-full md:w-64 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="revoked">Revoked</option>
                  </select>
                )}
              </div>
            )}
  
  {/* Revoke Confirmation Dialog */}
  <Dialog open={showRevokeConfirmation} onOpenChange={setShowRevokeConfirmation}>
  <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-red-600">Confirm Permanent Action</DialogTitle>
                  <DialogDescription className="text-sm">
                    This action is permanent and cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="space-y-3">
                    <p className="text-sm font-medium">You are about to revoke access for {newUser.name}.</p>
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 space-y-2">
                      <p className="text-xs text-red-800 font-medium">⚠️ This will:</p>
                      <ul className="text-xs text-red-700 space-y-1 ml-4 list-disc">
                        <li>Permanently block login access</li>
                        <li>Remove them from all assignment dropdowns</li>
                        <li>Free up one license slot</li>
                        <li>Make this change irreversible</li>
                      </ul>
                    </div>
                    <p className="text-xs text-gray-600">Are you sure you want to proceed?</p>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowRevokeConfirmation(false)
                      setNewUser({ ...newUser, status: originalStatus })
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button"
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => {
                      setNewUser({ ...newUser, status: 'revoked' })
                      setShowRevokeConfirmation(false)
                      toast({
                        title: 'Status Changed to Revoked',
                        description: 'Remember to save changes to apply this permanent action.',
                      })
                    }}
                  >
                    Confirm Revoke
                  </Button>
                </div>
              </DialogContent>
  </Dialog>
  
  <div className="flex gap-3 pt-4">
              <Button onClick={handleAddUser} className="gap-2 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90 text-white">
                <Save className="h-4 w-4" />
                {isEditingTeamMember ? 'Save Changes' : 'Create Team Member'}
              </Button>
              <Button
              variant="outline"
              onClick={() => {
                setNewUser({ name: '', email: '', phone: '', role: 'recruiter', location: '', department: '', password: '' })
                setIsEditingTeamMember(false)
                setEditingMemberId(null)
                setCurrentView('team')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
  </Card>
  )}

  {/* Create Team Modal - Rendered at top level so it works from any view */}
  <Dialog open={showCreateTeamModal} onOpenChange={(open) => {
    setShowCreateTeamModal(open)
    if (!open) {
      setSelectedTeam(null)
      setSelectedTeamMembers([])
    }
  }}>
    <DialogContent className="sm:max-w-5xl w-full max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Team Management</DialogTitle>
        <DialogDescription>
          Create a new team or view existing teams
        </DialogDescription>
      </DialogHeader>

      {/* Tab Switcher */}
      <div className="flex border-b">
        <button
          onClick={() => { setTeamDialogTab('create'); setSelectedTeam(null); setSelectedTeamMembers([]) }}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            teamDialogTab === 'create'
              ? 'border-[#4F46E5] text-[#4F46E5]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Create Team
        </button>
        <button
          onClick={() => { setTeamDialogTab('view'); fetchAllTeams(); setSelectedTeam(null); setSelectedTeamMembers([]) }}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            teamDialogTab === 'view'
              ? 'border-[#4F46E5] text-[#4F46E5]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          View Teams
        </button>
      </div>

      {/* Create Team Tab */}
      {teamDialogTab === 'create' && (
        <>
          <div className="grid grid-cols-2 gap-4 py-4">
            {/* Team Name */}
            <div className="space-y-2">
              <Label htmlFor="team_name">Team Name *</Label>
              <Input
                id="team_name"
                value={teamForm.team_name}
                onChange={(e) => {
                  setTeamForm({ ...teamForm, team_name: e.target.value })
                  setTeamFormErrors({ ...teamFormErrors, team_name: '' })
                }}
                placeholder="Enter team name"
                className={teamFormErrors.team_name ? 'border-red-500' : ''}
              />
              {teamFormErrors.team_name && (
                <p className="text-xs text-red-500">{teamFormErrors.team_name}</p>
              )}
            </div>
            
            {/* Location */}
            <div className="space-y-2 relative">
              <Label htmlFor="location">Location *</Label>
              <div className="relative">
                <Input
                  id="location"
                  value={citySearch || teamForm.location}
                  onChange={(e) => {
                    const value = e.target.value
                    setCitySearch(value)
                    setShowCityDropdown(true)
                    setTeamFormErrors({ ...teamFormErrors, location: '' })
                  }}
                  onFocus={() => setShowCityDropdown(true)}
                  placeholder="Type to search cities..."
                  className={teamFormErrors.location ? 'border-red-500' : ''}
                />
                {showCityDropdown && (
                  <div className="city-dropdown absolute z-50 w-full mt-1 max-h-60 overflow-auto rounded-md border bg-white shadow-lg">
                    {cities
                      .filter((city) => 
                        city.name.toLowerCase().includes((citySearch || teamForm.location).toLowerCase())
                      )
                      .slice(0, 50)
                      .map((city) => (
                        <button
                          key={city.id}
                          type="button"
                          onClick={() => {
                            setTeamForm({ 
                              ...teamForm, 
                              location: city.name,
                              hiring_manager_id: '',
                              recruiter_ids: [],
                              vendor_ids: []
                            })
                            setCitySearch('')
                            setShowCityDropdown(false)
                            setTeamFormErrors({ ...teamFormErrors, location: '' })
                            setSelectAllRecruiters(false)
                            fetchHiringManagersAndRecruiters(city.name)
                            fetchVendorsForLocation(city.name)
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                        >
                          {city.name}
                        </button>
                      ))}
                    {cities.filter((city) => 
                      city.name.toLowerCase().includes((citySearch || teamForm.location).toLowerCase())
                    ).length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500">No cities found</div>
                    )}
                  </div>
                )}
              </div>
              {teamFormErrors.location && (
                <p className="text-xs text-red-500">{teamFormErrors.location}</p>
              )}
            </div>
            
            {/* Hiring Manager */}
            <div className="space-y-2">
              <Label htmlFor="hiring_manager">Hiring Manager *</Label>
              <select
                id="hiring_manager"
                value={teamForm.hiring_manager_id}
                onChange={(e) => {
                  setTeamForm({ ...teamForm, hiring_manager_id: e.target.value })
                  setTeamFormErrors({ ...teamFormErrors, hiring_manager_id: '' })
                }}
                disabled={!teamForm.location}
                className={`flex h-9 w-full rounded-md border ${teamFormErrors.hiring_manager_id ? 'border-red-500' : 'border-input'} bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <option value="">Select hiring manager</option>
                {availableHiringManagers.length === 0 && teamForm.location && (
                  <option value="" disabled>No hiring managers in this location</option>
                )}
                {availableHiringManagers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name} ({manager.email})
                  </option>
                ))}
              </select>
              {teamFormErrors.hiring_manager_id && (
                <p className="text-xs text-red-500">{teamFormErrors.hiring_manager_id}</p>
              )}
            </div>
            
            {/* Recruiters Multi-Select */}
            <div className="space-y-2">
              <Label htmlFor="recruiters">Recruiters * {teamForm.recruiter_ids.length > 0 && `(${teamForm.recruiter_ids.length} selected)`}</Label>
              <div className={`border ${teamFormErrors.recruiter_ids ? 'border-red-500' : 'border-input'} rounded-md p-3 max-h-40 overflow-y-auto space-y-2 ${!teamForm.location ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {!teamForm.location && (
                  <p className="text-sm text-gray-500">Select a location first</p>
                )}
                {teamForm.location && availableRecruiters.length === 0 && (
                  <p className="text-sm text-gray-500">No recruiters in this location</p>
                )}
                {teamForm.location && availableRecruiters.length > 0 && (
                  <>
                    <div className="flex items-center space-x-2 pb-2 border-b">
                      <input
                        type="checkbox"
                        id="select_all"
                        checked={selectAllRecruiters}
                        onChange={(e) => {
                          const checked = e.target.checked
                          setSelectAllRecruiters(checked)
                          if (checked) {
                            setTeamForm({
                              ...teamForm,
                              recruiter_ids: availableRecruiters.map(r => r.id)
                            })
                          } else {
                            setTeamForm({ ...teamForm, recruiter_ids: [] })
                          }
                          setTeamFormErrors({ ...teamFormErrors, recruiter_ids: '' })
                        }}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label htmlFor="select_all" className="text-sm font-medium cursor-pointer">
                        Select All
                      </label>
                    </div>
                    {availableRecruiters.map((recruiter) => (
                      <div key={recruiter.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`recruiter_${recruiter.id}`}
                          checked={teamForm.recruiter_ids.includes(recruiter.id)}
                          onChange={(e) => {
                            const checked = e.target.checked
                            let newIds: string[]
                            if (checked) {
                              newIds = [...teamForm.recruiter_ids, recruiter.id]
                            } else {
                              newIds = teamForm.recruiter_ids.filter(id => id !== recruiter.id)
                            }
                            setTeamForm({ ...teamForm, recruiter_ids: newIds })
                            if (newIds.length === availableRecruiters.length) {
                              setSelectAllRecruiters(true)
                            } else {
                              setSelectAllRecruiters(false)
                            }
                            setTeamFormErrors({ ...teamFormErrors, recruiter_ids: '' })
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor={`recruiter_${recruiter.id}`} className="text-sm cursor-pointer">
                          {recruiter.name} ({recruiter.email})
                        </label>
                      </div>
                    ))}
                  </>
                )}
              </div>
              {teamFormErrors.recruiter_ids && (
                <p className="text-xs text-red-500">{teamFormErrors.recruiter_ids}</p>
              )}
            </div>

            {/* Vendors — visible only after location is selected */}
            {teamForm.location && (
              <div className="col-span-2 space-y-2">
                <Label className="flex items-center gap-2">
                  Vendors
                  <span className="text-xs text-gray-400 font-normal">(Optional — {teamForm.vendor_ids.length} selected)</span>
                </Label>
                <div className="border border-input rounded-md p-3 min-h-[72px] max-h-48 overflow-y-auto space-y-2">
                  {loadingVendors ? (
                    <p className="text-sm text-gray-400 flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" /> Loading vendors...
                    </p>
                  ) : availableVendors.length === 0 ? (
                    <p className="text-sm text-gray-400">No vendors found. Add vendors from Settings &gt; Vendor Management.</p>
                  ) : (
                    <>
                      {/* Select All Vendors */}
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <input
                          type="checkbox"
                          id="select_all_vendors"
                          checked={teamForm.vendor_ids.length === availableVendors.length && availableVendors.length > 0}
                          onChange={(e) => {
                            setTeamForm({
                              ...teamForm,
                              vendor_ids: e.target.checked ? availableVendors.map(v => v.id) : []
                            })
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor="select_all_vendors" className="text-sm font-medium cursor-pointer">
                          Select All
                        </label>
                      </div>
                      {availableVendors.map((vendor) => (
                        <div key={vendor.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`vendor_${vendor.id}`}
                            checked={teamForm.vendor_ids.includes(vendor.id)}
                            onChange={(e) => {
                              const newIds = e.target.checked
                                ? [...teamForm.vendor_ids, vendor.id]
                                : teamForm.vendor_ids.filter(id => id !== vendor.id)
                              setTeamForm({ ...teamForm, vendor_ids: newIds })
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <label htmlFor={`vendor_${vendor.id}`} className="text-sm cursor-pointer">
                            {vendor.company_name}
                            {vendor.location && (
                              <span className="ml-1 text-xs text-gray-400">({vendor.location})</span>
                            )}
                          </label>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateTeamModal(true)
                setCitySearch('')
                setShowCityDropdown(false)
                fetchLocationsAndUsers()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTeam}
              disabled={creatingTeam || !teamForm.team_name || !teamForm.location || !teamForm.hiring_manager_id || teamForm.recruiter_ids.length === 0}
              className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90 text-white"
            >
              {creatingTeam ? 'Creating...' : 'Create Team'}
            </Button>
          </div>
        </>
      )}

      {/* View Teams Tab */}
      {teamDialogTab === 'view' && (
        <div className="py-4">
          {!selectedTeam ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">{allTeams.length} team{allTeams.length !== 1 ? 's' : ''} created</p>
              </div>

              {loadingTeams ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4F46E5]"></div>
                </div>
              ) : allTeams.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No teams created yet</p>
                  <p className="text-sm text-gray-400 mt-1">Switch to the "Create Team" tab to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allTeams.map((team) => (
                    <div
                      key={team.id}
                      className="p-4 border rounded-lg cursor-pointer hover:shadow-md hover:border-[#4F46E5]/30 transition-all group"
                      onClick={() => {
                        setSelectedTeam(team)
                        fetchTeamMembers(team.id, team.hiring_manager_id)
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gradient-to-br from-[#4F46E5]/10 to-[#7C3AED]/10 rounded-md">
                            <Users className="h-4 w-4 text-[#4F46E5]" />
                          </div>
                          <h4 className="font-semibold text-sm text-gray-900 group-hover:text-[#4F46E5] transition-colors">{team.team_name}</h4>
                        </div>
                        <Badge variant="secondary" className="text-xs bg-indigo-50 text-indigo-700 border-0">
                          {team.recruiter_count + 1}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                        <MapPin className="h-3 w-3" />
                        <span>{team.location}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <User className="h-3 w-3" />
                        <span>{team.hiring_manager_name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Team Detail with Back Button and Add Member */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedTeam(null); setSelectedTeamMembers([]) }} className="gap-1 h-8 px-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-md">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{selectedTeam.team_name}</h4>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{selectedTeam.location}</span>
                        <span className="flex items-center gap-1"><User className="h-3 w-3" />{selectedTeam.hiring_manager_name}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => { 
                    fetchAvailableMembers(); 
                    setShowAddMemberDialog(true); 
                  }} 
                  size="sm"
                  className="gap-2 bg-[#4F46E5] hover:bg-[#4338CA]"
                >
                  <UserPlus className="h-4 w-4" />
                  Add Member
                </Button>
              </div>

              {/* Members Table */}
              {loadingTeamMembers ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4F46E5]"></div>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Name</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Email</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Team Role</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">System Role</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Location</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedTeamMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-medium ${member.team_role === 'Hiring Manager' ? 'bg-gradient-to-br from-[#4F46E5] to-[#7C3AED]' : 'bg-gray-400'}`}>
                                {member.name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <span className="text-sm font-medium text-gray-900">{member.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{member.email}</td>
                          <td className="px-4 py-3">
                            <Badge className={`text-xs border-0 ${member.team_role === 'Hiring Manager' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}>
                              {member.team_role}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 capitalize">{member.role?.replace('_', ' ') || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{member.location || '-'}</td>
                          <td className="px-4 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => {
                                    console.log('[v0] Edit team member:', member.id)
                                    // TODO: Open edit dialog with member data
                                    toast({
                                      title: 'Edit Member',
                                      description: 'Edit functionality will be implemented'
                                    })
                                  }}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={async () => {
                                    console.log('[v0] Delete team member:', member.id)
                                    if (!confirm(`Are you sure you want to remove ${member.name} from this team?`)) {
                                      return
                                    }
                                    
                                    try {
                                      const supabase = createClient()
                                      const { error } = await supabase
                                        .from('org_team')
                                        .update({ team_id: null })
                                        .eq('id', member.id)
                                      
                                      if (error) {
                                        console.error('[v0] Error removing team member:', error)
                                        toast({
                                          title: 'Error',
                                          description: `Failed to remove member: ${error.message}`,
                                          variant: 'destructive'
                                        })
                                      } else {
                                        toast({
                                          title: 'Success',
                                          description: `${member.name} has been removed from the team`
                                        })
                                        // Update local state
                                        setSelectedTeamMembers(prev => prev.filter(m => m.id !== member.id))
                                      }
                                    } catch (error) {
                                      console.error('[v0] Exception deleting team member:', error)
                                      toast({
                                        title: 'Error',
                                        description: 'Failed to remove member',
                                        variant: 'destructive'
                                      })
                                    }
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                      {selectedTeamMembers.length === 0 && !loadingTeamMembers && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">No members found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}
        </DialogContent>
      </Dialog>

      {/* Add Member to Team Dialog */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Recruiters to {selectedTeam?.team_name}</DialogTitle>
            <DialogDescription>
              Select one or more recruiters to add to this team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {availableMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-gray-500">
                  No available recruiters. All recruiters are already assigned to teams.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-sm font-medium">Available Recruiters ({availableMembers.length})</Label>
                  <div className="text-xs text-gray-500">
                    {selectedMembersToAdd.length} selected
                  </div>
                </div>
                <div className="border rounded-md divide-y max-h-[400px] overflow-y-auto">
                  {availableMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleMemberSelection(member.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMembersToAdd.includes(member.id)}
                        onChange={() => toggleMemberSelection(member.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {member.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </div>
                      {member.location && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {member.location}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (selectedMembersToAdd.length === availableMembers.length) {
                  setSelectedMembersToAdd([])
                } else {
                  setSelectedMembersToAdd(availableMembers.map(m => m.id))
                }
              }}
              disabled={availableMembers.length === 0}
              className="text-xs"
            >
              {selectedMembersToAdd.length === availableMembers.length ? 'Deselect All' : 'Select All'}
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddMemberDialog(false)
                  setSelectedMembersToAdd([])
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddMembersToTeam}
                disabled={selectedMembersToAdd.length === 0}
                className="bg-[#4F46E5] hover:bg-[#4338CA]"
              >
                Add {selectedMembersToAdd.length > 0 ? `(${selectedMembersToAdd.length})` : ''} Recruiter{selectedMembersToAdd.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Domain Whitelisting - Permission controlled */}
  {currentView === 'domain-whitelist' && hasModuleAccess('Domain Whitelisting') && (
    <Card className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-teal-100 rounded-lg">
          <Globe className="h-5 w-5 text-teal-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Domain Whitelisting</h2>
          <p className="text-sm text-muted-foreground">Only email addresses from these domains can be used when adding team members.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
            <Input
              placeholder="e.g. careerguideline.com"
              value={newDomainInput}
              onChange={(e) => setNewDomainInput(e.target.value.toLowerCase().replace(/^@/, '').trim())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  const domain = newDomainInput.trim().toLowerCase().replace(/^@/, '')
                  if (domain && domain.includes('.') && !whitelistedDomains.includes(domain)) {
                    const updated = [...whitelistedDomains, domain]
                    setWhitelistedDomains(updated)
                    setNewDomainInput('')
                    saveDomainsToDB(updated)
                  }
                }
              }}
              className="pl-8 h-10"
            />
          </div>
          <Button
            onClick={() => {
              const domain = newDomainInput.trim().toLowerCase().replace(/^@/, '')
              if (domain && domain.includes('.') && !whitelistedDomains.includes(domain)) {
                const updated = [...whitelistedDomains, domain]
                setWhitelistedDomains(updated)
                setNewDomainInput('')
                saveDomainsToDB(updated)
              }
            }}
            disabled={!newDomainInput.trim() || !newDomainInput.includes('.') || domainSaving}
            size="default"
          >
            <Plus className="h-4 w-4 mr-1" /> {domainSaving ? 'Saving...' : 'Add Domain'}
          </Button>
        </div>

        {whitelistedDomains.length === 0 ? (
          <div className="border border-dashed rounded-lg p-8 text-center">
            <Globe className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-medium">No domains whitelisted yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add domains above to restrict which email addresses can be used for team members. Without any domains, all emails are allowed.</p>
          </div>
        ) : (
          <div className="border rounded-lg divide-y">
            {whitelistedDomains.map((domain, index) => (
              <div key={domain} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-teal-50 flex items-center justify-center">
                    <Globe className="h-4 w-4 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">@{domain}</p>
                    <p className="text-xs text-muted-foreground">Allowed domain</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                  disabled={domainSaving}
                  onClick={() => {
                    const updated = whitelistedDomains.filter((_, i) => i !== index)
                    setWhitelistedDomains(updated)
                    saveDomainsToDB(updated)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2">
          <p className="text-xs text-muted-foreground">
            {domainSaving ? 'Saving...' : whitelistedDomains.length > 0 
              ? `${whitelistedDomains.length} domain${whitelistedDomains.length > 1 ? 's' : ''} whitelisted - changes saved automatically`
              : 'No domains whitelisted - all email domains are allowed'}
          </p>
        </div>
      </div>
    </Card>
  )}

  {/* Security Settings */}
  {currentView === 'security' && !hasModuleAccess('Role & Permission Settings') && (
  <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
    <Lock className="h-16 w-16 text-gray-400" />
    <div className="text-center">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
      <p className="text-sm text-gray-600">You don't have permission to view Security Settings.</p>
    </div>
    <Button variant="outline" onClick={() => setCurrentView('menu')}>
      <ArrowLeft className="h-4 w-4 mr-2" /> Back to Settings
    </Button>
  </div>
  )}
  {currentView === 'security' && hasModuleAccess('Role & Permission Settings') && (
        <Card className="p-6 max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Shield className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Security Settings</h3>
              <p className="text-sm text-gray-500">Manage account security options</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500">Add an extra layer of security</p>
              </div>
              <Switch
                checked={security.twoFactorAuth}
                onCheckedChange={(checked) => setSecurity({ ...security, twoFactorAuth: checked })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="session-timeout">Session Timeout (hours)</Label>
                <Input
                  id="session-timeout"
                  type="number"
                  value={security.sessionTimeout}
                  onChange={(e) => setSecurity({ ...security, sessionTimeout: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-expiry">Password Expiry (days)</Label>
                <Input
                  id="password-expiry"
                  type="number"
                  value={security.passwordExpiry}
                  onChange={(e) => setSecurity({ ...security, passwordExpiry: e.target.value })}
                />
              </div>
            </div>
  
  <Button onClick={handleSaveSecurity} className="gap-2 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90 text-white">
  <Save className="h-4 w-4" />
  Save Security Settings
  </Button>
          </div>
        </Card>
      )}

      {/* Templates View */}
      {currentView === 'templates' && (
        <TemplateManagement
          userRole={userRole}
          organizationId={organizationData?.id}
          onBack={() => setCurrentView('menu')}
        />
      )}

  {/* Role & Permissions Management */}
  {currentView === 'role-permissions' && !hasModuleAccess('Role & Permission Settings') && (
  <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
    <Lock className="h-16 w-16 text-gray-400" />
    <div className="text-center">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
      <p className="text-sm text-gray-600">You don't have permission to view Role & Permission Settings.</p>
    </div>
    <Button variant="outline" onClick={() => setCurrentView('menu')}>
      <ArrowLeft className="h-4 w-4 mr-2" /> Back to Settings
    </Button>
  </div>
  )}
  {currentView === 'role-permissions' && hasModuleAccess('Role & Permission Settings') && (
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView('menu')}
              className="text-gray-600 hover:text-gray-900 mb-4"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Settings
            </Button>
          </div>
          <RolePermissionsManager />
        </div>
      )}

      {/* Email Settings */}
      {currentView === 'email-settings' && (
        <EmailSettingsView onBack={() => setCurrentView('menu')} />
      )}

      {/* Vendor Management — table view */}
      {currentView === 'vendor-management' && (
        <VendorManagement
          organizationId={organizationData?.id ?? null}
          onBack={() => setCurrentView('menu')}
          onAddVendor={() => setCurrentView('add-vendor')}
        />
      )}

      {/* Add / Edit Vendor — form view */}
      {currentView === 'add-vendor' && (
        <VendorManagement
          organizationId={organizationData?.id ?? null}
          onBack={() => setCurrentView('vendor-management')}
          onAddVendor={() => setCurrentView('add-vendor')}
          formOnly
        />
      )}

      {/* Business Development Lead Setup */}
      {currentView === 'bd-lead-setup' && (
        <BDLeadSetup onBack={() => setCurrentView('menu')} />
      )}
    </div>
  )
}

// ─── Gmail OAuth Settings Sub-component ─────────────────────────────────────

function EmailSettingsView({ onBack }: { onBack: () => void }) {
  const { toast } = useToast()

  const [loading,      setLoading]      = useState(true)
  const [connection,   setConnection]   = useState<{ email: string; connected_at: string } | null>(null)
  const [disconnecting,setDisconnecting]= useState(false)
  const [fetching,     setFetching]     = useState(false)

  const getOrgId = (): string => {
    try {
      const raw = localStorage.getItem('userData') || localStorage.getItem('user') || ''
      const u   = raw ? JSON.parse(raw) : null
      return u?.organizationId || u?.organization_id || '3b44102c-4606-48d3-b0c3-d174e920bd8b'
    } catch { return '3b44102c-4606-48d3-b0c3-d174e920bd8b' }
  }

  // Load existing connection status
  const loadConnection = async () => {
    setLoading(true)
    try {
      const orgId = getOrgId()
      const res   = await fetch(`/api/auth/google/status?orgId=${orgId}`)
      const data  = await res.json()
      setConnection(data.connection || null)
    } catch {}
    setLoading(false)
  }

  // Check for OAuth callback params in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('gmailConnected') === 'true') {
      toast({ title: 'Gmail connected!', description: `Connected as ${params.get('gmailEmail') || ''}. Resumes will now be fetched automatically.` })
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname + '?tab=settings')
    }
    if (params.get('gmailError')) {
      toast({ title: 'Gmail connection failed', description: decodeURIComponent(params.get('gmailError') || ''), variant: 'destructive' })
      window.history.replaceState({}, '', window.location.pathname + '?tab=settings')
    }
    loadConnection()
  }, [])

  const handleConnect = async () => {
    const orgId = getOrgId()
    // Pre-flight: check if GOOGLE_CLIENT_ID is configured by hitting a status endpoint
    try {
      const check = await fetch(`/api/auth/google/config-check`)
      const data  = await check.json()
      if (!data.configured) {
        toast({
          title:       'Google OAuth not configured',
          description: 'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in your environment variables. Add them in the Vars tab in the sidebar.',
          variant:     'destructive',
        })
        return
      }
    } catch {
      // If check fails, proceed anyway — route will show an error page
    }
    window.location.href = `/api/auth/google?orgId=${orgId}`
  }

  const handleDisconnect = async () => {
    setDisconnecting(true)
    try {
      const orgId = getOrgId()
      await fetch(`/api/auth/google/disconnect`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ orgId }),
      })
      setConnection(null)
      toast({ title: 'Gmail disconnected.', description: 'Your Gmail account has been unlinked.' })
    } catch {
      toast({ title: 'Error', description: 'Failed to disconnect. Please try again.', variant: 'destructive' })
    } finally {
      setDisconnecting(false)
    }
  }

  const handleFetchNow = async () => {
    setFetching(true)
    try {
      const res  = await fetch('/api/cron/fetch-resumes-gmail')
      const data = await res.json()
      if (data.success) {
        toast({
          title: data.processed > 0 ? `${data.processed} resume(s) imported!` : 'No new resumes found',
          description: data.processed > 0
            ? 'New candidates have been added to your pipeline.'
            : 'No unread emails with resume attachments were found.',
        })
      } else {
        toast({ title: 'Fetch failed', description: data.error || 'Unknown error', variant: 'destructive' })
      }
    } catch (err: any) {
      toast({ title: 'Network error', description: err.message, variant: 'destructive' })
    } finally {
      setFetching(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-2">
      {/* Back */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-600 hover:text-gray-900 -ml-2">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Settings
        </Button>
      </div>

      <Card className="border border-gray-200 shadow-sm overflow-hidden">
        {/* Card header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 bg-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
            <Mail className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Gmail Resume Import</h3>
            <p className="text-sm text-gray-500">Securely connect your Gmail to auto-import resumes into your pipeline</p>
          </div>
        </div>

        <div className="px-6 py-6 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
          ) : connection ? (
            /* ── Connected State ── */
            <div className="space-y-5">
              <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-green-800">Gmail Connected</p>
                  <p className="text-sm text-green-700 truncate">{connection.email}</p>
                  <p className="text-xs text-green-600 mt-0.5">
                    Connected on {new Date(connection.connected_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleFetchNow}
                  disabled={fetching}
                  className="gap-2 font-medium bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {fetching ? 'Fetching...' : 'Fetch Resumes Now'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
                >
                  {disconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            /* ── Not Connected State ── */
            <div className="space-y-5">
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-5 py-5 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-gray-200 shadow-sm">
                    <Mail className="h-7 w-7 text-gray-400" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">No Gmail account connected</p>
                  <p className="text-xs text-gray-500 mt-1">Connect your Gmail inbox to start auto-importing resumes from applicants</p>
                </div>
                <Button
                  onClick={handleConnect}
                  className="gap-2 font-semibold bg-purple-600 hover:bg-purple-700 text-white px-6"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff"/>
                  </svg>
                  Connect Gmail
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* How it works */}
      <div className="mt-4 flex gap-3 rounded-xl border border-purple-100 bg-purple-50 px-5 py-4">
        <CheckCircle className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
        <div className="text-sm text-purple-800">
          <p className="font-semibold mb-1.5">How it works</p>
          <ul className="space-y-1 text-purple-700 list-disc list-inside leading-relaxed">
            <li>Connect your Gmail account securely via Google OAuth</li>
            <li>Unread emails with PDF, DOC, or DOCX attachments are automatically scanned</li>
            <li>Resumes are uploaded to cloud storage and a candidate record is created</li>
            <li>Processed emails are marked as read — runs every 5 minutes automatically</li>
          </ul>
        </div>
      </div>

      {/* Setup notice if no Google credentials */}
      <div className="mt-3 flex gap-3 rounded-xl border border-amber-100 bg-amber-50 px-5 py-4">
        <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold mb-1">Required: Google OAuth Credentials</p>
          <p className="text-amber-700">Add <code className="bg-amber-100 px-1 rounded text-xs">GOOGLE_CLIENT_ID</code>, <code className="bg-amber-100 px-1 rounded text-xs">GOOGLE_CLIENT_SECRET</code>, and <code className="bg-amber-100 px-1 rounded text-xs">NEXT_PUBLIC_APP_URL</code> to your environment variables. Set the authorized redirect URI in Google Cloud Console to <code className="bg-amber-100 px-1 rounded text-xs">[your-app-url]/api/auth/callback/google</code>.</p>
        </div>
      </div>
    </div>
  )
}
