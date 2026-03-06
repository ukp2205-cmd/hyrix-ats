'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Save, RotateCcw } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

interface Permission {
  id: string
  role: string
  module: string
  access_level: string
}

export function RolePermissionsManager() {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const roles = ['super_admin', 'hiring_manager', 'recruiter']
  const modules = [
    'Dashboard',
    'Manage Clients',
    'Manage Users',
    'Role & Permission Settings',
    'Company Settings',
    'Domain Whitelisting',
    'Create Team',
    'Create Job',
    'Edit Job',
    'Delete Job',
    'View All Jobs',
    'View All Candidates',
    'Add Candidate',
    'Move Candidate Stage',
    'Schedule Interview',
    'Offer Management',
    'Reports & Analytics',
    'Billing / Subscription',
    'Activity Logs'
  ]

  // Modules that use simple Yes/No toggle (no multi-option cycling)
  const yesNoModules = ['Role & Permission Settings', 'Company Settings', 'Domain Whitelisting', 'Manage Users', 'Create Team']

  // Access level options for modules that cycle through multiple options
  const accessLevels: Record<string, string[]> = {
    'Dashboard': ['Full', 'Assigned & Own', 'Assigned Jobs', 'Own Jobs', 'No Access'],
    'Manage Clients': ['Create / Edit / Delete', 'Assigned Jobs', 'Own Jobs', 'Limited', 'No Access'],
    'Create Job': ['Yes', 'No Access'],
    'Edit Job': ['Yes', 'No Access'],
    'Delete Job': ['Yes', 'No Access'],
    'View All Jobs': ['Full', 'Assigned Jobs', 'Assigned Only', 'Own Jobs', 'Limited', 'No Access'],
    'View All Candidates': ['Full', 'Assigned Candidates', 'Own Candidates', 'Limited', 'No Access'],
    'Add Candidate': ['Full', 'Assigned Candidates', 'Own Candidates', 'No Access'],
    'Move Candidate Stage': ['Yes', 'No Access'],
    'Schedule Interview': ['Yes', 'No Access'],
    'Offer Management': ['Full', 'Limited', 'No Access'],
    'Reports & Analytics': ['Full', 'Limited', 'No Access'],
    'Billing / Subscription': ['Full', 'No Access'],
    'Activity Logs': ['Full', 'No Access'],
  }

  useEffect(() => {
    fetchPermissions()
  }, [])

  async function fetchPermissions() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .order('module')

    if (!error && data) {
      setPermissions(data)
    }
    setLoading(false)
  }

  function getPermission(role: string, module: string): string {
    const perm = permissions.find(p => p.role === role && p.module === module)
    return perm?.access_level || 'No Access'
  }

  // For Yes/No modules only
  function isEnabled(role: string, module: string): boolean {
    const level = getPermission(role, module)
    return level !== 'No Access'
  }

  // Toggle for Yes/No modules
  function togglePermission(role: string, module: string) {
    const currentlyEnabled = isEnabled(role, module)
    const newLevel = currentlyEnabled ? 'No Access' : 'Full'

    setPermissions(prev => {
      const existing = prev.find(p => p.role === role && p.module === module)
      if (existing) {
        return prev.map(p =>
          p.role === role && p.module === module
            ? { ...p, access_level: newLevel }
            : p
        )
      } else {
        return [...prev, {
          id: crypto.randomUUID(),
          role,
          module,
          access_level: newLevel
        }]
      }
    })
    setHasChanges(true)
  }

  // Cycle through access levels for multi-option modules
  function cyclePermission(role: string, module: string) {
    const currentLevel = getPermission(role, module)
    let levels = accessLevels[module] || ['Full', 'No Access']
    
    // Remove "Full" option for recruiter and hiring_manager on Dashboard
    if (module === 'Dashboard' && (role === 'recruiter' || role === 'hiring_manager')) {
      levels = levels.filter(level => level !== 'Full')
    }
    
    const currentIndex = levels.indexOf(currentLevel)
    const nextIndex = (currentIndex + 1) % levels.length
    const nextLevel = levels[nextIndex]

    setPermissions(prev => {
      const existing = prev.find(p => p.role === role && p.module === module)
      if (existing) {
        return prev.map(p =>
          p.role === role && p.module === module
            ? { ...p, access_level: nextLevel }
            : p
        )
      } else {
        return [...prev, {
          id: crypto.randomUUID(),
          role,
          module,
          access_level: nextLevel
        }]
      }
    })
    setHasChanges(true)
  }

  async function savePermissions() {
    setSaving(true)
    const supabase = createClient()

    try {
      // Upsert all permissions
      const { error } = await supabase
        .from('role_permissions')
        .upsert(
          permissions.map(p => ({
            role: p.role,
            module: p.module,
            access_level: p.access_level,
            updated_at: new Date().toISOString()
          })),
          { onConflict: 'role,module' }
        )

      if (error) throw error

      toast.success('Permissions saved successfully')
      setHasChanges(false)
      fetchPermissions()
    } catch (error) {
      console.error('Error saving permissions:', error)
      toast.error('Failed to save permissions')
    } finally {
      setSaving(false)
    }
  }

  function resetChanges() {
    fetchPermissions()
    setHasChanges(false)
    toast.info('Changes reset')
  }



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading permissions...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Role & Permission Settings</h2>
          <p className="text-sm text-gray-600 mt-1">Configure access levels for each role and module</p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetChanges}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          )}
          <Button
            size="sm"
            onClick={savePermissions}
            disabled={!hasChanges || saving}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Permissions Table */}
      <Card className="bg-white border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left p-4 text-sm font-semibold text-gray-700 min-w-[200px]">
                  Module / Feature
                </th>
                {roles.map(role => (
                  <th key={role} className="text-left p-4 text-sm font-semibold text-gray-700 min-w-[150px]">
                    {role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map((module, idx) => (
                <tr
                  key={module}
                  className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                >
                  <td className="p-4 text-sm text-gray-900 font-medium">{module}</td>
                  {roles.map(role => {
                    const isYesNo = yesNoModules.includes(module)
                    const currentAccess = getPermission(role, module)
                    const enabled = currentAccess !== 'No Access'

                    if (isYesNo) {
                      return (
                        <td key={`${role}-${module}`} className="p-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={() => togglePermission(role, module)}
                              className="h-5 w-5 rounded cursor-pointer accent-green-600"
                              style={{ accentColor: '#16a34a' }}
                            />
                            <span className={`text-xs font-medium ${enabled ? 'text-green-600' : 'text-gray-500'}`}>
                              {enabled ? 'Yes' : 'No'}
                            </span>
                          </div>
                        </td>
                      )
                    }

                    return (
                      <td key={`${role}-${module}`} className="p-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={() => cyclePermission(role, module)}
                            className="h-5 w-5 rounded cursor-pointer accent-green-600"
                            style={{ accentColor: '#16a34a' }}
                          />
                          <span className={`text-xs ${enabled ? 'text-gray-700' : 'text-gray-500'}`}>
                            {currentAccess}
                          </span>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Info */}
      <div className="text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <strong className="text-gray-900">Tip:</strong> Click the checkbox to cycle through access levels. For settings modules (Role & Permissions, Company, Manage Users) it toggles Yes/No. For other modules it cycles through options like Full, Assigned Jobs, Own Jobs, etc.
      </div>
    </div>
  )
}
