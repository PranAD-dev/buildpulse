"use client"

import { Suspense, useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Environment, useGLTF, Html, ContactShadows } from "@react-three/drei"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, RotateCcw } from "lucide-react"
import type { Group } from "three"

interface ModelViewerProps {
  modelUrl: string
  zoneName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  const groupRef = useRef<Group>(null)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.3
    }
  })

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={2} position={[0, -0.5, 0]} />
    </group>
  )
}

function LoadingFallback() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Loading 3D Model...</span>
      </div>
    </Html>
  )
}

export function ModelViewer({ modelUrl, zoneName, open, onOpenChange }: ModelViewerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden">
        <DialogHeader className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-background/90 to-transparent">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-foreground">{zoneName} - 3D Model</DialogTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="w-full h-full bg-muted/30">
          <Canvas camera={{ position: [3, 2, 5], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
            <Suspense fallback={<LoadingFallback />}>
              <Model url={modelUrl} />
              <ContactShadows position={[0, -0.5, 0]} opacity={0.4} scale={10} blur={2} far={4} />
              <Environment preset="city" />
            </Suspense>
            <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} minDistance={2} maxDistance={10} />
          </Canvas>
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2">
          <div className="bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-muted-foreground flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Drag to rotate | Scroll to zoom | Shift+drag to pan
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
