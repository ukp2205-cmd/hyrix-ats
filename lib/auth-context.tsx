'use client'

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

// Portal roles that require inactivity enforcement
const PORTAL_ROLES: string[] = ['super_admin', 'admin', 'recruiter', 'hiring_manager', 'team_member', 'viewer']

// 3 hours in milliseconds
const INACTIVITY_LIMIT_MS = 3 * 60 * 60 * 1000

type UserRole = 'super_admin' | 'admin' | 'recruiter' | 'hiring_manager' | 'team_member' | 'viewer' | null

interface AuthContextType {
  userId: string | null
  userRole: UserRole
  userEmail: string | null
  userName: string | null
  organizationId: string | null
  loading: boolean
  isSuperAdmin: boolean
  isAdmin: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  userId: null, userRole: null, userEmail: null, userName: null,
  organizationId: null, loading: true, isSuperAdmin: false, isAdmin: false,
  logout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId]                 = useState<string | null>(null)
  const [userRole, setUserRole]             = useState<UserRole>(null)
  const [userEmail, setUserEmail]           = useState<string | null>(null)
  const [userName, setUserName]             = useState<string | null>(null)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [loading, setLoading]               = useState(true)

  // Track whether we have an active session that needs inactivity checks
  const isLoggedIn = useRef(false)
  // Flag: session already expired, waiting for first interaction to show toast
  const sessionExpiredPending = useRef(false)
  // Prevent showing toast multiple times
  const toastShownRef = useRef(false)

  const { toast } = useToast()

  const doLogout = useCallback(async (showToast = false) => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
    try { localStorage.removeItem('hyrix_user') } catch { /* ignore */ }
    isLoggedIn.current = false
    sessionExpiredPending.current = false
    toastShownRef.current = false
    setUserId(null); setUserEmail(null); setUserRole(null); setUserName(null); setOrganizationId(null)

    if (showToast) {
      toast({
        title: 'Session Expired',
        description: 'Your login time has expired. Please log in again to continue.',
        variant: 'destructive',
        duration: 6000,
      })
      // Short delay so toast renders before navigation
      setTimeout(() => { window.location.href = '/login' }, 1500)
    } else {
      window.location.href = '/login'
    }
  }, [toast])

  // Update lastActivity in localStorage
  const refreshActivity = useCallback(() => {
    try {
      const raw = localStorage.getItem('hyrix_user')
      if (raw) {
        const user = JSON.parse(raw)
        user.lastActivity = Date.now()
        localStorage.setItem('hyrix_user', JSON.stringify(user))
      }
    } catch { /* ignore */ }
  }, [])

  // Check if the stored session has exceeded the inactivity limit
  const checkInactivity = useCallback(() => {
    if (!isLoggedIn.current) return
    try {
      const raw = localStorage.getItem('hyrix_user')
      if (!raw) { doLogout(false); return }
      const user = JSON.parse(raw)
      const lastActivity = user.lastActivity || user.loginTime || 0
      const elapsed = Date.now() - lastActivity
      if (elapsed >= INACTIVITY_LIMIT_MS) {
        // Mark as expired — toast shown on next user interaction
        sessionExpiredPending.current = true
        isLoggedIn.current = false
      }
    } catch { /* ignore */ }
  }, [doLogout])

  // Handler for user interactions (click / mousemove / keydown / touchstart)
  const handleUserInteraction = useCallback(() => {
    // If session expired, show toast and redirect
    if (sessionExpiredPending.current && !toastShownRef.current) {
      toastShownRef.current = true
      doLogout(true)
      return
    }
    // If still logged in, refresh activity timestamp
    if (isLoggedIn.current) {
      refreshActivity()
    }
  }, [doLogout, refreshActivity])

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('hyrix_user')
      if (raw) {
        const user = JSON.parse(raw)
        if (user?.email && user?.role) {
          // Check if already expired at mount time
          const lastActivity = user.lastActivity || user.loginTime || 0
          const elapsed = Date.now() - lastActivity
          if (elapsed >= INACTIVITY_LIMIT_MS) {
            // Already expired — mark pending, will show toast on interaction
            sessionExpiredPending.current = true
          } else {
            setUserId(user.id ?? user.email)
            setUserEmail(user.email)
            setUserRole(user.role as UserRole)
            setUserName(user.name ?? null)
            setOrganizationId(user.organizationId ?? null)
            isLoggedIn.current = true
          }
        }
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  // Register interaction listeners and periodic inactivity check
  useEffect(() => {
    const events = ['click', 'mousemove', 'keydown', 'touchstart', 'scroll'] as const

    events.forEach(evt => window.addEventListener(evt, handleUserInteraction, { passive: true }))

    // Check inactivity every 60 seconds
    const interval = setInterval(checkInactivity, 60 * 1000)

    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleUserInteraction))
      clearInterval(interval)
    }
  }, [handleUserInteraction, checkInactivity])

  const logout = async () => {
    await doLogout(false)
  }

  return (
    <AuthContext.Provider value={{
      userId, userRole, userEmail, userName, organizationId, loading,
      isSuperAdmin: userRole === 'super_admin',
      isAdmin: userRole === 'super_admin' || userRole === 'admin',
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
