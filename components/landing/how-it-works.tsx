import { Upload, Camera, TrendingUp } from "lucide-react"

const steps = [
  {
    icon: Upload,
    title: "Upload Target",
    description: "Upload reference images of your completed zones. Define what done looks like for each area.",
  },
  {
    icon: Camera,
    title: "Snap Daily Photos",
    description: "Take photos of your construction site each day. Our system tracks changes automatically.",
  },
  {
    icon: TrendingUp,
    title: "Get AI Predictions",
    description: "AI analyzes your progress and predicts completion dates. Get alerts when you fall behind.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">How It Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to transform your construction progress tracking
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              <div className="bg-card rounded-2xl p-8 border border-border h-full hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                  <step.icon className="w-7 h-7 text-accent" />
                </div>
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
