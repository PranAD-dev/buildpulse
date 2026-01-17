import { notFound } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ProjectHeader } from "@/components/project/project-header"
import { PredictionCard } from "@/components/project/prediction-card"
import { DelayCostCard } from "@/components/project/delay-cost-card"
import { ZoneCard } from "@/components/project/zone-card"
import { ProgressChart } from "@/components/project/progress-chart"
import { getProjectById } from "@/lib/mock-data"

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params
  const project = getProjectById(id)

  if (!project) {
    notFound()
  }

  const formatBudget = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    }
    return `$${(amount / 1000).toFixed(0)}K`
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <DashboardHeader />
      <ProjectHeader project={project} />
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Project Zones</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {project.zones.map((zone) => (
                  <ZoneCard key={zone.id} zone={zone} />
                ))}
              </div>
            </div>
            <ProgressChart project={project} />
          </div>
          <div className="space-y-6">
            <PredictionCard project={project} />
            <DelayCostCard project={project} />
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-medium text-foreground mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Project Budget</span>
                  <span className="font-medium text-foreground">{formatBudget(project.totalBudget)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Zones</span>
                  <span className="font-medium text-foreground">{project.zones.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Days Remaining</span>
                  <span className="font-medium text-foreground">{project.daysUntilDeadline}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Last Updated</span>
                  <span className="font-medium text-foreground">{project.lastUpdated}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg. Zone Progress</span>
                  <span className="font-medium text-foreground">
                    {Math.round(project.zones.reduce((sum, z) => sum + z.progress, 0) / project.zones.length)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
