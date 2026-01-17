"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, DollarSign, TrendingUp } from "lucide-react"
import type { Project } from "@/lib/types"

interface DelayCostCardProps {
  project: Project
}

export function DelayCostCard({ project }: DelayCostCardProps) {
  const isOnTrack = project.status === "on-track"

  // Calculate days of delay (negative means early)
  const targetDate = new Date(project.targetDate)
  const estimatedDate = new Date(project.estimatedCompletion)
  const delayDays = Math.round((estimatedDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24))

  // Calculate financial impact
  const currentDelayCost = delayDays > 0 ? delayDays * project.dailyDelayCost : 0
  const projectedMonthlyCost = project.dailyDelayCost * 30

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`
    }
    return `$${amount.toLocaleString()}`
  }

  if (isOnTrack) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Cost Savings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">You're Saving</p>
              <p className="text-3xl font-bold text-emerald-600">
                {formatCurrency(Math.abs(delayDays) * project.dailyDelayCost)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">by finishing {Math.abs(delayDays)} days early</p>
            </div>
            <div className="h-px bg-emerald-200" />
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Daily delay cost avoided</span>
              <span className="font-medium text-emerald-700">{formatCurrency(project.dailyDelayCost)}/day</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-4 h-4" />
          Delay Cost Impact
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Current Delay Cost</p>
            <p className="text-3xl font-bold text-red-600">{formatCurrency(currentDelayCost)}</p>
            <p className="text-xs text-muted-foreground mt-1">{delayDays} days behind schedule</p>
          </div>

          <div className="h-px bg-red-200" />

          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Daily delay cost</span>
              <span className="font-medium text-red-600">{formatCurrency(project.dailyDelayCost)}/day</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">If delayed another month</span>
              <span className="font-medium text-red-600">+{formatCurrency(projectedMonthlyCost)}</span>
            </div>
          </div>

          <div className="bg-red-100 rounded-lg p-3 border border-red-200">
            <div className="flex items-start gap-2">
              <DollarSign className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-red-700">Cost Breakdown</p>
                <p className="text-xs text-red-600 mt-1">
                  Labor standby, equipment rental, financing charges, and lost revenue opportunity
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
