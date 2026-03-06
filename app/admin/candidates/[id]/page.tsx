'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  Building2,
  Target,
  Award,
  UserCircle2,
  MessageSquare,
  Edit,
  FileText,
  Download,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'

interface Candidate {
  id: string
  name: string
  email: string
  mobile_number: string
  industry: string
  current_location: string
  preferred_location: string
  experience_years: number
  skills: string | string[]
  current_ctc: string
  expected_ctc: string
  notice_period: string
  status: string
  cv_url: string
  feedback: string
  job_id: string
  created_at: string
  updated_at: string
}

export default function CandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  const { hasModuleAccess } = usePermissions()
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [loading, setLoading] = useState(true)
  const [jobTitle, setJobTitle] = useState<string>('')
  const [isEditingFeedback, setIsEditingFeedback] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [candidateId, setCandidateId] = useState<string | null>(null)

  useEffect(() => {
    console.log('[v0] CandidateDetails: Component mounted')
    console.log('[v0] CandidateDetails: Initializing params resolution')
    
    // Resolve params Promise
    const resolveParams = async () => {
      console.log('[v0] CandidateDetails: Awaiting params...')
      const resolvedParams = await params
      console.log('[v0] CandidateDetails: Params resolved:', resolvedParams)
      console.log('[v0] CandidateDetails: params.id type:', typeof resolvedParams.id)
      console.log('[v0] CandidateDetails: params.id value:', resolvedParams.id)
      console.log('[v0] CandidateDetails: window.location.pathname:', window.location.pathname)
      
      // Skip if this is the new candidate route - it should be handled by /new/page.tsx
      if (resolvedParams.id === 'new' || resolvedParams.id === 'edit') {
        console.log('[v0] CandidateDetails: Special route detected, skipping fetch')
        setLoading(false)
        return
      }
      
      setCandidateId(resolvedParams.id)
      console.log('[v0] CandidateDetails: About to fetch candidate details for ID:', resolvedParams.id)
      fetchCandidateDetails(resolvedParams.id)
    }
    
    resolveParams()
  }, [params])

  const fetchCandidateDetails = async (id: string) => {
    console.log('[v0] CandidateDetails: === fetchCandidateDetails START ===')
    console.log('[v0] CandidateDetails: Fetching for ID:', id)
    console.log('[v0] CandidateDetails: ID length:', id?.length)
    
    const supabase = createClient()
    console.log('[v0] CandidateDetails: Supabase client created')
    
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', id)
      .single()

    console.log('[v0] CandidateDetails: Query executed')
    console.log('[v0] CandidateDetails: Error:', error)
    console.log('[v0] CandidateDetails: Data:', data)

    if (error) {
      console.error('[v0] CandidateDetails: ERROR DETAILS:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      toast({
        title: 'Error',
        description: `Failed to load candidate: ${error.message}`,
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    console.log('[v0] CandidateDetails: Candidate data fetched successfully')
    console.log('[v0] CandidateDetails: Name:', data?.name)
    console.log('[v0] CandidateDetails: Email:', data?.email)
    setCandidate(data)
    
    if (data?.job_id) {
      console.log('[v0] CandidateDetails: Fetching job title for job_id:', data.job_id)
      const { data: jobData } = await supabase
        .from('jobs')
        .select('title')
        .eq('id', data.job_id)
        .single()
      
      if (jobData) {
        console.log('[v0] CandidateDetails: Job title fetched:', jobData.title)
        setJobTitle(jobData.title)
      } else {
        console.log('[v0] CandidateDetails: No job title found')
      }
    } else {
      console.log('[v0] CandidateDetails: No job_id associated with candidate')
    }
    
    console.log('[v0] CandidateDetails: Setting loading to false')
    setLoading(false)
  }

  const handleSaveFeedback = async () => {
    if (!candidateId) return
    
    const supabase = createClient()
    
    const { error } = await supabase
      .from('candidates')
      .update({ 
        feedback: feedbackText,
        updated_at: new Date().toISOString()
      })
      .eq('id', candidateId)

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to save feedback',
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Success',
      description: 'Feedback updated successfully',
    })
    
    setIsEditingFeedback(false)
    if (candidateId) {
      fetchCandidateDetails(candidateId)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'shortlisted': 'bg-green-100 text-green-700 border-green-200',
      'rejected': 'bg-red-100 text-red-700 border-red-200',
      'ringing': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'linedup': 'bg-blue-100 text-blue-700 border-blue-200',
    }
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading candidate details...</p>
        </div>
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Candidate not found</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/20 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6 p-6 pb-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="gap-2 bg-transparent"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center shadow-md">
                <UserCircle2 className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{candidate.name}</h1>
                <p className="text-sm text-muted-foreground">Candidate Profile</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50/50 to-white">
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <a href={`mailto:${candidate.email}`} className="text-sm font-medium text-blue-600 hover:underline">
                        {candidate.email}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <a href={`tel:${candidate.mobile_number}`} className="text-sm font-medium">
                        {candidate.mobile_number || 'Not provided'}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Current Location</p>
                      <p className="text-sm font-medium">{candidate.current_location || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Preferred Location</p>
                      <p className="text-sm font-medium">{candidate.preferred_location || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50/50 to-white">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Professional Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Industry</p>
                      <p className="text-sm font-medium">{candidate.industry || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Experience</p>
                      <p className="text-sm font-medium">{candidate.experience_years || 0} years</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Current CTC</p>
                      <p className="text-sm font-medium">₹{candidate.current_ctc || 'Not disclosed'}L</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Expected CTC</p>
                      <p className="text-sm font-medium">₹{candidate.expected_ctc || 'Not disclosed'}L</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Notice Period</p>
                      <p className="text-sm font-medium">{candidate.notice_period || 'Not specified'}</p>
                    </div>
                  </div>
                  {jobTitle && (
                    <div className="flex items-start gap-3">
                      <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Applied For</p>
                        <p className="text-sm font-medium">{jobTitle}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {candidate.skills && (
              <Card className="shadow-sm">
                <CardHeader className="border-b bg-gradient-to-r from-blue-50/50 to-white">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Skills
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-2">
                    {(typeof candidate.skills === 'string' 
                      ? candidate.skills.split(',') 
                      : candidate.skills
                    ).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1 text-xs">
                        {typeof skill === 'string' ? skill.trim() : skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-sm">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50/50 to-white">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Feedback & Notes
                  </CardTitle>
                  {!isEditingFeedback ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditingFeedback(true)
                        setFeedbackText(candidate.feedback || '')
                      }}
                      className="gap-2 bg-transparent"
                    >
                      <Edit className="h-4 w-4" />
                      {candidate.feedback ? 'Edit' : 'Add Notes'}
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingFeedback(false)}
                        className="bg-transparent"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveFeedback}
                        className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED]"
                      >
                        Save
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {isEditingFeedback ? (
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Add your feedback, interview notes, or comments about this candidate..."
                    className="w-full min-h-[150px] p-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {candidate.feedback || 'No feedback or notes added yet.'}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50/50 to-white">
                <CardTitle className="text-base">Application Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Current Status</p>
                  <Badge className={`${getStatusColor(candidate.status)} px-3 py-1.5 text-xs font-medium`}>
                    {candidate.status}
                  </Badge>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Applied On</p>
                  <p className="text-sm font-medium">
                    {new Date(candidate.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                  <p className="text-sm font-medium">
                    {new Date(candidate.updated_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {candidate.cv_url && (
              <Card className="shadow-sm">
                <CardHeader className="border-b bg-gradient-to-r from-blue-50/50 to-white">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Resume/CV
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                  <Button
                    variant="outline"
                    className="w-full gap-2 bg-transparent text-sm"
                    onClick={() => window.open(candidate.cv_url, '_blank')}
                  >
                    <FileText className="h-4 w-4" />
                    View Full Resume
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full gap-2 bg-transparent text-sm"
                    onClick={async () => {
                      try {
                        const response = await fetch(candidate.cv_url)
                        const blob = await response.blob()
                        const urlParts = candidate.cv_url.split('.')
                        const extension = urlParts[urlParts.length - 1].split('?')[0] || 'pdf'
                        const sanitizedName = candidate.name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '')
                        const filename = `${sanitizedName}_hirix.${extension}`
                        const url = window.URL.createObjectURL(blob)
                        const link = document.createElement('a')
                        link.href = url
                        link.download = filename
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                        window.URL.revokeObjectURL(url)
                        
                        toast({
                          title: 'Success',
                          description: `CV downloaded as ${filename}`
                        })
                      } catch (error) {
                        toast({
                          title: 'Download Failed',
                          description: 'Failed to download CV. Please try again.',
                          variant: 'destructive'
                        })
                      }
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Download CV
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-sm">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50/50 to-white">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                {hasModuleAccess('Add Candidate') && (
                <Button 
                  variant="outline" 
                  className="w-full gap-2 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white hover:opacity-90 text-sm border-0" 
                  onClick={() => router.push('/admin/candidates-new?edit=' + candidate.id)}
                >
                  <Edit className="h-4 w-4" />
                  Edit Candidate Details
                </Button>
                )}
                <Button variant="outline" className="w-full gap-2 bg-transparent text-sm" onClick={() => window.location.href = `mailto:${candidate.email}`}>
                  <Mail className="h-4 w-4" />
                  Send Email
                </Button>
                <Button variant="outline" className="w-full gap-2 bg-transparent text-sm" onClick={() => window.location.href = `tel:${candidate.mobile_number}`}>
                  <Phone className="h-4 w-4" />
                  Call Candidate
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
