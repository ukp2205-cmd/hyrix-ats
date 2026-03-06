import { Suspense } from 'react'
import { AdminDashboard } from '@/components/admin-dashboard'
import { ProtectedRoute } from '@/components/protected-route'

export default function RecruiterPage() {
  return (
    <ProtectedRoute allowedRoles={['recruiter', 'admin', 'super_admin']}>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <AdminDashboard userRole="recruiter" basePath="/recruiter" />
      </Suspense>
    </ProtectedRoute>
  )
}
