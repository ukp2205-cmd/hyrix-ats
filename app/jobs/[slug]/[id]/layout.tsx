import React from "react"
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

type Props = {
  params: { id: string; slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  
  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!job) {
    return {
      title: 'Job Not Found',
    }
  }

  // Format: Title | Location | Experience
  const experienceText = job.min_experience && job.max_experience 
    ? `${job.min_experience}-${job.max_experience} years`
    : job.min_experience 
      ? `${job.min_experience}+ years`
      : 'All levels'
  
  const title = `${job.title} | ${job.location} | ${experienceText}`
  const description = title

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Hyrix',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default function JobLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
