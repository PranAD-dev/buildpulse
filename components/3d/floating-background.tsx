'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface FloatingShape {
  position: [number, number, number]
  scale: number
  rotation: [number, number, number]
  speed: number
  type: 'box' | 'sphere' | 'octahedron' | 'torus'
}

function FloatingShapes() {
  const groupRef = useRef<THREE.Group>(null)

  const shapes = useMemo<FloatingShape[]>(() => {
    const shapeTypes: Array<'box' | 'sphere' | 'octahedron' | 'torus'> = ['box', 'sphere', 'octahedron', 'torus']
    return Array.from({ length: 15 }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30 - 20,
      ] as [number, number, number],
      scale: Math.random() * 0.8 + 0.3,
      rotation: [
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      ] as [number, number, number],
      speed: Math.random() * 0.5 + 0.2,
      type: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
    }))
  }, [])

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const shape = shapes[i]
        const t = state.clock.getElapsedTime() * shape.speed

        // Floating motion
        child.position.y = shape.position[1] + Math.sin(t) * 2
        child.position.x = shape.position[0] + Math.cos(t * 0.5) * 1

        // Slow rotation
        child.rotation.x += 0.001 * shape.speed
        child.rotation.y += 0.002 * shape.speed
      })
    }
  })

  return (
    <group ref={groupRef}>
      {shapes.map((shape, i) => {
        const color = i % 3 === 0 ? '#1E3A5F' : i % 3 === 1 ? '#F97316' : '#3B82F6'
        const opacity = 0.08

        return (
          <mesh key={i} position={shape.position} scale={shape.scale} rotation={shape.rotation}>
            {shape.type === 'box' && <boxGeometry args={[1, 1, 1]} />}
            {shape.type === 'sphere' && <sphereGeometry args={[0.5, 16, 16]} />}
            {shape.type === 'octahedron' && <octahedronGeometry args={[0.6, 0]} />}
            {shape.type === 'torus' && <torusGeometry args={[0.4, 0.15, 12, 24]} />}
            <meshStandardMaterial color={color} transparent opacity={opacity} wireframe />
          </mesh>
        )
      })}
    </group>
  )
}

export function FloatingBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <Canvas camera={{ position: [0, 0, 20], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={0.3} />
        <FloatingShapes />
      </Canvas>
    </div>
  )
}
