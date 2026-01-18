import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar, Box, Image } from "lucide-react"
import { InteractiveCard } from "@/components/3d/interactive-card"
import { ProgressCylinder } from "@/components/3d/progress-cylinder"
import type { Project } from "@/lib/supabase"

interface ProjectCardProps {
  project: Project & { isDelayed?: boolean }
}

export function ProjectCard({ project }: ProjectCardProps) {
  const progressPercentage = project.overall_progress
  const circumference = 2 * Math.PI * 36
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference

  // Calculate days until deadline
  const daysUntilDeadline = project.target_completion_date
    ? Math.ceil((new Date(project.target_completion_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  // Use isDelayed from props if provided, otherwise fallback to deadline check
  const isOnTrack = project.isDelayed !== undefined ? !project.isDelayed : (daysUntilDeadline ? daysUntilDeadline > 0 : true)

  // Format last updated
  const lastUpdated = new Date(project.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <Link href={`/project/${project.id}`}>
      <InteractiveCard intensity={12}>
        <Card className="h-full shadow-xl transition-all border-2 border-border cursor-pointer overflow-hidden">
          <CardHeader className="pb-3 bg-card">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {project.reference_type === '3d_model' ? (
                  <Box className="w-5 h-5 text-accent flex-shrink-0" />
                ) : (
                  <Image className="w-5 h-5 text-accent flex-shrink-0" />
                )}
                <CardTitle className="text-lg font-semibold text-foreground line-clamp-1">{project.name}</CardTitle>
              </div>
              <Badge
                variant={isOnTrack ? "default" : "destructive"}
                className={
                  isOnTrack
                    ? "bg-emerald-500 text-white border-0 flex-shrink-0 shadow-md"
                    : "bg-red-500 text-white border-0 flex-shrink-0 shadow-md"
                }
              >
                {isOnTrack ? "On Track" : "Behind"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="bg-card">
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0">
                <ProgressCylinder
                  progress={progressPercentage}
                  size={100}
                  color={isOnTrack ? "#10B981" : "#EF4444"}
                />
              </div>
              <div className="flex-1 space-y-3">
                {daysUntilDeadline !== null && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">{daysUntilDeadline} days until deadline</span>
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
      </InteractiveCard>
    </Link>
  )
}
