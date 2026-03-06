'use client'

import React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, LayoutDashboard, Briefcase, Users, BarChart3, Settings, LogOut, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddCandidateForm } from '@/components/add-candidate-form'

export default function RecruiterNewCandidatePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('hyrix_user')
    router.push('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-0'
        } bg-gradient-to-b from-purple-600 to-purple-800 text-white transition-all duration-300 overflow-hidden flex flex-col`}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold">Hyrix</h1>
          <p className="text-purple-200 text-sm">Recruiter Portal</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <a
            href="/recruiter"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
          >
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </a>
          <a
            href="/recruiter/postings"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Briefcase className="h-5 w-5" />
            Job Postings
          </a>
          <a
            href="/recruiter?tab=candidates"
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/20 transition-colors"
          >
            <Users className="h-5 w-5" />
            Applicants
          </a>
          <a
            href="/recruiter/analytics"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
          >
            <BarChart3 className="h-5 w-5" />
            Analytics
          </a>
          <a
            href="/recruiter/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Settings className="h-5 w-5" />
            Settings
          </a>
        </nav>

        <div className="p-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors w-full"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="bg-transparent"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Add New Candidate</h2>
                <p className="text-sm text-gray-500">Fill in candidate information below</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => router.back()} className="bg-transparent">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <AddCandidateForm 
                key="recruiter-candidate-form"
                userRole="recruiter" 
                redirectPath="/recruiter?tab=candidates" 
              />
            </div>
          </main>
      </div>
    </div>
  )
}
