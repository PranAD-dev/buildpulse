import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar } from "lucide-react"
import type { Project } from "@/lib/types"

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const progressPercentage = project.overallProgress
  const circumference = 2 * Math.PI * 36
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference

  return (
    <Link href={`/project/${project.id}`}>
      <Card className="h-full hover:shadow-lg transition-all hover:border-accent/30 cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg font-semibold text-foreground line-clamp-1">{project.name}</CardTitle>
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className={project.status === "on-track" ? "text-accent" : "text-red-500"}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-foreground">{progressPercentage}%</span>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{project.daysUntilDeadline} days until deadline</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Updated {project.lastUpdated}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
