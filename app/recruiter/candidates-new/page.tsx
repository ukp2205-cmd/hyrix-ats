'use client'

import React, { Suspense, useEffect } from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, LayoutDashboard, Briefcase, Users, BarChart3, Settings, LogOut, Menu, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddCandidateForm } from '@/components/add-candidate-form'

async function pgFetch(op: string, table: string, opts: Record<string, any> = {}) {
  const res = await fetch('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op, table, ...opts }) })
  const json = await res.json()
  return { data: json.data ?? null, error: json.error ?? null }
}

export default function RecruiterNewCandidatePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const router = useRouter()
  const [organizationLogo, setOrganizationLogo] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')

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

  // Fetch organization logo for recruiter
  useEffect(() => {
    const fetchOrganizationLogo = async () => {
      if (!userEmail) return

      const { data: teamRows } = await pgFetch('select', 'org_team', {
        select: 'organization_id',
        filters: [{ column: 'email', op: '=', value: userEmail }],
      })
      const orgId = (Array.isArray(teamRows) ? teamRows[0] : teamRows)?.organization_id
      if (orgId) {
        const { data: orgRows } = await pgFetch('select', 'organization', {
          select: 'logo_url',
          filters: [{ column: 'id', op: '=', value: orgId }],
        })
        const logo = (Array.isArray(orgRows) ? orgRows[0] : orgRows)?.logo_url
        if (logo) setOrganizationLogo(logo)
      }
    }

    fetchOrganizationLogo()
  }, [userEmail])

  const handleLogout = () => {
    localStorage.removeItem('hyrix_user')
    router.push('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Collapsible */}
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
                  <p className="text-xs text-gray-500 font-medium">Recruiter Portal</p>
                </div>
              )}
            </div>
            {/* Toggle Button - Enhanced Visibility */}
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

          <nav className="flex-1 px-4 py-4 space-y-1">
            <a
              href="/recruiter"
              className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-blue-50/50 hover:text-[#4F46E5] transition-all`}
              title={isSidebarCollapsed ? 'Dashboard' : undefined}
            >
              <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
              {!isSidebarCollapsed && 'Dashboard'}
            </a>
            <a
              href="/recruiter?tab=jobs"
              className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-blue-50/50 hover:text-[#4F46E5] transition-all`}
              title={isSidebarCollapsed ? 'Jobs' : undefined}
            >
              <Briefcase className="h-5 w-5 flex-shrink-0" />
              {!isSidebarCollapsed && 'Jobs'}
            </a>
            <a
              href="/recruiter/candidates-new"
              className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white shadow-lg shadow-[#4F46E5]/30 transition-all`}
              title={isSidebarCollapsed ? 'Candidates' : undefined}
            >
              <Users className="h-5 w-5 flex-shrink-0" />
              {!isSidebarCollapsed && 'Candidates'}
            </a>
            <a
              href="/recruiter?tab=reports"
              className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-blue-50/50 hover:text-[#4F46E5] transition-all`}
              title={isSidebarCollapsed ? 'Reports' : undefined}
            >
              <BarChart3 className="h-5 w-5 flex-shrink-0" />
              {!isSidebarCollapsed && 'Reports'}
            </a>
            <a
              href="/recruiter?tab=settings"
              className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-blue-50/50 hover:text-[#4F46E5] transition-all`}
              title={isSidebarCollapsed ? 'Settings' : undefined}
            >
              <Settings className="h-5 w-5 flex-shrink-0" />
              {!isSidebarCollapsed && 'Settings'}
            </a>
          </nav>

          <div className="p-4 border-t space-y-3">
            {isSidebarCollapsed ? (
              <div className="flex flex-col items-center gap-3">
                {/* Organization Icon - Visible when collapsed */}
                <div className="flex justify-center" title={userEmail || 'recruiter@hyrix.com'}>
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
                      {userEmail?.charAt(0).toUpperCase() || 'R'}
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
                    {userEmail?.charAt(0).toUpperCase() || 'R'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 truncate">
                    {userEmail || 'recruiter@hyrix.com'}
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all w-full`}
              title={isSidebarCollapsed ? 'Logout' : undefined}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!isSidebarCollapsed && 'Logout'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {/* Fixed Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
          <h1 className="text-xl font-bold text-gray-900">Add New Candidate</h1>
          <p className="text-gray-600 text-xs mt-0.5">Fill in the candidate details below</p>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-3 py-2">
            <Suspense fallback={<div className="p-4">Loading...</div>}>
              <AddCandidateForm 
                key="recruiter-candidate-form"
                userRole="recruiter" 
                redirectPath="/recruiter?tab=candidates"
              />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
}
