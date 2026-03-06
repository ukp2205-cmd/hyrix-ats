'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Building2,
  Users,
  Calendar,
  ArrowLeft,
  Share2,
  BookmarkPlus,
  ExternalLink,
  Copy,
  Facebook,
  Linkedin,
  Instagram
} from 'lucide-react'

interface JobData {
  id: string
  title: string
  department: string
  location: string
  employment_type: string
  min_experience: number
  max_experience: number
  salary_range: string
  description: string
  requirements: string
  responsibilities: string
  client_name: string
  about_company: string
  status: string
  created_at: string
  skills: string
  remote_option: string
  work_mode: string
}

export default function PublicJobPage() {
  const params = useParams()
  const router = useRouter()
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchJob()
  }, [params.id])

  const fetchJob = async () => {
    setLoading(true)
    const supabase = createClient()

    console.log('[v0] Fetching job with ID:', params.id)

    // Try fetching by both 'id' (uuid) and 'job_id' (custom ID)
    let data = null
    let error = null

    // First try with UUID id
    const uuidResponse = await supabase
      .from('jobs')
      .select('*')
      .eq('id', params.id)
      .single()

    if (!uuidResponse.error && uuidResponse.data) {
      data = uuidResponse.data
    } else {
      // If UUID fails, try with job_id
      const jobIdResponse = await supabase
        .from('jobs')
        .select('*')
        .eq('job_id', params.id)
        .single()

      if (!jobIdResponse.error && jobIdResponse.data) {
        data = jobIdResponse.data
      } else {
        error = jobIdResponse.error
      }
    }

    if (error || !data) {
      console.error('[v0] Error fetching job:', error)
      setError('Job not found')
      setLoading(false)
      return
    }

    console.log('[v0] Job found:', data.title)

    // Only show active jobs to public
    if (data.status !== 'active') {
      console.log('[v0] Job is not active:', data.status)
      setError('This job posting is no longer active')
      setLoading(false)
      return
    }

    setJob(data)
    setLoading(false)
  }

  const handleShare = () => {
    setShareDialogOpen(true)
  }

  const shareOnSocial = (platform: string) => {
    const jobUrl = window.location.href
    const encodedUrl = encodeURIComponent(jobUrl)
    
    // Format experience text
    const experienceText = job.min_experience && job.max_experience 
      ? `${job.min_experience}-${job.max_experience} years experience`
      : job.min_experience 
        ? `${job.min_experience}+ years experience`
        : 'All experience levels welcome'
    
    // Build formatted share text with Title, Location, Experience
    let shareText = `🚀 We're Hiring!\n\n`
    shareText += `🎯 Role: ${job.title}\n`
    shareText += `📍 Location: ${job.location || 'Remote'}\n`
    shareText += `📊 Experience: ${experienceText}\n`
    
    if (job.employment_type) {
      shareText += `💼 Type: ${job.employment_type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}\n`
    }
    if (job.salary_range) {
      shareText += `💰 Salary: ${job.salary_range}\n`
    }
    
    shareText += `\n✅ Apply now: `
    
    const text = encodeURIComponent(shareText)
    
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${text}`,
      linkedin: `https://www.linkedin.com/feed/?shareActive=true&text=${text}${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${text}`,
      instagram: jobUrl,
    }
    
    if (platform === 'instagram') {
      // Copy to clipboard for Instagram
      navigator.clipboard.writeText(shareText + jobUrl)
      alert('Job details copied! You can now paste and share on Instagram.')
      setShareDialogOpen(false)
    } else {
      window.open(urls[platform as keyof typeof urls], '_blank', 'width=600,height=400')
      setShareDialogOpen(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    alert('Link copied to clipboard!')
  }

  const handleApply = () => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('hyrix_user')
    
    if (!storedUser) {
      // Not logged in - redirect to login with return URL
      console.log('[v0] User not logged in, redirecting to login')
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
    } else {
      // Logged in - proceed to application
      console.log('[v0] User logged in, proceeding to application')
      // TODO: Implement application flow
      alert('Application feature coming soon! For now, please contact us to apply.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">Job Not Found</CardTitle>
            <CardDescription>{error || 'This job posting does not exist or has been removed.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Generate meta description for social sharing - Simple format: Title | Location | Experience
  const experienceText = job.min_experience && job.max_experience 
    ? `${job.min_experience}-${job.max_experience} years`
    : job.min_experience 
      ? `${job.min_experience}+ years`
      : 'All levels'
  
  const metaTitle = `${job.title} | ${job.location} | ${experienceText}`
  const metaDescription = metaTitle
  const pageUrl = typeof window !== 'undefined' ? window.location.href : ''

  return (
    <div className="min-h-screen h-full bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
                HX
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
                Hyrix
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Title Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-3xl mb-2">{job.title}</CardTitle>
                    <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
                      {job.client_name && (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {job.client_name}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.remote_option === 'remote' ? 'Remote' : job.location || 'Location TBD'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Posted {new Date(job.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="secondary">{job.employment_type || job.work_mode || 'Full-time'}</Badge>
                  {job.department && <Badge variant="secondary">{job.department}</Badge>}
                  {job.remote_option === 'remote' && <Badge variant="secondary">Remote</Badge>}
                  {job.skills?.split(',').slice(0, 3).map((skill, idx) => (
                    <Badge key={idx} variant="outline">{skill.trim()}</Badge>
                  ))}
                </div>
              </CardHeader>
            </Card>

            {/* Job Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Job Description</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: job.description || 'No description available.' }} />
              </CardContent>
            </Card>

            {/* Responsibilities */}
            {job.responsibilities && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Responsibilities</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: job.responsibilities }} />
                </CardContent>
              </Card>
            )}

            {/* Requirements */}
            {job.requirements && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Requirements</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: job.requirements }} />
                </CardContent>
              </Card>
            )}

            {/* About Company */}
            {job.about_company && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">About {job.client_name || 'the Company'}</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: job.about_company }} />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Card */}
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Apply for this position</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleApply}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90" 
                  size="lg"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Login to Apply
                </Button>
                <Button variant="outline" className="w-full bg-transparent" size="lg">
                  <BookmarkPlus className="mr-2 h-4 w-4" />
                  Save Job
                </Button>
                <Separator />
                <div className="space-y-3 text-sm">
                  {job.min_experience && job.max_experience && (
                    <div className="flex items-start gap-3">
                      <Briefcase className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Experience</p>
                        <p className="text-muted-foreground">
                          {job.min_experience}-{job.max_experience} years
                        </p>
                      </div>
                    </div>
                  )}
                  {job.salary_range && (
                    <div className="flex items-start gap-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Salary Range</p>
                        <p className="text-muted-foreground">
                          {job.salary_range}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Job Type</p>
                      <p className="text-muted-foreground">{job.employment_type || job.work_mode || 'Full-time'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Location</p>
                      <p className="text-muted-foreground">
                        {job.remote_option === 'remote' ? 'Remote' : job.location || 'Location TBD'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Social Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share this job</DialogTitle>
            <DialogDescription>
              Share {job?.title} position on your favorite platform
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-lg hover:bg-blue-50 bg-transparent"
                onClick={() => shareOnSocial('facebook')}
                title="Share on Facebook"
              >
                <Facebook className="h-6 w-6 text-blue-600" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-lg hover:bg-blue-50 bg-transparent"
                onClick={() => shareOnSocial('linkedin')}
                title="Share on LinkedIn"
              >
                <Linkedin className="h-6 w-6 text-blue-700" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-lg hover:bg-gray-100 bg-transparent"
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
                className="h-12 w-12 rounded-lg hover:bg-pink-50 bg-transparent"
                onClick={() => shareOnSocial('instagram')}
                title="Share on Instagram"
              >
                <Instagram className="h-6 w-6 text-pink-600" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={typeof window !== 'undefined' ? window.location.href : ''}
                className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
              />
              <Button onClick={copyLink} variant="outline" size="sm" className="bg-transparent">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
