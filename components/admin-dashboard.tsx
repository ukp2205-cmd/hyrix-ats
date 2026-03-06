'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, Users, Briefcase, Menu, LayoutDashboard, Settings, FileText, BarChart3, LogOut, ChevronLeft, ChevronRight, UserCog } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JobsList } from '@/components/jobs-list'
import { CandidatesList } from '@/components/candidates-list'
import { AdminDashboardOverview } from '@/components/admin-dashboard-overview'
import { RecruiterDashboardOverview } from '@/components/recruiter-dashboard-overview'
import { HiringManagerDashboard } from '@/components/hiring-manager-dashboard'
import { AdminReports } from '@/components/admin-reports'
import { AdminSettings } from '@/components/admin-settings'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase/client'
import { usePermissions } from '@/hooks/use-permissions'

interface AdminDashboardProps {
  userRole?: 'admin' | 'recruiter' | 'super_admin' | 'hiring_manager'
  basePath?: string
}

// Read user synchronously from localStorage once — avoids re-renders from auth loading
function getStoredUser() {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('hyrix_user') : null
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function AdminDashboard({ userRole: propUserRole, basePath = '/admin' }: AdminDashboardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { logout } = useAuth()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'jobs' | 'candidates' | 'reports' | 'settings'>('dashboard')

  // Stable values read once from localStorage — never change, never cause re-renders
  const storedUser = getStoredUser()
  const userRole = propUserRole || storedUser?.role || 'recruiter'
  const userEmail = storedUser?.email || null
  const isSuperAdmin = userRole === 'super_admin'

  const { hasModuleAccess, getAccessLevel } = usePermissions()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [organizationLogo, setOrganizationLogo] = useState<string | null>(null)

  useEffect(() => {
    if (!storedUser?.email) {
      router.replace('/login')
      return
    }
    const tabFromUrl = searchParams.get('tab') as 'dashboard' | 'jobs' | 'candidates' | 'reports' | 'settings' | null
    if (tabFromUrl && ['dashboard', 'jobs', 'candidates', 'reports', 'settings'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl)
    } else {
      setActiveTab('dashboard')
    }
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fetchOrganizationLogo = async () => {
      if (!userEmail) return
      try {
        const res = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ op: 'select', table: 'organization', select: 'logo_url', filters: [{ column: 'email', op: '=', value: userEmail }] }),
        })
        const json = await res.json()
        const logo = json.data?.[0]?.logo_url
        if (logo) setOrganizationLogo(logo)
      } catch { /* non-fatal */ }
    }
    fetchOrganizationLogo()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'candidates', label: 'Candidates', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart3, module: 'Reports & Analytics' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const menuItems = allMenuItems.filter(item => {
    if ((item as any).module) {
      return hasModuleAccess((item as any).module)
    }
    return true
  })

  const handleTabChange = (tab: 'dashboard' | 'jobs' | 'candidates' | 'reports' | 'settings') => {
    setActiveTab(tab)
    router.push(`${basePath}?tab=${tab}`, { scroll: false })
  }

  const handleLogout = async () => {
    console.log('[v0] AdminDashboard: Logout initiated')
    logout()
    // Use push instead of replace for cleaner navigation history
    router.push('/login')
  }

  if (!userEmail) {
    return null
  }

  const canCreateJob = hasModuleAccess('Create Job')
  const canAddCandidate = hasModuleAccess('Add Candidate')
  const showCreateButton = (activeTab === 'jobs' && canCreateJob) || (activeTab === 'candidates' && canAddCandidate)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} border-r bg-white shadow-sm flex-shrink-0 transition-all duration-300`}>
        <div className="flex h-full flex-col">
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
                    {userRole === 'recruiter' ? 'Recruiter Portal' :
                     userRole === 'hiring_manager' ? 'Hiring Manager Portal' :
                     userRole === 'super_admin' ? 'Super Admin Portal' : 'Admin Portal'}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="absolute -right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] border-2 border-white shadow-xl hover:shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-all z-10"
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="h-5 w-5 font-bold stroke-[3]" />
              ) : (
                <ChevronLeft className="h-5 w-5 font-bold stroke-[3]" />
              )}
            </button>
          </div>

          <nav className="flex-1 space-y-1 p-4 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    handleTabChange(item.id as typeof activeTab)
                    setIsSidebarOpen(false)
                  }}
                  className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} w-full px-4 py-3 rounded-lg transition-all ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-medium shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isSidebarCollapsed && <span className="text-sm">{item.label}</span>}
                </button>
              )
            })}
          </nav>

          <div className="border-t p-4 space-y-3">
            {isSidebarCollapsed ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex justify-center" title={userEmail || 'admin@jobkarle.com'}>
                  {organizationLogo ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white border-2 border-gray-200 flex-shrink-0 hover:border-[#4F46E5] transition-all cursor-pointer">
                      <img
                        src={organizationLogo || "/placeholder.svg"}
                        alt="Company Logo"
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
                      alt="Company Logo"
                      className="w-full h-full object-contain p-0.5"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
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
              onClick={handleLogout}
              className={`flex w-full items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} rounded-xl px-4 py-3 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all`}
              title={isSidebarCollapsed ? 'Logout' : undefined}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!isSidebarCollapsed && 'Logout'}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
          <div className="flex h-full items-center justify-between px-4 lg:px-6">
            <div>
              <h1 className="text-base font-semibold">
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'jobs' && 'Job Openings'}
                {activeTab === 'candidates' && 'Candidate Applications'}
                {activeTab === 'reports' && 'Reports & Analytics'}
                {activeTab === 'settings' && 'Settings'}
              </h1>
            </div>

            {showCreateButton && (
              <Button
                size="sm"
                onClick={() => {
                  if (activeTab === 'jobs') {
                    const jobPath = basePath === '/recruiter' ? '/recruiter/postings/new'
                      : basePath === '/hiring-manager' ? '/admin/jobs-new?return=jobs'
                      : '/admin/jobs-new?return=jobs'
                    router.push(jobPath)
                  } else if (activeTab === 'candidates') {
                    const candidatePath = basePath === '/recruiter' ? '/recruiter/candidates-new'
                      : basePath === '/hiring-manager' ? '/admin/candidates-new?return=candidates'
                      : '/admin/candidates-new?return=candidates'
                    router.push(candidatePath)
                  }
                }}
                className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90"
              >
                <Plus className="mr-2 h-4 w-4" />
                {activeTab === 'jobs' ? 'Create Job' : 'New Candidate'}
              </Button>
            )}
          </div>
        </header>

          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {activeTab === 'dashboard' && (
              userRole === 'recruiter' ? (
                <RecruiterDashboardOverview />
              ) : userRole === 'hiring_manager' ? (
                <HiringManagerDashboard embedded />
              ) : (
                <AdminDashboardOverview userRole={userRole} />
              )
            )}
          {activeTab === 'jobs' && <JobsList userRole={userRole} userEmail={userEmail} />}
          {activeTab === 'candidates' && <CandidatesList userRole={userRole} userEmail={userEmail} />}
          {activeTab === 'reports' && <AdminReports userRole={userRole} userEmail={userEmail} />}
          {activeTab === 'settings' && <AdminSettings userRole={userRole} userEmail={userEmail} />}
        </main>
      </div>
    </div>
  )
}
