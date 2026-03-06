import { Card } from "@/components/ui/card"
import { Brain, LineChart, Workflow } from "lucide-react"

export function AIScreeningSection() {
  return (
    <section className="bg-secondary/30 py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary font-medium mb-6">
            AI-Powered Intelligence
          </div>
          <h2 className="text-4xl font-bold text-balance mb-4">The Only ATS Powered by AI Screening</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Our advanced AI technology automates tedious screening tasks, helping you focus on what matters—connecting
            with the best candidates.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-8 border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-6">
              <Brain className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground">Smart Candidate Scoring</h3>
            <p className="text-muted-foreground leading-relaxed">
              Our AI analyzes resumes and ranks candidates based on skills, experience, and job requirements, ensuring
              you never miss a great hire.
            </p>
          </Card>
          <Card className="p-8 border-accent/10 hover:border-accent/30 transition-all hover:shadow-lg">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent mb-6">
              <LineChart className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground">AI Resume Screening</h3>
            <p className="text-muted-foreground leading-relaxed">
              Automatically parse and evaluate thousands of resumes in seconds. Our AI extracts key information and
              matches candidates to job criteria.
            </p>
          </Card>
          <Card className="p-8 border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-6">
              <Workflow className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground">Automated Workflows</h3>
            <p className="text-muted-foreground leading-relaxed">
              Set up intelligent automation that handles routine tasks like scheduling, follow-ups, and candidate
              communication automatically.
            </p>
          </Card>
        </div>
        <div className="mt-16 relative">
          <img
            src="/ai-screening-dashboard-interface.jpg"
            alt="AI Screening Interface"
            className="w-full h-auto rounded-2xl shadow-2xl border border-border"
          />
        </div>
      </div>
    </section>
  )
}
