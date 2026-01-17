'use client'

import { GLBRoomViewer } from '@/components/glb-viewer/glb-room-viewer'

export default function ViewerDemoPage() {
  // You can change this to any uploaded GLB model URL
  // For now, using one of the existing models
  const modelUrl = '/part1.glb'

  return (
    <div className="h-screen w-full">
      <GLBRoomViewer modelUrl={modelUrl} />
    </div>
  )
}
