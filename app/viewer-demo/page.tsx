'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState, useEffect } from 'react'
import { GLBRoomViewer } from '@/components/glb-viewer/glb-room-viewer'
import { AlertTriangle, DollarSign, X } from 'lucide-react'

function ViewerContent() {
  const searchParams = useSearchParams()
  const [showDelayBanner, setShowDelayBanner] = useState(false)
  const [delayData, setDelayData] = useState<{
    daysDelayed: number
    delayCost: number
    dailyCost: number
  } | null>(null)

  // Get model URL from query params, fallback to demo model
  const modelUrl = searchParams.get('model') || '/part1.glb'
  const projectName = searchParams.get('projectName') || 'Demo Project'
  const projectId = searchParams.get('projectId')

  // Check if project deadline is tomorrow AND has at least one zone - show delay banner
  useEffect(() => {
    if (!projectId) return

    const checkDelayConditions = async () => {
      try {
        // Check both project deadline AND zones
        const [projectRes, zonesRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/rooms?project_id=${projectId}`)
        ])

        if (!projectRes.ok || !zonesRes.ok) return

        const project = await projectRes.json()
        const zones = await zonesRes.json()

        // Check if deadline is tomorrow or past
        const hasTomorrowDeadline = project.target_completion_date &&
          Math.ceil((new Date(project.target_completion_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 1

        // Check if at least one zone exists
        const hasZones = zones && zones.length > 0

        // DEMO: Show delay banner only if BOTH conditions are met
        if (hasTomorrowDeadline && hasZones) {
          const daysDelayed = 3 // Hardcoded for demo
          const dailyCost = 15000 // $15k/day
          setDelayData({
            daysDelayed,
            delayCost: daysDelayed * dailyCost,
            dailyCost,
          })
          setShowDelayBanner(true)
        }
      } catch (error) {
        console.error('Error checking delay conditions:', error)
      }
    }

    checkDelayConditions()
  }, [projectId])

  return (
    <div className="h-screen w-full relative">
      {/* Delay Alert Banner */}
      {showDelayBanner && delayData && (
        <div className="absolute top-14 left-0 right-0 z-30 bg-red-600 text-white px-4 py-3 shadow-lg">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold">PROJECT DELAYED</span>
              </div>
              <div className="h-6 w-px bg-red-400" />
              <span className="text-red-100">
                {delayData.daysDelayed} days behind schedule
              </span>
              <div className="h-6 w-px bg-red-400" />
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                <span className="font-bold">${(delayData.delayCost / 1000).toFixed(0)}K</span>
                <span className="text-red-200 text-sm">delay cost impact</span>
              </div>
              <div className="h-6 w-px bg-red-400" />
              <span className="text-red-200 text-sm">
                (${(delayData.dailyCost / 1000).toFixed(0)}K/day)
              </span>
            </div>
            <button
              onClick={() => setShowDelayBanner(false)}
              className="p-1 hover:bg-red-700 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <GLBRoomViewer
        modelUrl={modelUrl}
        projectId={projectId || undefined}
        projectName={projectName}
      />
    </div>
  )
}

export default function ViewerDemoPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading 3D Viewer...</p>
        </div>
      </div>
    }>
      <ViewerContent />
    </Suspense>
  )
}
