'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, UserCog, Shield, Info } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface UserAccessViewProps {
  userRole?: 'admin' | 'recruiter' | 'super_admin' | 'hiring_manager'
}

interface Permission {
  module: string
  access_level: string
}

export function UserAccessView({ userRole = 'admin' }: UserAccessViewProps) {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPermissions()
  }, [userRole])

  async function fetchPermissions() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('role_permissions')
      .select('module, access_level')
      .eq('role', userRole)
      .order('module')

    if (!error && data) {
      setPermissions(data)
    }
    setLoading(false)
  }

  const getRoleName = (role: string) => {
    const roleNames = {
      'admin': 'Admin',
      'super_admin': 'Super Admin',
      'recruiter': 'Recruiter',
      'hiring_manager': 'Hiring Manager'
    }
    return roleNames[role as keyof typeof roleNames] || role
  }

  const getAccessBadge = (access: string) => {
    if (access === 'No' || access === 'No Access') {
      return (
        <Badge variant="outline" className="bg-red-50/50 text-red-600 border-red-200/50 text-[11px] font-medium px-2 py-0.5 flex items-center gap-1">
          <XCircle className="h-2.5 w-2.5" />
          <span>{access}</span>
        </Badge>
      )
    } else if (access === 'Yes' || access === 'Full' || access.includes('Create')) {
      return (
        <Badge variant="outline" className="bg-emerald-50/50 text-emerald-600 border-emerald-200/50 text-[11px] font-medium px-2 py-0.5 flex items-center gap-1">
          <CheckCircle className="h-2.5 w-2.5" />
          <span>{access}</span>
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="bg-blue-50/50 text-blue-600 border-blue-200/50 text-[11px] font-medium px-2 py-0.5 flex items-center gap-1">
          <CheckCircle className="h-2.5 w-2.5" />
          <span>{access}</span>
        </Badge>
      )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading permissions...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header Card */}
      <Card className="overflow-hidden border-0 shadow-sm bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="p-5">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-sm">
              <UserCog className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-1 tracking-tight">Access Permissions</h2>
              <p className="text-[13px] text-gray-500 leading-relaxed mb-3">
                Overview of your role and granted permissions
              </p>
              <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3 py-1 text-[11px] font-medium flex items-center gap-1.5 w-fit shadow-sm">
                <Shield className="h-3 w-3" />
                {getRoleName(userRole || 'admin')}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Permissions Grid */}
      <Card className="border-0 shadow-sm">
        <div className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3.5 tracking-tight">Feature Access</h3>
          <div className="space-y-1.5">
            {permissions.map((permission, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-gray-100 hover:border-blue-200/60 hover:bg-blue-50/30 transition-all duration-200 group"
              >
                <span className="text-[13px] font-medium text-gray-700 group-hover:text-gray-900">{permission.module}</span>
                {getAccessBadge(permission.access_level)}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Info Footer */}
      <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/50">
        <div className="p-1.5 bg-amber-100/80 rounded-lg mt-0.5">
          <Info className="h-3.5 w-3.5 text-amber-700" />
        </div>
        <div className="flex-1">
          <h4 className="text-[13px] font-semibold text-amber-900 mb-0.5">Permission Information</h4>
          <p className="text-[12px] text-amber-800/90 leading-relaxed">
            Access levels are role-based. Contact your administrator for permission changes.
          </p>
        </div>
      </div>
    </div>
  )
}
