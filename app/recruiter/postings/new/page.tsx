import { Suspense } from 'react'
import JobCreationForm from '@/components/job-creation-form'

export default function RecruiterNewJobPage() {
  return (
    <Suspense fallback={null}>
      <JobCreationForm userRole="recruiter" />
    </Suspense>
  )
}
