import { Card } from "@/components/ui/card"
import { Trophy, Heart, DollarSign, Clock } from "lucide-react"

export function WhyHyrixSection() {
  const benefits = [
    {
      icon: Trophy,
      title: "AI-Driven Talent Matching",
      description:
        "Our advanced algorithms connect you with candidates who truly fit your culture and requirements, reducing time-to-hire by 60%",
    },
    {
      icon: Heart,
      title: "Streamlined End-to-End Process",
      description:
        "From job posting to onboarding, manage every step of recruitment in one intuitive platform with automated workflows",
    },
    {
      icon: DollarSign,
      title: "Cost-Effective Solutions",
      description:
        "Reduce recruitment costs by up to 50% with intelligent automation and efficient candidate management",
    },
    {
      icon: Clock,
      title: "Focus on Culture & Fit",
      description:
        "Go beyond resumes with behavioral assessments and cultural fit analysis to build stronger, more cohesive teams",
    },
  ]

  return (
    <section className="bg-secondary/30 py-20">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="absolute inset-0 rounded-3xl blur-3xl bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
            <img
              src="/happy-hr-professional-using-ats.jpg"
              alt="Why Hyrix"
              className="relative z-10 w-full h-auto rounded-2xl shadow-2xl"
            />
          </div>
          <div className="space-y-8 order-1 lg:order-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary font-medium mb-6">
                Why Choose Us
              </div>
              <h2 className="text-4xl font-bold text-balance leading-tight mb-4">Why Hyrix?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                JobKarle isn't just another ATS—it's your strategic hiring partner, powered by cutting-edge AI to help
                you make better hiring decisions faster.
              </p>
            </div>
            <div className="space-y-6">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon
                return (
                  <Card key={index} className="p-6 border-primary/10 hover:border-primary/30 transition-colors">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg ${index % 2 === 0 ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold mb-2 text-foreground">{benefit.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
