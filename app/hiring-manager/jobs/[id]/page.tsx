'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import HiringManagerPipeline from '@/components/hiring-manager-pipeline'
import { createClient } from '@/utils/supabase/client'

interface JobDetails {
  id: string
  title: string
  location: string
}

export default function HiringManagerJobPage() {
  const params = useParams()
  const jobId = params?.id as string
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null)

  useEffect(() => {
    async function fetchJobDetails() {
      const supabase = createClient()
      const { data } = await supabase
        .from('jobs')
        .select('id, title, location')
        .eq('id', jobId)
        .single()
      
      if (data) {
        setJobDetails(data)
      }
    }

    if (jobId) {
      fetchJobDetails()
    }
  }, [jobId])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <HiringManagerPipeline 
          jobId={jobId} 
          jobTitle={jobDetails?.title}
          jobLocation={jobDetails?.location}
        />
      </div>
    </div>
  )
}
