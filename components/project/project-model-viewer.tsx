"use client"

import { Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF, Environment } from "@react-three/drei"
import { Card } from "@/components/ui/card"

interface ProjectModelViewerProps {
  modelUrl: string
  projectName: string
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene} />
}

// Uncomment to log camera position every second (useful for finding perfect view)
// function CameraLogger() {
//   const { camera } = useThree()

//   useEffect(() => {
//     const interval = setInterval(() => {
//       console.log('Camera position:', {
//         x: camera.position.x.toFixed(2),
//         y: camera.position.y.toFixed(2),
//         z: camera.position.z.toFixed(2),
//       })
//     }, 1000)

//     return () => clearInterval(interval)
//   }, [camera])

//   return null
// }

export function ProjectModelViewer({ modelUrl, projectName }: ProjectModelViewerProps) {
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

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">3D Model Preview</h2>
        <p className="text-sm text-muted-foreground mt-1">Rotate and zoom to inspect the model</p>
      </div>
      <div className="relative w-full h-[600px] bg-muted/30">
        <Canvas camera={{ position: [-0.59, 1.3, 19.92], fov: 50 }}>
          <Suspense fallback={null}>
            {/* <CameraLogger /> */}
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} />
            <Model url={modelUrl} />
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              autoRotate={false}
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
