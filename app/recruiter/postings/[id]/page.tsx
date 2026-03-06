'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  Users,
  Calendar,
  Building2,
  CheckCircle,
  Mail,
  Phone,
  FileText,
  TrendingUp,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import dynamic from 'next/dynamic'
import RecruiterPipeline from '@/components/recruiter-pipeline'

// Dynamically import the NewJobPage component to render when route is "new"
const NewJobPage = dynamic(() => import('../new/page'), { ssr: false })

interface Job {
  id: string
  title: string
  location: string
  job_type: string
  experience_level: string
  salary_range: string
  description: string
  requirements: string[]
  responsibilities: string[]
  benefits: string[]
  company_name: string
  company_description: string
  contact_email: string
  contact_name: string
  status: string
  created_at: string
  assigned_recruiter: string
}

interface Candidate {
  id: string
  name: string
  email: string
  mobile: string
  current_location: string
  skills: string[]
  experience_years: number
  current_ctc: number
  expected_ctc: number
  notice_period: string
  status: string
  created_at: string
}

export default function JobDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  
  // Validate if the ID is a valid UUID
  const isValidUUID = (id: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(id)
  }
  
  // Check if this is a non-UUID route and handle appropriately
  const [shouldRender, setShouldRender] = useState(isValidUUID(params.id as string))
  
  useEffect(() => {
    // If the ID is not a valid UUID, this route shouldn't handle it
    if (!isValidUUID(params.id as string)) {
      setShouldRender(false)
    }
  }, [params.id])
  
  const [job, setJob] = useState<Job | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)

  const fetchJobDetails = async () => {
    // Don't attempt to fetch if ID is not a valid UUID (e.g., "new", "success")
    if (!isValidUUID(params.id as string)) {
      setLoading(false)
      return
    }

    const supabase = createClient()

    // Fetch job details
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', params.id)
      .single()

    if (jobError) {
      console.error('[v0] Error fetching job:', jobError)
      toast({
        title: 'Error',
        description: 'Failed to load job details',
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    if (!jobData) {
      setLoading(false)
      return
    }

    // Parse text fields into arrays if needed
    const parseArrayField = (field: any): string[] => {
      if (!field) return []
      if (Array.isArray(field)) return field
      if (typeof field === 'string') {
        try {
          // Try parsing as JSON first
          const parsed = JSON.parse(field)
          return Array.isArray(parsed) ? parsed : [field]
        } catch {
          // If not JSON, split by newlines or commas
          return field.split(/\n|,/).map(s => s.trim()).filter(Boolean)
        }
      }
      return []
    }

    setJob({
      ...jobData,
      requirements: parseArrayField(jobData.requirements),
      responsibilities: parseArrayField(jobData.responsibilities),
      benefits: parseArrayField(jobData.benefits),
    })

    // Fetch candidates for this job
    const { data: candidatesData, error: candidatesError } = await supabase
      .from('candidates')
      .select('*')
      .eq('job_id', params.id)

    if (!candidatesError && candidatesData) {
      setCandidates(candidatesData)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchJobDetails()
  }, [params.id])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'shortlisted':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-300'
      case 'interviewing':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'offered':
        return 'bg-purple-100 text-purple-700 border-purple-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  // If this is the "new" route, render the NewJobPage component
  if (params.id === 'new') {
    return <NewJobPage />
  }
  
  // Don't render if this isn't a valid UUID route
  if (!shouldRender) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4F46E5]" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-lg text-muted-foreground">Job not found</p>
        <Button onClick={() => router.push('/recruiter/postings')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Job Postings
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/recruiter/postings')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Job Postings
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {job.location}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  {job.job_type}
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  {job.experience_level}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Posted {new Date(job.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-700 border-green-300">
              {job.status || 'Active'}
            </Badge>
          </div>
        </div>

        {/* Applicant Pipeline with Card and Table Views */}
        <RecruiterPipeline jobId={params.id as string} />

        {/* Job Contact Information */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              {job.contact_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a href={`mailto:${job.contact_email}`} className="text-[#4F46E5] hover:underline">
                    {job.contact_email}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
