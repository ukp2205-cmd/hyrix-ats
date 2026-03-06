import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle2, ArrowRight } from "lucide-react"

export function TalentSection() {
  const features = [
    {
      title: "Pre-Built & Custom Interview Templates",
      description: "Access industry-standard templates or create custom ones tailored to your needs",
    },
    {
      title: "Video Interviewing & AI Screening",
      description: "Conduct video interviews with automated AI-powered candidate screening",
    },
    {
      title: "Competency-Based Evaluations",
      description: "Assess candidates based on skills, experience, and cultural fit metrics",
    },
    {
      title: "Flexible Workflow Solutions",
      description: "Customize your hiring pipeline to match your unique recruitment process",
    },
  ]

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary font-medium mb-6">
                Smart Talent Acquisition
              </div>
              <h2 className="text-4xl font-bold text-balance leading-tight mb-4">
                Find the Right Talent with Our AI Hiring Agent
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Use AI to screen, rank, and shortlist candidates automatically. Our intelligent algorithms evaluate
                resumes, match skills, and predict candidate success—all in real-time.
              </p>
            </div>
            <div className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button
              size="lg"
              className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white hover:opacity-90 transition-opacity shadow-lg"
            >
              Learn More
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          <div className="relative">
            <div className="grid gap-4">
              <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Top Candidates</h3>
                  <div className="rounded-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] px-3 py-1 text-sm font-medium text-white">
                    55% Match Rate
                  </div>
                </div>
                <img src="/candidate-profiles-list.jpg" alt="Candidate Matches" className="w-full h-auto rounded-lg" />
              </Card>
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-6 bg-accent/5 border-accent/20">
                  <div className="text-3xl font-bold text-foreground mb-1">75%</div>
                  <div className="text-sm text-muted-foreground">Time Saved</div>
                </Card>
                <Card className="p-6 bg-primary/5 border-primary/20">
                  <div className="text-3xl font-bold text-foreground mb-1">2.5x</div>
                  <div className="text-sm text-muted-foreground">Faster Hiring</div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
