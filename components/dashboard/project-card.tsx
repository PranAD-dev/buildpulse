import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar, Box, Image } from "lucide-react"
import type { Project } from "@/lib/supabase"

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const progressPercentage = project.overall_progress
  const circumference = 2 * Math.PI * 36
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference

  // Calculate days until deadline
  const daysUntilDeadline = project.target_completion_date
    ? Math.ceil((new Date(project.target_completion_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  // Determine status based on progress and deadline
  const isOnTrack = daysUntilDeadline ? daysUntilDeadline > 0 : true

  // Format last updated
  const lastUpdated = new Date(project.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <Link href={`/project/${project.id}`}>
      <Card className="h-full hover:shadow-lg transition-all hover:border-accent/30 cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {project.reference_type === '3d_model' ? (
                <Box className="w-4 h-4 text-accent flex-shrink-0" />
              ) : (
                <Image className="w-4 h-4 text-accent flex-shrink-0" />
              )}
              <CardTitle className="text-lg font-semibold text-foreground line-clamp-1">{project.name}</CardTitle>
            </div>
            <Badge
              variant={isOnTrack ? "default" : "destructive"}
              className={
                isOnTrack
                  ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-0 flex-shrink-0"
                  : "bg-red-500/10 text-red-600 hover:bg-red-500/20 border-0 flex-shrink-0"
              }
            >
              {isOnTrack ? "On Track" : "Behind"}
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
                  className={isOnTrack ? "text-accent" : "text-red-500"}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-foreground">{progressPercentage}%</span>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              {daysUntilDeadline !== null && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{daysUntilDeadline} days until deadline</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Created {lastUpdated}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
