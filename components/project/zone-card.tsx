"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Camera, Box } from "lucide-react"
import { InteractiveCard } from "@/components/3d/interactive-card"
import { ProgressCylinder } from "@/components/3d/progress-cylinder"
import { ModelViewer } from "./model-viewer"
import type { Zone } from "@/lib/types"

interface ZoneCardProps {
  zone: Zone
}

export function ZoneCard({ zone }: ZoneCardProps) {
  const [showModel, setShowModel] = useState(false)
  const has3DModel = zone.model3dUrl && zone.progress >= 75

  return (
    <>
      <InteractiveCard intensity={8}>
        <Card className="overflow-hidden shadow-lg border-2 border-border">
          <CardContent className="p-0">
            <div className="flex gap-4 p-4">
              <div className="flex-shrink-0">
                <ProgressCylinder
                  progress={zone.progress}
                  size={80}
                  color={zone.progress >= 75 ? "#10B981" : zone.progress >= 50 ? "#F97316" : "#F59E0B"}
                />
                {has3DModel && (
                  <Badge className="mt-1 w-full justify-center h-5 px-1 text-[10px] bg-primary text-primary-foreground shadow-md">
                    3D
                  </Badge>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground mb-3 text-lg">{zone.name}</h3>
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground font-medium">Completion</span>
                    <span className="font-bold text-foreground text-lg">{zone.progress}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all shadow-md ${
                        zone.progress >= 75 ? "bg-emerald-500" : zone.progress >= 50 ? "bg-accent" : "bg-amber-500"
                      }`}
                      style={{ width: `${zone.progress}%` }}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline" className="flex-1 gap-1.5 border-2">
                    <Link href={`/checkin/${zone.id}`}>
                      <Camera className="w-4 h-4" />
                      Check In
                    </Link>
                  </Button>
                  {has3DModel && (
                    <Button size="sm" className="gap-1.5 bg-primary shadow-md" onClick={() => setShowModel(true)}>
                      <Box className="w-4 h-4" />
                      View 3D
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </InteractiveCard>

      {has3DModel && zone.model3dUrl && (
        <ModelViewer modelUrl={zone.model3dUrl} zoneName={zone.name} open={showModel} onOpenChange={setShowModel} />
      )}
    </>
  )
}
