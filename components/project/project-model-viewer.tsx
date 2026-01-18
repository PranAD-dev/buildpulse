"use client"

import { Suspense, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Canvas, useThree } from "@react-three/fiber"
import { OrbitControls, useGLTF, Environment } from "@react-three/drei"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Compass } from "lucide-react"
import * as THREE from "three"

interface ProjectModelViewerProps {
  modelUrl: string
  projectName: string
  projectId: string
}

// Model component that auto-fits camera for non-part3 models
function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  const { camera } = useThree()
  const fitted = useRef(false)

  useEffect(() => {
    // Only auto-fit camera for models that are NOT part3.glb (or similar part models)
    const isPart3Model = url.includes('part') || url.includes('Part')

    if (scene && !fitted.current && !isPart3Model) {
      fitted.current = true
      // Calculate bounding box
      const box = new THREE.Box3().setFromObject(scene)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())

      // Get the max dimension to determine camera distance
      const maxDim = Math.max(size.x, size.y, size.z)
      const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180)
      let cameraDistance = maxDim / (2 * Math.tan(fov / 2))

      // Add padding to see the whole model
      cameraDistance *= 2.0

      // Position camera at an angle to see the model well
      camera.position.set(
        center.x + cameraDistance * 0.7,
        center.y + cameraDistance * 0.5,
        center.z + cameraDistance * 0.7
      )
      camera.lookAt(center)
      camera.updateProjectionMatrix()

      console.log('Model bounds:', { size, center, cameraDistance })
    }
  }, [scene, camera, url])

  return <primitive object={scene} />
}

// Log camera position every second (useful for finding perfect view)
function CameraLogger() {
  const { camera } = useThree()

  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Camera position:', {
        x: camera.position.x.toFixed(2),
        y: camera.position.y.toFixed(2),
        z: camera.position.z.toFixed(2),
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [camera])

  return null
}

export function ProjectModelViewer({ modelUrl, projectName, projectId }: ProjectModelViewerProps) {
  const router = useRouter()

  // Don't render if model URL is invalid (gridfs:// URLs from old system)
  if (!modelUrl || modelUrl.startsWith('gridfs://')) {
    return (
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">3D Model Preview</h2>
          <p className="text-sm text-muted-foreground mt-1">Model not available</p>
        </div>
        <div className="relative w-full h-[200px] bg-muted/30 flex items-center justify-center">
          <p className="text-muted-foreground">This project uses an old storage format. Please re-upload the 3D model.</p>
        </div>
      </Card>
    )
  }

  const handleOpenRoomDemo = () => {
    // Navigate to viewer-demo with the model URL and project info
    const params = new URLSearchParams({
      model: modelUrl,
      projectId: projectId,
      projectName: projectName,
    })
    router.push(`/viewer-demo?${params.toString()}`)
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">3D Model Preview</h2>
          <p className="text-sm text-muted-foreground mt-1">Rotate and zoom to inspect the model</p>
        </div>
        <Button onClick={handleOpenRoomDemo} className="gap-2">
          <Compass className="w-4 h-4" />
          Room Progress Demo
        </Button>
      </div>
      <div className="relative w-full h-[600px] bg-muted/30">
        <Canvas camera={{ position: [-0.59, 1.3, 19.92], fov: 50 }}>
          <Suspense fallback={null}>
            <CameraLogger />
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} />
            <Model url={modelUrl} />
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              autoRotate={false}
              minDistance={0.5}
              maxDistance={500}
            />
            <Environment preset="city" />
          </Suspense>
        </Canvas>
        <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-muted-foreground">
          <p>Click and drag to rotate • Scroll to zoom • Right-click to pan</p>
        </div>
      </div>
    </Card>
  )
}
