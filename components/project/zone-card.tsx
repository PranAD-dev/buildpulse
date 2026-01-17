"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Camera, Box } from "lucide-react"
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
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-0">
          <div className="flex gap-4 p-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
              <img
                src={zone.referenceImage || "/placeholder.svg"}
                alt={`${zone.name} reference`}
                className="w-full h-full object-cover"
              />
              {has3DModel && (
                <Badge className="absolute bottom-1 right-1 h-5 px-1 text-[10px] bg-primary text-primary-foreground">
                  3D
                </Badge>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground mb-2 truncate">{zone.name}</h3>
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-foreground">{zone.progress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      zone.progress >= 75 ? "bg-emerald-500" : zone.progress >= 50 ? "bg-accent" : "bg-amber-500"
                    }`}
                    style={{ width: `${zone.progress}%` }}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline" className="flex-1 gap-1.5 bg-transparent">
                  <Link href={`/checkin/${zone.id}`}>
                    <Camera className="w-3.5 h-3.5" />
                    Check In
                  </Link>
                </Button>
                {has3DModel && (
                  <Button size="sm" variant="default" className="gap-1.5" onClick={() => setShowModel(true)}>
                    <Box className="w-3.5 h-3.5" />
                    3D
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {has3DModel && zone.model3dUrl && (
        <ModelViewer modelUrl={zone.model3dUrl} zoneName={zone.name} open={showModel} onOpenChange={setShowModel} />
      )}
    </>
  )
}
