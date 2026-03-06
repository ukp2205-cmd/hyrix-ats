'use client'

import { AdminSettings } from '@/components/admin-settings'
import { ProtectedRoute } from '@/components/protected-route'

export default function RecruiterSettingsPage() {
  return (
    <ProtectedRoute allowedRoles={['recruiter', 'admin', 'super_admin']}>
      <AdminSettings userRole="recruiter" />
    </ProtectedRoute>
  )
}
