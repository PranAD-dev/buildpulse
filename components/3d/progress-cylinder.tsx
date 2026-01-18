'use client'

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ProgressCylinderProps {
  progress: number
  size?: number
  color?: string
}

function CylinderMesh({ progress, color }: { progress: number; color: string }) {
  const emptyRef = useRef<THREE.Mesh>(null)
  const fillRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (emptyRef.current && fillRef.current) {
      const t = state.clock.getElapsedTime()
      emptyRef.current.rotation.y = t * 0.3
      fillRef.current.rotation.y = t * 0.3
    }
  })

  const fillHeight = (progress / 100) * 2
  const fillY = -1 + fillHeight / 2

  return (
    <group>
      {/* Empty cylinder */}
      <mesh ref={emptyRef} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 2, 32, 1, true]} />
        <meshStandardMaterial color="#E5E7EB" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>

      {/* Fill cylinder */}
      <mesh ref={fillRef} position={[0, fillY, 0]}>
        <cylinderGeometry args={[0.48, 0.48, fillHeight, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Base */}
      <mesh position={[0, -1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5, 32]} />
        <meshStandardMaterial color="#E5E7EB" />
      </mesh>
    </group>
  )
}

export function ProgressCylinder({ progress, size = 120, color = '#F97316' }: ProgressCylinderProps) {
  return (
    <div style={{ width: size, height: size }}>
      <Canvas camera={{ position: [2, 1.5, 2], fov: 50 }} style={{ background: 'transparent' }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} />
        <CylinderMesh progress={progress} color={color} />
      </Canvas>
    </div>
  )
}
