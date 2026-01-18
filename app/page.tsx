import { Header } from "@/components/landing/header"
import { Hero } from "@/components/landing/hero"
import { HowItWorks } from "@/components/landing/how-it-works"
import { CostImpact } from "@/components/landing/cost-impact"
import { Features } from "@/components/landing/features"
import { Footer } from "@/components/landing/footer"
import { FloatingBackground } from "@/components/3d/floating-background"

export default function LandingPage() {
  return (
    <div className="min-h-screen relative">
      <FloatingBackground />
      <div className="relative z-10">
        <Header />
        <main>
          <Hero />
          <CostImpact />
          <HowItWorks />
          <Features />
        </main>
        <Footer />
      </div>
    </div>
  )
}
