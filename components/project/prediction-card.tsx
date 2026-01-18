import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Calendar } from "lucide-react"
import type { Project } from "@/lib/types"

interface PredictionCardProps {
  project: Project
}

export function PredictionCard({ project }: PredictionCardProps) {
  const isOnTrack = project.status === "on-track"
  const daysEarlyOrLate = project.daysEarlyOrLate

  // Format the delay/early message
  const getStatusMessage = () => {
    if (daysEarlyOrLate === 0) {
      return "On target"
    } else if (daysEarlyOrLate < 0) {
      const days = Math.abs(daysEarlyOrLate)
      return `${days} ${days === 1 ? 'day' : 'days'} early`
    } else {
      return `${daysEarlyOrLate} ${daysEarlyOrLate === 1 ? 'day' : 'days'} late`
    }
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          AI Prediction
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Estimated Completion</p>
            <p className="text-2xl font-bold text-foreground">{project.estimatedCompletion}</p>
          </div>
          <div className="flex items-center gap-2">
            {isOnTrack ? (
              <>
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                  {getStatusMessage()}
                </Badge>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200">
                  {getStatusMessage()}
                </Badge>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
