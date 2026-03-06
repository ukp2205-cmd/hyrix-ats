'use client'

import { Suspense, useEffect, useState } from 'react'
import JobCreationForm from '@/components/job-creation-form'
import { ProtectedRoute } from '@/components/protected-route'

export default function AdminNewJobPage() {
  const [userRole, setUserRole] = useState<'admin' | 'recruiter' | 'super_admin' | 'hiring_manager'>('admin')

  useEffect(() => {
    const userStr = localStorage.getItem('hyrix_user')
    if (userStr) {
      try {
        const userData = JSON.parse(userStr)
        if (userData.role) {
          setUserRole(userData.role)
        }
      } catch (error) {
        console.error('[v0] Error parsing user data:', error)
      }
    }
  }, [])

  return (
    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'recruiter', 'hiring_manager']}>
      <Suspense fallback={null}>
        <JobCreationForm userRole={userRole} />
      </Suspense>
    </ProtectedRoute>
  )
}
