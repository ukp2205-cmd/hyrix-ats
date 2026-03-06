'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

type AllowedRole = 'super_admin' | 'admin' | 'recruiter' | 'hiring_manager' | 'team_member' | 'viewer'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: AllowedRole[]
  redirectTo?: string
}

function getStoredUser() {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('hyrix_user') : null
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function ProtectedRoute({ children, allowedRoles = [], redirectTo = '/login' }: ProtectedRouteProps) {
  const router = useRouter()

  // Read synchronously — no async state, no spinner flash
  const user = getStoredUser()
  const isValid = user && user.email && user.role
  const isAllowed = isValid && (allowedRoles.length === 0 || allowedRoles.includes(user.role as AllowedRole))

  useEffect(() => {
    if (!isAllowed) {
      router.replace(redirectTo)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isAllowed) return null

  return <>{children}</>
}
