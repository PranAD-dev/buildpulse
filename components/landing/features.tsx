import { Brain, Calendar, Grid3X3, Video } from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "AI Photo Analysis",
    description:
      "Advanced computer vision compares daily photos to reference images and calculates precise progress percentages.",
  },
  {
    icon: Calendar,
    title: "Deadline Predictions",
    description:
      "Machine learning models analyze your progress velocity to predict actual completion dates with high accuracy.",
  },
  {
    icon: Grid3X3,
    title: "Zone-Based Tracking",
    description: "Break your project into zones for granular tracking. See which areas need attention at a glance.",
  },
  {
    icon: Video,
    title: "Video Reports",
    description:
      "Generate professional video reports showing your progress over time. Perfect for stakeholder updates.",
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Powerful Features</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to keep your construction projects on track
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-card rounded-2xl p-8 border border-border hover:border-accent/30 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
