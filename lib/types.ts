export interface Zone {
  id: string
  name: string
  progress: number
  referenceImage: string
  x: number
  y: number
  model3dUrl?: string
}

export interface Project {
  id: string
  name: string
  targetDate: string
  overallProgress: number
  status: "on-track" | "behind"
  daysUntilDeadline: number
  lastUpdated: string
  estimatedCompletion: string
  zones: Zone[]
  progressHistory: { date: string; progress: number }[]
  totalBudget: number
  dailyDelayCost: number // Cost per day of delay (labor, equipment rental, financing, etc.)
  reportVideoUrl?: string | null
}

export interface CheckInResult {
  percentComplete: number
  confidence: "high" | "medium" | "low"
  visibleCompleted: string[]
  stillMissing: string[]
}
