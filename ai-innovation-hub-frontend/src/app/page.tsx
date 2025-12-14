import Link from "next/link"
import { ArrowRight, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SplineHero } from "@/components/SplineHero"

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="landing-hero">
        <SplineHero />
        <div className="landing-hero-content container py-14 md:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="landing-copy">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-950">
                Your AI co-founder for turning ideas into build-ready blueprints
              </h1>
              <p className="mt-4 text-lg text-slate-900">
                Generate problem statements, personas, features, launch content, validation experiments,
                tech stack guidance, and even starter code — all in one workflow.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/new">
                    Start with your idea <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/dashboard">Open dashboard</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a
                    href="https://monkey9-cyber-cat-spidy.github.io/jntugv-hackathon-dec-2025-Team-85/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Docs <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <Card className="bg-background/70">
                  <CardContent className="p-4">
                    <div className="font-medium">7-phase workflow</div>
                    <div className="text-sm text-slate-800">
                      Ideation → Final Spec (with versioned artifacts)
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-background/70">
                  <CardContent className="p-4">
                    <div className="font-medium">Code ZIP export</div>
                    <div className="text-sm text-slate-800">
                      Phase-based or file-by-file generator (more reliable)
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[720px] min-h-[520px]">
                <div className="thought-bubble">
                  Your idea my design lets go
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-10">
        <div className="text-sm text-muted-foreground">
          Tip: use the floating bot (bottom-right) to chat or to generate a better project description.
        </div>
      </div>
    </div>
  )
}
