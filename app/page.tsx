'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { HeroSection } from "@/components/hero-section"
import { PlatformSection } from "@/components/platform-section"
import { TalentSection } from "@/components/talent-section"
import { AIScreeningSection } from "@/components/ai-screening-section"
import { HRMSSection } from "@/components/hrms-section"
import { WhyHyrixSection } from "@/components/why-hyrix-section"
import { CTASection } from "@/components/cta-section"
import { Footer } from "@/components/footer"

export default function HomePage() {
  const router = useRouter()
  const { userEmail, userRole, loading } = useAuth()
  
  
  // Auto-redirect if authenticated
  useEffect(() => {
    if (!loading && userEmail && userRole) {
      let targetRoute = '/recruiter' // default for recruiter
      
      if (userRole === 'super_admin' || userRole === 'admin') {
        targetRoute = '/admin'
      } else if (userRole === 'hiring_manager') {
        targetRoute = '/hiring-manager'
      }
      
      router.replace(targetRoute)
    }
  }, [loading, userEmail, userRole, router])
  
  // While auth is loading or redirect is pending, show a full-screen loader
  if (loading || userEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen overflow-y-auto">
      <HeroSection />
      <PlatformSection />
      <TalentSection />
      <AIScreeningSection />
      <HRMSSection />
      <WhyHyrixSection />
      <CTASection />
      <Footer />
    </main>
  )
}
