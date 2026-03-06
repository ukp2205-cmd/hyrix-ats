'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, User, MapPin, Briefcase, Phone, Mail, FileText, Calendar, DollarSign, Clock, MessageSquare } from 'lucide-react'

interface Candidate {
  id: string
  name: string
  mobile_number: string
  email: string
  current_location: string
  preferred_location: string
  skills: string
  industry: string
  years_of_experience: number
  current_ctc: string
  expected_ctc: string
  notice_period: string
  status: string
  feedback: string | null
  cv_url: string | null
  created_at: string
}

const statusColors = {
  shortlisted: 'bg-green-500',
  rejected: 'bg-red-500',
  ringing: 'bg-yellow-500',
  linedup: 'bg-blue-500',
}

export function CandidateDetailPage({ candidateId }: { candidateId: string }) {
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchCandidate() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .single()

      if (error) {
        console.error('[v0] Error fetching candidate:', error)
      } else {
        setCandidate(data)
      }
      setLoading(false)
    }

    fetchCandidate()
  }, [candidateId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="h-10 bg-muted rounded animate-pulse" />
          <Card className="animate-pulse">
            <CardHeader className="space-y-4">
              <div className="h-8 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-1/4" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-background p-4 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Candidate not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const skillsArray = typeof candidate.skills === 'string' 
    ? candidate.skills.split(',').map(s => s.trim()).filter(s => s)
    : Array.isArray(candidate.skills) 
      ? candidate.skills 
      : []

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 lg:px-8 py-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Candidates
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-4 lg:p-8 space-y-6">
        {/* Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-3xl text-balance">{candidate.name}</CardTitle>
                <CardDescription className="text-lg mt-2">{candidate.industry}</CardDescription>
              </div>
              <Badge
                className={`${statusColors[candidate.status as keyof typeof statusColors] || 'bg-gray-500'} text-white text-sm px-4 py-2`}
              >
                {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium break-all">{candidate.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Mobile Number</p>
                  <p className="font-medium">{candidate.mobile_number}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">Current: {candidate.current_location}</p>
                  <p className="font-medium text-muted-foreground">Preferred: {candidate.preferred_location}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Professional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Experience</p>
                  <p className="font-medium">{candidate.years_of_experience} years</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">CTC</p>
                  <p className="font-medium">Current: ₹{candidate.current_ctc} LPA</p>
                  <p className="font-medium text-gradient-to-r from-[#4F46E5] to-[#7C3AED]">Expected: ₹{candidate.expected_ctc} LPA</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Notice Period</p>
                  <p className="font-medium">{candidate.notice_period}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Applied On</p>
                  <p className="font-medium">{new Date(candidate.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {skillsArray.length > 0 ? (
                skillsArray.map((skill, idx) => (
                  <Badge key={idx} variant="secondary" className="text-sm px-3 py-1">
                    {skill}
                  </Badge>
                ))
              ) : (
                <p className="text-muted-foreground">No skills listed</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Feedback */}
        {candidate.feedback && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{candidate.feedback}</p>
            </CardContent>
          </Card>
        )}

        {/* CV Download */}
        {candidate.cv_url && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Resume</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => window.open(candidate.cv_url!, '_blank')}
                className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90"
              >
                <FileText className="mr-2 h-4 w-4" />
                Download Resume
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
