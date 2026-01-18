import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { FloatingModel } from "@/components/landing/floating-model"

export function Hero() {
  return (
    <section className="pt-32 pb-20 px-4">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              AI-Powered Progress Tracking
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary leading-tight text-balance">
              Track Construction Progress with AI
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg text-pretty">
              Photograph your site daily. AI compares to your target and predicts completion. Stay ahead of delays
              before they happen.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
                <Link href="/dashboard">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-primary/20 hover:bg-primary/5 bg-transparent"
              >
                <Link href="#how-it-works">See How It Works</Link>
              </Button>
            </div>
          </div>
          <div className="relative h-[600px]">
            <FloatingModel />
          </div>
        </div>
      </div>
    </section>
  )
}
