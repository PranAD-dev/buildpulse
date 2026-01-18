'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { GLBRoomViewer } from '@/components/glb-viewer/glb-room-viewer'

function ViewerContent() {
  const searchParams = useSearchParams()

  // Get model URL from query params, fallback to demo model
  const modelUrl = searchParams.get('model') || '/part1.glb'
  const projectName = searchParams.get('projectName') || 'Demo Project'
  const projectId = searchParams.get('projectId')

  return (
    <div className="h-screen w-full">
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
