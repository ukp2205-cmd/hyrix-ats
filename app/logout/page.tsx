'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    // Clear localStorage user data so components don't show stale data after logout
    try { localStorage.removeItem('hyrix_user') } catch { /* ignore */ }
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      .finally(() => router.replace('/login'))
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <LogOut className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Logged Out Successfully</h1>
        <p className="text-gray-600 mb-6">
          Your session has been cleared. You can now test the authentication protection.
        </p>
        <div className="space-y-3">
          <Button 
            onClick={() => router.push('/login')}
            className="w-full"
          >
            Go to Login
          </Button>
          <div className="text-sm text-gray-500">
            <p className="mb-2">Try these protected routes without logging in:</p>
            <div className="space-y-1">
              <button 
                onClick={() => router.push('/admin')}
                className="text-blue-600 hover:underline block"
              >
                /admin (Should redirect to login)
              </button>
              <button 
                onClick={() => router.push('/recruiter')}
                className="text-blue-600 hover:underline block"
              >
                /recruiter (Should redirect to login)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
