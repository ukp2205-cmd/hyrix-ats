import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Database, Gauge, BarChart3, Shield } from "lucide-react"

export function HRMSSection() {
  const features = [
    {
      icon: Database,
      title: "Centralized HR Dashboard",
      description: "Manage all recruitment data from a single, unified dashboard with real-time updates",
      color: "primary",
    },
    {
      icon: Gauge,
      title: "Automated Payroll",
      description: "Seamlessly integrate hiring with payroll systems for smooth onboarding processes",
      color: "accent",
    },
    {
      icon: BarChart3,
      title: "Performance Analytics",
      description: "Track hiring metrics and team performance with comprehensive analytics tools",
      color: "primary",
    },
    {
      icon: Shield,
      title: "Compliance & Security",
      description: "Stay compliant with labor laws and protect sensitive candidate data with enterprise-grade security",
      color: "accent",
    },
  ]

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary font-medium mb-6">
            Integrated HRMS
          </div>
          <h2 className="text-4xl font-bold text-balance mb-4">Transform Operations with AI-Driven HRMS</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Beyond recruitment—manage your entire HR ecosystem with integrated tools for payroll, performance, and
            compliance management.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon
            const isPrimary = feature.color === 'primary'
            const cardClasses = isPrimary
              ? 'p-6 border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg bg-gradient-to-br from-primary/5 to-transparent'
              : 'p-6 border-accent/10 hover:border-accent/30 transition-all hover:shadow-lg bg-gradient-to-br from-accent/5 to-transparent'
            const iconClasses = isPrimary
              ? 'flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4'
              : 'flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent mb-4'
            
            return (
              <Card key={index} className={cardClasses}>
                <div className={iconClasses}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            )
          })}
        </div>
        <div className="text-center">
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
            See How It Works
          </Button>
        </div>
      </div>
    </section>
  )
}
