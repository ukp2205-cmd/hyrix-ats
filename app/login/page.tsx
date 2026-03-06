'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.message || 'Invalid email or password.')
        setLoading(false)
        return
      }

      // Write user to localStorage so all existing components that read
      // localStorage.getItem('hyrix_user') continue to work correctly
      try {
        localStorage.setItem('hyrix_user', JSON.stringify({
          id:             data.user.id,
          email:          data.user.email,
          name:           data.user.name,
          role:           data.user.role,
          organizationId: data.user.organizationId ?? null,
          loginTime:      Date.now(),
          lastActivity:   Date.now(),
        }))
      } catch { /* ignore */ }

      // Use hard navigation — guarantees redirect works on live deployments
      // router.replace() can silently fail if Next.js router is not fully hydrated
      const role = data.user?.role
      if (role === 'super_admin' || role === 'admin') {
        window.location.href = '/admin'
      } else if (role === 'hiring_manager') {
        window.location.href = '/hiring-manager'
      } else {
        window.location.href = '/recruiter'
      }

    } catch {
      setError('Network error. Please check your connection and try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-[#4F46E5] via-[#6366F1] to-[#8B5CF6] p-12">
        <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden shadow-2xl">
          <Image
            src="/images/login-illustration.jpg"
            alt="Recruitment illustration"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
            <p className="text-gray-500 text-sm">Sign in to your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700 block">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700 block">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="h-11 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            {"Don't have an account?"}{' '}
            <a href="/register" className="font-semibold text-[#4F46E5] hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
