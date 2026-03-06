'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  Calendar,
  FileText,
  Download,
  Clock,
  Building2,
  Target,
  Award,
  User,
  Edit,
  UserCircle2,
  MessageSquare,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Candidate {
  id: string
  name: string
  email: string
  mobile_number: string
  industry: string
  current_location: string
  preferred_location: string
  years_of_experience: number
  skills: string
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

export default function CandidateDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [loading, setLoading] = useState(true)
  const [jobTitle, setJobTitle] = useState<string>('')
  const [isEditingFeedback, setIsEditingFeedback] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')

  useEffect(() => {
    fetchCandidateDetails()
  }, [params.id])

  const fetchCandidateDetails = async () => {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('[v0] Error fetching candidate:', error)
      toast({
        title: 'Error',
        description: 'Failed to load candidate details',
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    setCandidate(data)
    
    // Fetch job title if job_id exists
    if (data?.job_id) {
      const { data: jobData } = await supabase
        .from('jobs')
        .select('title')
        .eq('id', data.job_id)
        .single()
      
      if (jobData) {
        setJobTitle(jobData.title)
      }
    }
    
    setLoading(false)
  }

  const handleSaveFeedback = async () => {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('candidates')
      .update({ 
        feedback: feedbackText,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (error) {
      console.error('[v0] Error updating feedback:', error)
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
    fetchCandidateDetails()
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'New': 'bg-blue-100 text-blue-700 border-blue-200',
      'Shortlisted': 'bg-green-100 text-green-700 border-green-200',
      'Interview': 'bg-purple-100 text-purple-700 border-purple-200',
      'Offered': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'Rejected': 'bg-red-100 text-red-700 border-red-200',
      'Hired': 'bg-teal-100 text-teal-700 border-teal-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200'
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
          <Button onClick={() => router.push('/recruiter/applicants')} className="mt-4">
            Back to Applicants
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/20 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/recruiter/applicants')}
              className="gap-2 bg-transparent"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Applicants
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact & Basic Information */}
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50/50 to-white">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
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

            {/* Professional Details */}
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50/50 to-white">
                <CardTitle className="text-lg flex items-center gap-2">
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
                      <p className="text-sm font-medium">{candidate.years_of_experience || 0} years</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Current CTC</p>
                      <p className="text-sm font-medium">{candidate.current_ctc || 'Not disclosed'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Expected CTC</p>
                      <p className="text-sm font-medium">{candidate.expected_ctc || 'Not disclosed'}</p>
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

            {/* Skills */}
            {candidate.skills && (
              <Card className="shadow-sm">
                <CardHeader className="border-b bg-gradient-to-r from-blue-50/50 to-white">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Skills
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills.split(',').map((skill, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1">
                        {skill.trim()}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Feedback & Notes */}
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50/50 to-white">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
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
                      className="gap-2"
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

          {/* Right Column - Status & Actions */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50/50 to-white">
                <CardTitle className="text-lg">Application Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Current Status</p>
                  <Badge className={`${getStatusColor(candidate.status)} px-3 py-1.5 text-sm font-medium`}>
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

            {/* Resume/CV */}
            {candidate.cv_url && (
              <Card className="shadow-sm">
                <CardHeader className="border-b bg-gradient-to-r from-blue-50/50 to-white">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Resume/CV
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                  {/* View Full Resume Button */}
                  <Button
                    variant="outline"
                    className="w-full gap-2 bg-transparent"
                    onClick={() => window.open(candidate.cv_url, '_blank')}
                  >
                    <FileText className="h-4 w-4" />
                    View Full Resume
                  </Button>
                  
                  {/* Download Button */}
                  <Button
                    variant="outline"
                    className="w-full gap-2 bg-transparent"
                    onClick={async () => {
                      try {
                        // Fetch the CV file
                        const response = await fetch(candidate.cv_url)
                        const blob = await response.blob()
                        
                        // Get file extension from URL
                        const urlParts = candidate.cv_url.split('.')
                        const extension = urlParts[urlParts.length - 1].split('?')[0] || 'pdf'
                        
                        // Create filename in format: candidatename_hirix
                        const sanitizedName = candidate.name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '')
                        const filename = `${sanitizedName}_hirix.${extension}`
                        
                        // Create download link
                        const url = window.URL.createObjectURL(blob)
                        const link = document.createElement('a')
                        link.href = url
                        link.download = filename
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                        window.URL.revokeObjectURL(url)
                        
                        console.log('[v0] CV downloaded:', filename)
                        
                        toast({
                          title: 'Success',
                          description: `CV downloaded as ${filename}`
                        })
                      } catch (error) {
                        console.error('[v0] Error downloading CV:', error)
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

            {/* Quick Actions */}
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50/50 to-white">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                <Button variant="outline" className="w-full gap-2 bg-transparent" onClick={() => window.location.href = `mailto:${candidate.email}`}>
                  <Mail className="h-4 w-4" />
                  Send Email
                </Button>
                <Button variant="outline" className="w-full gap-2 bg-transparent" onClick={() => window.location.href = `tel:${candidate.mobile_number}`}>
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
