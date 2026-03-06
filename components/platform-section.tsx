import { Card } from "@/components/ui/card"
import { Zap, Users, Target, TrendingUp } from "lucide-react"

export function PlatformSection() {
  return (
    <section className="bg-secondary/30 py-20">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 lg:grid-cols-2 items-center">
          <div className="order-2 lg:order-1">
            <img
              src="/hr-analytics-dashboard.png"
              alt="Platform Dashboard"
              className="w-full h-auto rounded-2xl shadow-2xl"
            />
          </div>
          <div className="order-1 lg:order-2 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary font-medium">
              All-in-One Platform
            </div>
            <h2 className="text-4xl font-bold text-balance leading-tight">
              The Complete Recruitment Solution for Modern Teams
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              JobKarle combines powerful AI technology with intuitive design to deliver a seamless hiring experience.
              Manage candidates, automate workflows, and make data-driven decisions all in one place.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="p-5 border-primary/10 hover:border-primary/30 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-2 text-foreground">Lightning Fast</h3>
                <p className="text-sm text-muted-foreground">Screen hundreds of applications in minutes, not hours</p>
              </Card>
              <Card className="p-5 border-primary/10 hover:border-primary/30 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent mb-3">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-2 text-foreground">Collaborative</h3>
                <p className="text-sm text-muted-foreground">
                  Enable seamless team collaboration throughout the hiring process
                </p>
              </Card>
              <Card className="p-5 border-primary/10 hover:border-primary/30 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                  <Target className="h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-2 text-foreground">Precision Matching</h3>
                <p className="text-sm text-muted-foreground">AI-powered algorithms find the perfect candidate fit</p>
              </Card>
              <Card className="p-5 border-primary/10 hover:border-primary/30 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent mb-3">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-2 text-foreground">Smart Analytics</h3>
                <p className="text-sm text-muted-foreground">Get actionable insights with real-time hiring metrics</p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
