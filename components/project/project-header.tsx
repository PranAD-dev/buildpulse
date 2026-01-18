import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import { ProjectActions } from "./project-actions"
import { GenerateReportButton } from "./generate-report-button"
import type { Project } from "@/lib/types"

interface ProjectHeaderProps {
  project: Project
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  return (
    <div className="bg-background border-b border-border">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-4">
          <Button asChild variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
              <Badge
                variant={project.status === "on-track" ? "default" : "destructive"}
                className={
                  project.status === "on-track"
                    ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-0"
                    : "bg-red-500/10 text-red-600 hover:bg-red-500/20 border-0"
                }
              >
                {project.status === "on-track" ? "On Track" : "Behind Schedule"}
              </Badge>
              <ProjectActions projectId={project.id} projectName={project.name} />
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span>
                Target: <span className="text-foreground font-medium">{project.targetDate}</span>
              </span>
              <span>
                Overall Progress: <span className="text-foreground font-medium">{project.overallProgress}%</span>
              </span>
            </div>
          </div>
          <GenerateReportButton projectId={project.id} projectName={project.name} existingVideoUrl={project.reportVideoUrl} />
        </div>
      </div>
    </div>
  )
}
