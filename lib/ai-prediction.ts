/**
 * AI-powered project completion prediction based on progress velocity
 */

interface ProgressEntry {
  date: string | Date
  progress: number
}

interface PredictionResult {
  estimatedCompletionDate: Date
  estimatedCompletionString: string
  daysEarlyOrLate: number // positive = late, negative = early
  isOnTrack: boolean
  velocity: number // % per day
  confidence: 'high' | 'medium' | 'low'
}

/**
 * Calculate project completion prediction using linear regression on progress history
 */
export function calculateProjectPrediction(
  progressHistory: ProgressEntry[],
  currentProgress: number,
  targetDate: Date | string
): PredictionResult {
  const target = new Date(targetDate)
  const now = new Date()

  // If no progress history or very little data, use simple calculation
  if (!progressHistory || progressHistory.length < 2) {
    // Assume linear progress from now to target
    const daysRemaining = Math.max(1, (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const progressRemaining = 100 - currentProgress
    const velocity = progressRemaining / daysRemaining

    const estimatedDays = currentProgress < 100 ? progressRemaining / velocity : 0
    const estimatedDate = new Date(now.getTime() + estimatedDays * 24 * 60 * 60 * 1000)

    return {
      estimatedCompletionDate: estimatedDate,
      estimatedCompletionString: estimatedDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      daysEarlyOrLate: Math.round((estimatedDate.getTime() - target.getTime()) / (1000 * 60 * 60 * 24)),
      isOnTrack: estimatedDate <= target,
      velocity,
      confidence: 'low'
    }
  }

  // Sort progress history by date
  const sortedHistory = [...progressHistory]
    .map(entry => ({
      date: new Date(entry.date),
      progress: entry.progress
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  // Calculate velocity using linear regression
  const n = sortedHistory.length

  // Use timestamps in days since first entry for better numerical stability
  const firstDate = sortedHistory[0].date.getTime()
  const dataPoints = sortedHistory.map(entry => ({
    x: (entry.date.getTime() - firstDate) / (1000 * 60 * 60 * 24), // days since start
    y: entry.progress
  }))

  // Linear regression: y = mx + b
  const sumX = dataPoints.reduce((sum, p) => sum + p.x, 0)
  const sumY = dataPoints.reduce((sum, p) => sum + p.y, 0)
  const sumXY = dataPoints.reduce((sum, p) => sum + p.x * p.y, 0)
  const sumXX = dataPoints.reduce((sum, p) => sum + p.x * p.x, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Velocity is the slope (% per day)
  const velocity = slope

  // Calculate when we'll hit 100% progress
  const daysToCompletion = velocity > 0 ? (100 - currentProgress) / velocity : 999

  // Estimated completion date
  const estimatedDate = new Date(now.getTime() + daysToCompletion * 24 * 60 * 60 * 1000)

  // Calculate confidence based on data consistency (R²)
  const meanY = sumY / n
  const ssTotal = dataPoints.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0)
  const ssResidual = dataPoints.reduce((sum, p) => {
    const predicted = slope * p.x + intercept
    return sum + Math.pow(p.y - predicted, 2)
  }, 0)
  const rSquared = 1 - (ssResidual / ssTotal)

  let confidence: 'high' | 'medium' | 'low' = 'low'
  if (rSquared > 0.8 && n >= 5) confidence = 'high'
  else if (rSquared > 0.6 && n >= 3) confidence = 'medium'

  // Days early (negative) or late (positive)
  const daysEarlyOrLate = Math.round((estimatedDate.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))

  return {
    estimatedCompletionDate: estimatedDate,
    estimatedCompletionString: estimatedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }),
    daysEarlyOrLate,
    isOnTrack: estimatedDate <= target,
    velocity,
    confidence
  }
}
