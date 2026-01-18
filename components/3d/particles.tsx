'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ParticlesProps {
  count?: number
  color?: string
  size?: number
}

function ParticleField({ count = 200, color = '#F97316', size = 0.05 }: ParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null)

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      positions[i3] = (Math.random() - 0.5) * 40
      positions[i3 + 1] = (Math.random() - 0.5) * 30
      positions[i3 + 2] = (Math.random() - 0.5) * 30

      velocities[i3] = (Math.random() - 0.5) * 0.02
      velocities[i3 + 1] = Math.random() * 0.01 + 0.005
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.02
    }

    return { positions, velocities }
  }, [count])

  useFrame(() => {
    if (pointsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array

      for (let i = 0; i < count; i++) {
        const i3 = i * 3

        // Update positions
        positions[i3] += particles.velocities[i3]
        positions[i3 + 1] += particles.velocities[i3 + 1]
        positions[i3 + 2] += particles.velocities[i3 + 2]

        // Wrap around boundaries
        if (positions[i3 + 1] > 15) positions[i3 + 1] = -15
        if (positions[i3] > 20) positions[i3] = -20
        if (positions[i3] < -20) positions[i3] = 20
        if (positions[i3 + 2] > 15) positions[i3 + 2] = -15
        if (positions[i3 + 2] < -15) positions[i3 + 2] = 15
      }

      pointsRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.positions}
          itemSize={3}
          args={[particles.positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial size={size} color={color} transparent opacity={0.6} sizeAttenuation />
    </points>
  )
}

export function Particles({ count = 200, color = '#F97316', size = 0.05 }: ParticlesProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <Canvas camera={{ position: [0, 0, 15], fov: 75 }}>
        <ParticleField count={count} color={color} size={size} />
      </Canvas>
    </div>
  )
}
