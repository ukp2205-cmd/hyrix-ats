import { Suspense } from 'react'
import { AdminDashboard } from '@/components/admin-dashboard'
import { ProtectedRoute } from '@/components/protected-route'

export default function HiringManagerPage() {
  return (
    <ProtectedRoute allowedRoles={['hiring_manager']}>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <AdminDashboard userRole="hiring_manager" basePath="/hiring-manager" />
      </Suspense>
    </ProtectedRoute>
  )
}
