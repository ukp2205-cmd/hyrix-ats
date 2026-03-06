'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Menu, LayoutDashboard, Briefcase, Users, BarChart3, Settings, LogOut, UserCog } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import bcrypt from 'bcryptjs'
import { COUNTRY_CODES } from '@/lib/country-codes'

export default function NewTeamMemberPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [organizationId, setOrganizationId] = useState<string>('')
  const [organizationName, setOrganizationName] = useState<string>('')
  const [departments, setDepartments] = useState<Array<{id: string, department_name: string}>>([])
  const [departmentInput, setDepartmentInput] = useState('')
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false)
  const [countryCode, setCountryCode] = useState('+91')
  const [emailError, setEmailError] = useState('')
  const [whitelistedDomains, setWhitelistedDomains] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    location: '',
    department: '',
    status: 'active',
    is_admin: false,
    create_user_access: false,
    user_password: '',
  })
  const [organizations, setOrganizations] = useState<any[]>([])

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { id: 'jobs', label: 'Jobs', icon: Briefcase, href: '/admin' },
    { id: 'candidates', label: 'Candidates', icon: Users, href: '/admin' },
    { id: 'team', label: 'Team', icon: UserCog, href: '/admin' },
    { id: 'reports', label: 'Reports', icon: BarChart3, href: '/admin' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/admin' },
  ]

  useEffect(() => {
    // Fetch logged-in admin's organization
    const fetchAdminOrganization = async () => {
      // Get logged-in user from localStorage
      const userStr = localStorage.getItem('hyrix_user')
      if (!userStr) {
        console.error('[v0] No logged-in user found')
        return
      }

      const user = JSON.parse(userStr)
      console.log('[v0] Logged-in admin email:', user.email)

      const supabase = createClient()
      
      // Get the logged-in admin's organization
      const { data, error } = await supabase
        .from('organization')
        .select('id, name, email, whitelisted_domains')
        .eq('email', user.email)
        .maybeSingle()

      if (error) {
        console.error('[v0] Error fetching admin organization:', error)
      } else if (data) {
        setOrganizationId(data.id)
        setOrganizationName(data.name)
        if (data.whitelisted_domains && Array.isArray(data.whitelisted_domains)) {
          setWhitelistedDomains(data.whitelisted_domains)
        }
        console.log('[v0] Admin organization found:', data.name, 'ID:', data.id, 'Whitelisted domains:', data.whitelisted_domains)
      } else {
        console.warn('[v0] No organization found for admin email:', user.email)
      }
    }

    fetchAdminOrganization()
  }, [])

  // Fetch departments from departments table
  useEffect(() => {
    const fetchDepartments = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('departments')
        .select('id, department_name')
        .eq('is_active', true)
        .order('department_name')
      
      if (data && !error) {
        setDepartments(data)
        console.log('[v0] Fetched departments for team member:', data.length)
      }
    }
    
    fetchDepartments()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check for email validation error
    if (emailError) {
      toast({
        title: 'Validation Error',
        description: emailError,
        variant: 'destructive',
      })
      return
    }
    
    setLoading(true)

    const supabase = createClient()

    try {
      // Hash password if user access is being created
      let hashedPassword = null
      if (formData.create_user_access && formData.user_password) {
        console.log('[v0] Hashing password for team member')
        const saltRounds = 10
        hashedPassword = await bcrypt.hash(formData.user_password, saltRounds)
        console.log('[v0] Password hashed successfully')
      }

      // Insert team member with super admin's organization_id
      const { data: teamMember, error: teamError } = await supabase
        .from('org_team')
        .insert([
          {
            name: formData.name,
            email: formData.email.trim().toLowerCase(),
            phone: formData.phone,
            role: formData.role,
            location: formData.location,
            department: formData.department,
            organization_id: organizationId,
            status: formData.status,
            is_admin: formData.is_admin,
            joined_date: new Date().toISOString(),
            password: hashedPassword, // Store encrypted password
          },
        ])
        .select()
        .single()

      if (teamError) {
        console.error('[v0] Error creating team member:', teamError)
        toast({
          title: 'Error',
          description: 'Failed to add team member. Please try again.',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      console.log('[v0] Team member created successfully with role:', teamMember.role)
      toast({
        title: '✓ Success',
        description: `${formData.name} has been added to the team successfully!${formData.create_user_access ? ' User access created.' : ''}`,
        className: 'bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white border-0',
      })

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: '',
        location: '',
        department: '',
        status: 'active',
        is_admin: false,
        create_user_access: false,
        user_password: '',
      })

      // Redirect back to team list
      setTimeout(() => {
        router.push('/admin?tab=team')
      }, 1500)
    } catch (error) {
      console.error('[v0] Unexpected error:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      })
    }

    setLoading(false)
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-background transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 border-b px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white font-bold text-sm">
          JK
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent">
            Hyrix
          </span>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 space-y-1 p-4">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = item.id === 'team'
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

          {/* Logout Button */}
          <div className="border-t p-4">
              <button
                onClick={() => {
                  localStorage.removeItem('hyrix_user')
                  window.location.href = '/login'
                }}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
                <h1 className="text-xl font-semibold">Add New Team Member</h1>
              </div>
            </div>
            <Button variant="ghost" onClick={() => router.push('/admin?tab=settings')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Settings
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8">
          <div className="container mx-auto max-w-4xl">
            <Card>
              <CardHeader>
                <CardTitle>Team Member Information</CardTitle>
                <CardDescription>
                  Add a new team member to your organization. You can optionally create user access for login.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Basic Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          placeholder="e.g. John Doe"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="e.g. john@company.com"
                    value={formData.email}
                    onChange={(e) => {
                      const email = e.target.value.toLowerCase()
                      setFormData({ ...formData, email })
                            
                            // Validate email domain against whitelisted domains
                            if (email && email.includes('@')) {
                              const userDomain = email.split('@')[1]?.toLowerCase()
                              if (whitelistedDomains.length > 0 && userDomain) {
                                const isAllowed = whitelistedDomains.some(d => d.toLowerCase() === userDomain)
                                if (!isAllowed) {
                                  setEmailError(`Domain @${userDomain} is not whitelisted. Allowed: ${whitelistedDomains.map(d => '@' + d).join(', ')}`)
                                } else {
                                  setEmailError('')
                                }
                              } else {
                                setEmailError('')
                              }
                            }
                          }}
                          required
                          className={emailError ? 'border-red-500' : ''}
                        />
                        {emailError && (
                          <p className="text-xs text-red-500 mt-1">{emailError}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 md:w-1/2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="flex gap-2">
                        <Select value={countryCode} onValueChange={setCountryCode}>
                          <SelectTrigger className="w-[120px] h-10">
                            <SelectValue>
                              {(() => {
                                const selected = COUNTRY_CODES.find(c => c.code === countryCode)
                                return selected ? `${selected.flag} ${selected.abbr} ${selected.code}` : 'Select'
                              })()}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent side="bottom" align="start" className="max-h-[200px] overflow-y-auto">
                            {COUNTRY_CODES.map((country) => (
                              <SelectItem key={country.code} value={country.code}>
                                {country.flag} {country.abbr} {country.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          id="phone"
                          placeholder="Enter 10-digit number"
                          value={formData.phone.replace(countryCode, '')}
                          onChange={(e) => {
                            const phone = e.target.value.replace(/\D/g, '')
                            // Limit to 10 digits
                            if (phone.length <= 10) {
                              setFormData({ ...formData, phone: `${countryCode}${phone}` })
                            }
                          }}
                          maxLength={10}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Role & Department */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Role & Department</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="role">Role *</Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value) => setFormData({ ...formData, role: value })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="recruiter">Recruiter</SelectItem>
                            <SelectItem value="hiring_manager">Hiring Manager</SelectItem>
                            <SelectItem value="account_manager">Account Manager</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          placeholder="e.g. New York, Remote"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2 relative">
                        <Label htmlFor="department">Department</Label>
                        <Input
                          id="department"
                          placeholder="Type to search departments..."
                          value={departmentInput || formData.department}
                          onChange={(e) => {
                            setDepartmentInput(e.target.value)
                            setFormData({ ...formData, department: e.target.value })
                            setShowDepartmentDropdown(true)
                          }}
                          onFocus={() => setShowDepartmentDropdown(true)}
                          onBlur={() => setTimeout(() => setShowDepartmentDropdown(false), 200)}
                        />
                        {showDepartmentDropdown && departments.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {departments
                              .filter(dept => {
                                const searchTerm = (departmentInput || formData.department || '').toLowerCase()
                                return !searchTerm || dept.department_name.toLowerCase().includes(searchTerm)
                              })
                              .map(dept => (
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
                              ))}
                            {departments.filter(dept => {
                              const searchTerm = (departmentInput || formData.department || '').toLowerCase()
                              return !searchTerm || dept.department_name.toLowerCase().includes(searchTerm)
                            }).length === 0 && (
                              <div className="px-3 py-2 text-sm text-gray-500">
                                No departments found
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="status">Status *</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) => setFormData({ ...formData, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* User Access & Permissions */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">User Access & Permissions</h3>
                    <p className="text-sm text-muted-foreground">
                      Company master user ID for creation of employer & giving access to create user ID of employer
                    </p>
                    
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="create_user_access"
                          checked={formData.create_user_access}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, create_user_access: checked as boolean })
                          }
                        />
                        <Label htmlFor="create_user_access" className="cursor-pointer">
                          Create user login access for this team member
                        </Label>
                      </div>

                      {formData.create_user_access && (
                        <>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="is_admin"
                              checked={formData.is_admin}
                              onCheckedChange={(checked) =>
                                setFormData({ ...formData, is_admin: checked as boolean })
                              }
                            />
                            <Label htmlFor="is_admin" className="cursor-pointer">
                              Grant admin privileges (can manage organization settings)
                            </Label>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="user_password">Set Password *</Label>
                            <Input
                              id="user_password"
                              type="password"
                              placeholder="Enter initial password"
                              value={formData.user_password}
                              onChange={(e) => setFormData({ ...formData, user_password: e.target.value })}
                              required={formData.create_user_access}
                            />
                            <p className="text-xs text-muted-foreground">
                              This user will be able to login with their email and this password
                            </p>
                          </div>

                          <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-sm text-blue-900 dark:text-blue-100">
                              <strong>User Role:</strong> {formData.is_admin ? 'Admin' : 'Recruiter'}
                              <br />
                              <strong>Access Level:</strong> {formData.is_admin ? 'Full access to organization management' : 'Access to jobs and candidates only'}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90"
                    >
                      {loading ? 'Adding...' : 'Add Team Member'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
