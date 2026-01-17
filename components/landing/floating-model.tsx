'use client'

import { useRef, useState, useEffect, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Environment } from '@react-three/drei'
import * as THREE from 'three'

function Model({ modelPath }: { modelPath: string }) {
  const modelRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF(modelPath)
  const [modelScale, setModelScale] = useState(0.5)

  useEffect(() => {
    // Calculate bounding box to understand model size
    const box = new THREE.Box3().setFromObject(scene)
    const size = box.getSize(new THREE.Vector3())
    const maxDimension = Math.max(size.x, size.y, size.z)

    // Target size: models should fit within ~10 units
    const targetSize = 10
    const calculatedScale = targetSize / maxDimension

    console.log(`Model: ${modelPath}, Size:`, size, `Scale: ${calculatedScale}`)
    setModelScale(calculatedScale)

    // Ensure materials are properly set and visible
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        if (mesh.material) {
          // Ensure materials are double-sided and preserve colors
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => {
              mat.side = THREE.DoubleSide
              mat.needsUpdate = true
            })
          } else {
            mesh.material.side = THREE.DoubleSide
            mesh.material.needsUpdate = true
          }
        }
      }
    })
  }, [scene, modelPath])

  // Floating animation
  useFrame((state) => {
    if (modelRef.current) {
      const t = state.clock.getElapsedTime()
      modelRef.current.position.y = Math.sin(t * 0.5) * 1.5
      modelRef.current.rotation.y = Math.sin(t * 0.2) * 0.3
    }
  })

  return <primitive ref={modelRef} object={scene.clone()} scale={modelScale} position={[0, 0, 0]} />
}

function Scene({ currentModel }: { currentModel: string }) {
  return (
    <>
      <ambientLight intensity={1.2} />
      <hemisphereLight intensity={0.5} groundColor="#444444" />
      <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={2} castShadow />
      <pointLight position={[-10, 5, -10]} intensity={1} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} />
      <directionalLight position={[-5, 5, -5]} intensity={1} />
      <Model modelPath={currentModel} />
      <Environment preset="sunset" />
    </>
  )
}

export function FloatingModel() {
  const [currentModelIndex, setCurrentModelIndex] = useState(0)
  const models = ['/part1.glb', '/part2.glb', '/part3.glb']

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentModelIndex((prev) => (prev + 1) % models.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Canvas camera={{ position: [0, 20, 25], fov: 50 }}>
      <Suspense fallback={null}>
        <Scene currentModel={models[currentModelIndex]} />
      </Suspense>
    </Canvas>
  )
}
