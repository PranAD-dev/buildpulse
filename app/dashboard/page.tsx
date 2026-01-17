import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ProjectCard } from "@/components/dashboard/project-card"
import { EmptyState } from "@/components/dashboard/empty-state"
import { mockProjects } from "@/lib/mock-data"

export default function DashboardPage() {
  const projects = mockProjects

  return (
    <div className="min-h-screen bg-muted/20">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">Your Projects</h1>
          <p className="text-muted-foreground">Track and manage your construction progress</p>
        </div>

        {projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
