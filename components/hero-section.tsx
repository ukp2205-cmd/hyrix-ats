"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"
import React from "react"
import { useRouter } from "next/navigation"

export function HeroSection() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = React.useState(false)
  const [userRole, setUserRole] = React.useState<string | null>(null)

  React.useEffect(() => {
    const userStr = localStorage.getItem('hyrix_user')
    if (userStr) {
      try {
        const userData = JSON.parse(userStr)
        const now = new Date().getTime()
        const sessionAge = now - userData.loginTime
        const isExpired = sessionAge > userData.expiresIn
        
        if (!isExpired) {
          setIsLoggedIn(true)
          setUserRole(userData.role)
        }
      } catch (err) {
        console.error('[v0] HeroSection: Error checking auth:', err)
      }
    }
  }, [])

  const handleSignInClick = (e: React.MouseEvent) => {
    if (isLoggedIn && userRole) {
      e.preventDefault()
      console.log('[v0] HeroSection: User already logged in, redirecting to dashboard')
      const targetRoute = userRole === 'super_admin' || userRole === 'admin' ? '/admin' : '/recruiter'
      router.push(targetRoute)
    }
  }

  return (
    <section className="relative overflow-hidden bg-background">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED]">
              <span className="text-xl font-bold text-white">HX</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent">
              Hyrix
            </span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Features
            </a>
            <a href="#solutions" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Solutions
            </a>
            <a href="#resources" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Resources
            </a>
            <a href="#pricing" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Pricing
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" onClick={handleSignInClick}>
              <Button variant="ghost" className="text-foreground">
                {isLoggedIn ? 'Dashboard' : 'Sign In'}
              </Button>
            </Link>
            {!isLoggedIn && (
              <Link href="/register">
                <Button className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white hover:opacity-90 transition-opacity">
                  Get Started
                </Button>
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Content */}
      <HeroCarousel />
    </section>
  )
}

function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = React.useState(0)

  const slides = [
    {
      badge: "AI-Powered Recruitment Platform",
      title: "Transform Hiring with",
      highlight: "AI-Powered",
      titleEnd: "Intelligence",
      description:
        "Streamline your recruitment process with Hyrix's intelligent ATS. Find the perfect candidates faster with AI-driven screening, automated workflows, and smart analytics.",
      stats: [
        { value: "10K+", label: "Active Jobs" },
        { value: "500+", label: "Companies" },
        { value: "95%", label: "Success Rate" },
      ],
      image: "/modern-ats-dashboard-interface-with-candidate-prof.jpg",
      imageAlt: "Hyrix Dashboard Interface",
    },
    {
      badge: "Smart Candidate Matching",
      title: "Find the Perfect",
      highlight: "Talent Match",
      titleEnd: "in Minutes",
      description:
        "Our AI algorithms analyze thousands of profiles to match the best candidates with your job requirements. Reduce hiring time by 70% with intelligent candidate recommendations.",
      stats: [
        { value: "1M+", label: "Candidates" },
        { value: "70%", label: "Time Saved" },
        { value: "98%", label: "Match Accuracy" },
      ],
      image: "/professional-recruitment-illustration-with-diverse.jpg",
      imageAlt: "Talent Matching",
    },
    {
      badge: "Automated Workflows",
      title: "Streamline Your",
      highlight: "Hiring Process",
      titleEnd: "End-to-End",
      description:
        "Automate repetitive tasks, schedule interviews seamlessly, and collaborate with your team in real-time. Focus on what matters - connecting with the right talent.",
      stats: [
        { value: "50+", label: "Integrations" },
        { value: "24/7", label: "Support" },
        { value: "100%", label: "Uptime" },
      ],
      image: "/modern-ats-dashboard-interface-with-candidate-prof.jpg",
      imageAlt: "Automated Workflows",
    },
  ]

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [slides.length])

  return (
    <div className="container mx-auto px-4 pb-20 pt-12">
      <div className="relative">
        {/* Slides */}
        <div className="relative min-h-[600px] lg:min-h-[500px]">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                index === currentSlide
                  ? "opacity-100 translate-x-0"
                  : index < currentSlide
                    ? "opacity-0 -translate-x-full"
                    : "opacity-0 translate-x-full"
              }`}
            >
              <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary">
                    <Sparkles className="h-4 w-4" />
                    <span className="font-medium">{slide.badge}</span>
                  </div>
                  <h1 className="text-4xl font-bold leading-tight text-balance lg:text-6xl">
                    {slide.title}{" "}
                    <span className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent">
                      {slide.highlight}
                    </span>{" "}
                    {slide.titleEnd}
                  </h1>
                  <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">{slide.description}</p>
                  <div className="flex flex-col gap-4 sm:flex-row pt-2">
                    <Link href="/register">
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white hover:opacity-90 transition-opacity text-base px-8 shadow-lg"
                      >
                        Start Hiring
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <Button
                      size="lg"
                      variant="outline"
                      className="text-base px-8 border-2 hover:bg-accent bg-transparent"
                    >
                      Find Jobs
                    </Button>
                  </div>
                  <div className="flex items-center gap-8 pt-6">
                    {slide.stats.map((stat, statIndex) => (
                      <React.Fragment key={statIndex}>
                        {statIndex > 0 && <div className="h-12 w-px bg-border" />}
                        <div>
                          <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                          <div className="text-sm text-muted-foreground">{stat.label}</div>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <div className="relative aspect-square w-full max-w-lg mx-auto">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 rounded-3xl blur-3xl" />
                    <div className="relative z-10 rounded-2xl border border-border bg-card p-8 shadow-2xl">
                      <img
                        src={slide.image || "/placeholder.svg"}
                        alt={slide.imageAlt}
                        className="w-full h-auto rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-3 mt-16">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-10 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED]"
                  : "w-2.5 bg-muted hover:bg-muted-foreground/30"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
