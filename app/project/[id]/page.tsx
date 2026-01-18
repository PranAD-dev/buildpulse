import { notFound } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ProjectHeader } from "@/components/project/project-header"
import { PredictionCard } from "@/components/project/prediction-card"
import { DelayCostCard } from "@/components/project/delay-cost-card"
import { ZoneCard } from "@/components/project/zone-card"
import { ProgressChart } from "@/components/project/progress-chart"
import { ProjectModelViewer } from "@/components/project/project-model-viewer"
import type { Zone } from "@/lib/types"

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

async function getProject(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/projects/${id}`, {
    cache: 'no-store'
  })

  if (!res.ok) {
    return null
  }

  return res.json()
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params
  const projectData = await getProject(id)

  if (!projectData) {
    notFound()
  }

  // Transform MongoDB data to match frontend types
  const zones = projectData.rooms?.map((room: any) => ({
    id: room.id,
    name: room.name,
    progress: room.current_percent || 0,
    referenceImage: room.reference_image_url || projectData.model_url || "/placeholder.svg",
    x: 0,
    y: 0,
    model3dUrl: projectData.reference_type === '3d_model' ? projectData.model_url : room.model_url,
  })) || []

  // Calculate days until deadline
  const daysUntilDeadline = projectData.target_completion_date
    ? Math.ceil((new Date(projectData.target_completion_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 30

  // Format target date
  const targetDate = projectData.target_completion_date
    ? new Date(projectData.target_completion_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Not set'

  // Format last updated
  const lastUpdated = new Date(projectData.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  // Transform progress history from MongoDB format
  const progressHistory = (projectData.progress_history || []).map((entry: any) => ({
    date: entry.date,
    progress: entry.progress,
  }))

  const project = {
    id: projectData.id,
    name: projectData.name,
    targetDate,
    overallProgress: projectData.overall_progress || 0,
    status: (daysUntilDeadline > 0 ? "on-track" : "behind") as "on-track" | "behind",
    daysUntilDeadline,
    lastUpdated,
    estimatedCompletion: targetDate,
    zones,
    progressHistory,
    totalBudget: projectData.budget || 0,
    dailyDelayCost: 5000,
    reportVideoUrl: projectData.report_video_url || null,
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
            {projectData.reference_type === '3d_model' && projectData.model_url && (
              <ProjectModelViewer
                modelUrl={projectData.model_url}
                projectName={projectData.name}
                projectId={projectData.id}
              />
            )}

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Project Zones</h2>
              {zones.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {zones.map((zone: Zone) => (
                    <ZoneCard key={zone.id} zone={zone} />
                  ))}
                </div>
              ) : (
                <div className="bg-card rounded-xl border border-border p-8 text-center">
                  <p className="text-muted-foreground">No zones added yet. Create zones to track progress.</p>
                </div>
              )}
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
                  <span className="font-medium text-foreground">{zones.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Days Remaining</span>
                  <span className="font-medium text-foreground">{daysUntilDeadline}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Last Updated</span>
                  <span className="font-medium text-foreground">{project.lastUpdated}</span>
                </div>
                {zones.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg. Zone Progress</span>
                    <span className="font-medium text-foreground">
                      {Math.round(zones.reduce((sum: number, z: Zone) => sum + z.progress, 0) / zones.length)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
