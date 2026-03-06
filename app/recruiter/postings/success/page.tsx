'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LayoutDashboard,
  Briefcase,
  Users,
  BarChart3,
  Settings as SettingsIcon,
  CheckCircle,
  Copy,
  Download,
  Facebook,
  Linkedin,
  Instagram,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'

interface JobData {
  id: string
  job_id: string
  title: string
  location: string
  employment_type: string
  created_at: string
  department: string
  requirements: string
  description: string
  salary_range: string
  client_name: string
  account_manager: string
  assigned_recruiter: string
  contact_name: string
  industry: string
  status: string
  close_date: string
  organization_id: string
  updated_at: string
  experience_min_years?: number
  experience_max_years?: number
  skills_required?: string
}

export default function JobSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [jobId] = useState(searchParams?.get('id') || '12345')
  const [jobUrl, setJobUrl] = useState('')
  const [jobData, setJobData] = useState<JobData | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Helper function to create URL-friendly slug
  const createJobSlug = (title: string, location: string, experience: string) => {
    const titleSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    const locationSlug = location.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    const experienceSlug = experience.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    return `${titleSlug}-${locationSlug}-${experienceSlug}`
  }

  useEffect(() => {
    const fetchJobData = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (error) {
        console.error('Error fetching job:', error)
        // Set fallback URL even if fetch fails
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://hyrix.ai'
        setJobUrl(`${baseUrl}/jobs/${jobId}`)
      } else {
        setJobData(data)
        
        // Generate SEO-friendly URL with job details
        const title = data.title || 'position'
        const location = data.location || 'remote'
        const experience = data.employment_type || 'full-time'
        const slug = createJobSlug(title, location, experience)
        
        // Get base URL from window (works for both local and deployed)
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://hyrix.ai'
        // Use UUID id (primary key) instead of job_id for consistency
        const readableUrl = `${baseUrl}/jobs/${slug}/${data.id}`
        
        console.log('[v0] Generated job URL:', readableUrl)
        setJobUrl(readableUrl)
      }
      setLoading(false)
    }

    if (jobId) {
      fetchJobData()
    }
  }, [jobId])

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/hr' },
    { id: 'jobs', label: 'Jobs', icon: Briefcase, href: '/recruiter/postings' },
    { id: 'candidates', label: 'Candidates', icon: Users, href: '/recruiter/applicants' },
    { id: 'insights', label: 'Insights', icon: BarChart3, href: '/recruiter/insights' },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, href: '/recruiter/settings' },
  ]

  const copyToClipboard = () => {
    if (!jobUrl) {
      toast({
        title: 'Please wait',
        description: 'Job URL is still loading...',
        variant: 'destructive'
      })
      return
    }
    
    navigator.clipboard.writeText(jobUrl)
    toast({
      title: 'Link Copied!',
      description: 'Job posting link has been copied to clipboard.',
    })
  }

  const shareOnSocial = (platform: string) => {
    if (!jobUrl) {
      toast({
        title: 'Please wait',
        description: 'Job URL is still loading...',
        variant: 'destructive'
      })
      return
    }
    
    const encodedUrl = encodeURIComponent(jobUrl)
    
    // Build detailed text with job information - STRICT FORMAT with Title, Location, Experience
    let shareText = ''
    if (jobData) {
      // Format: "🚀 We're Hiring: [Job Title] | [Location] | [Experience]"
      const experienceText = jobData.experience_min_years && jobData.experience_max_years 
        ? `${jobData.experience_min_years}-${jobData.experience_max_years} years experience`
        : jobData.experience_min_years 
          ? `${jobData.experience_min_years}+ years experience`
          : 'All experience levels welcome'
      
      shareText = `🚀 We're Hiring!\n\n`
      shareText += `🎯 Role: ${jobData.title}\n`
      shareText += `📍 Location: ${jobData.location || 'Remote'}\n`
      shareText += `📊 Experience: ${experienceText}\n`
      
      // Add optional details
      if (jobData.employment_type) {
        shareText += `💼 Type: ${jobData.employment_type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}\n`
      }
      if (jobData.salary_range) {
        shareText += `💰 Salary: ${jobData.salary_range}\n`
      }
      if (jobData.skills_required) {
        const skills = jobData.skills_required.split(',').slice(0, 3).join(', ')
        shareText += `🔧 Key Skills: ${skills}\n`
      }
      
      shareText += `\n✅ Apply now: `
    } else {
      shareText = '🚀 Exciting job opportunity available! Apply now: '
    }
    
    const text = encodeURIComponent(shareText)
    
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${text}`,
      linkedin: `https://www.linkedin.com/feed/?shareActive=true&text=${text}${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${text}`,
      instagram: jobUrl, // Instagram doesn't support pre-filled text via URL, just copy the link
    }

    if (platform === 'instagram') {
      // For Instagram, copy text to clipboard and notify user
      const instagramText = shareText + jobUrl
      navigator.clipboard.writeText(instagramText)
      toast({
        title: 'Text Copied!',
        description: 'Open Instagram and paste the text with job details and link in your post.',
      })
    } else {
      window.open(urls[platform as keyof typeof urls], '_blank', 'width=600,height=400')
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left Sidebar - Always Visible */}
      <aside className="w-64 border-r bg-white shadow-sm flex-shrink-0">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 border-b px-6 bg-gradient-to-r from-white to-blue-50/30">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white font-bold text-sm shadow-lg shadow-[#4F46E5]/20">
              JK
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent">
                Hyrix
              </span>
              <p className="text-xs text-gray-500 font-medium">HR Portal</p>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 space-y-1 p-4">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = item.id === 'jobs'
              return (
                <button
                  key={item.id}
                  onClick={() => router.push(item.href)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white shadow-lg shadow-[#4F46E5]/30'
                      : 'text-gray-600 hover:bg-blue-50/50 hover:text-[#4F46E5]'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 h-16 border-b bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80 shadow-sm z-10">
          <div className="flex h-full items-center justify-between px-4 lg:px-8">
            <div>
              <p className="text-sm text-[#4F46E5] font-medium">Success!</p>
              <h1 className="text-lg font-semibold text-gray-900">Your job has been posted</h1>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-gradient-to-br from-blue-50/30 via-white to-purple-50/20">
          {/* Success Message */}
          <div className="max-w-6xl mx-auto mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Success! Your job has been posted.</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Your job posting is now live and ready to receive applications.
                </p>
                {jobData && jobData.job_id && (
                  <div className="mt-2 inline-block bg-blue-50 px-3 py-1.5 rounded-md">
                    <span className="text-sm font-semibold text-blue-700">
                      Job ID: {jobData.job_id}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-2">
            {/* One Click Sharing */}
            <Card className="border-0 shadow-md bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900">One click sharing</CardTitle>
                <CardDescription>Reach even more candidates by sharing your job</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Social Media Buttons */}
                <div className="flex gap-3 flex-wrap">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-lg hover:bg-blue-50 bg-transparent"
                    onClick={() => shareOnSocial('facebook')}
                    title="Share on Facebook"
                  >
                    <Facebook className="h-5 w-5 text-blue-600" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-lg hover:bg-blue-50 bg-transparent"
                    onClick={() => shareOnSocial('linkedin')}
                    title="Share on LinkedIn"
                  >
                    <Linkedin className="h-5 w-5 text-blue-700" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-lg hover:bg-gray-100 bg-transparent"
                    onClick={() => shareOnSocial('twitter')}
                    title="Share on X (Twitter)"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-lg hover:bg-pink-50 bg-transparent"
                    onClick={() => shareOnSocial('instagram')}
                    title="Share on Instagram"
                  >
                    <Instagram className="h-5 w-5 text-pink-600" />
                  </Button>
                </div>

                {/* Copy Link */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Copy and Share Your Job Link</label>
                  <div className="flex gap-2">
                    <Input
                      value={loading ? 'Generating URL...' : jobUrl}
                      readOnly
                      className="flex-1 bg-gray-50"
                    />
                    <Button
                      onClick={copyToClipboard}
                      disabled={loading || !jobUrl}
                      className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90 disabled:opacity-50"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  {jobUrl && (
                    <p className="text-xs text-gray-500 mt-2">
                      ✨ This link includes job title, location, and experience for better SEO
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Share Your Hiring Image */}
            <Card className="border-0 shadow-md bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900">Share your hiring image</CardTitle>
                <CardDescription>Download and share on social media to boost visibility</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative bg-gradient-to-br from-[#1e3a5f] to-[#0f2942] rounded-lg p-8 text-white min-h-[280px] flex flex-col justify-between">
                  {/* Decorative Pattern */}
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-xl"></div>
                  </div>
                  
                  <div className="relative z-10">
                    <h3 className="text-3xl font-bold mb-6">We are<br />HIRING</h3>
                    {loading ? (
                      <div className="space-y-2 text-sm">
                        <div className="h-4 bg-white/20 rounded w-32 animate-pulse"></div>
                        <div className="h-4 bg-white/20 rounded w-40 animate-pulse"></div>
                        <div className="h-4 bg-white/20 rounded w-28 animate-pulse"></div>
                      </div>
                    ) : jobData ? (
                      <div className="space-y-2">
                        <p className="font-semibold text-base">{jobData.location || 'Remote'}</p>
                        <p className="text-gray-200 text-sm">{jobData.title}</p>
                        <p className="text-gray-200 text-sm capitalize">{jobData.employment_type?.replace('-', ' ')}</p>
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm">
                        <p className="font-semibold">Location not specified</p>
                        <p className="text-gray-300">Position Title</p>
                        <p className="text-gray-300">Employment Type</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative z-10 mt-6">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-300">Powered by</span>
                      <span className="text-2xl font-bold tracking-tight">JobKarle</span>
                    </div>
                  </div>
                </div>
                
                <Button
                  className="w-full mt-4 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Here
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Back to Jobs Button */}
          <div className="max-w-6xl mx-auto mt-8">
            <Button
              variant="outline"
              onClick={() => router.push('/recruiter/postings')}
              className="rounded-xl"
            >
              Back to Jobs
            </Button>
          </div>
        </main>
      </div>
    </div>
  )
}
