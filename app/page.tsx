import { Header } from "@/components/landing/header"
import { Hero } from "@/components/landing/hero"
import { HowItWorks } from "@/components/landing/how-it-works"
import { CostImpact } from "@/components/landing/cost-impact"
import { Features } from "@/components/landing/features"
import { Footer } from "@/components/landing/footer"

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <CostImpact />
        <HowItWorks />
        <Features />
      </main>
      <Footer />
    </div>
  )
}
