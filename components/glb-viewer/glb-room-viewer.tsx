'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { SelectionManager, type SelectionResult } from '@/lib/selection-manager'
import { AssignmentStore, type Assignment } from '@/lib/assignment-store'
import { HighlightManager } from '@/lib/highlight-manager'
import { RoomAssignmentPanel, type Room } from './room-assignment-panel'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, Upload } from 'lucide-react'

interface SceneSetupProps {
  modelUrl: string
  onSceneReady: (scene: THREE.Scene, camera: THREE.Camera) => void
}

function SceneSetup({ modelUrl, onSceneReady }: SceneSetupProps) {
  const { scene, camera } = useThree()
  const { scene: gltfScene } = useGLTF(modelUrl)

  useEffect(() => {
    // Clone and add the loaded GLTF scene
    const clonedScene = gltfScene.clone()
    scene.add(clonedScene)

    // Center the model
    const box = new THREE.Box3().setFromObject(clonedScene)
    const center = box.getCenter(new THREE.Vector3())
    clonedScene.position.sub(center)

    // Notify parent that scene is ready
    onSceneReady(scene, camera)

    return () => {
      scene.remove(clonedScene)
    }
  }, [gltfScene, scene, camera, onSceneReady])

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, -10, -5]} intensity={0.5} />
      <OrbitControls makeDefault />
    </>
  )
}

interface GLBRoomViewerProps {
  modelUrl: string
}

export function GLBRoomViewer({ modelUrl }: GLBRoomViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectionManager, setSelectionManager] = useState<SelectionManager | null>(null)
  const [assignmentStore] = useState(() => new AssignmentStore())
  const [highlightManager] = useState(() => new HighlightManager())

  const [selectionMode, setSelectionMode] = useState<'mesh' | 'material'>('mesh')
  const [currentSelection, setCurrentSelection] = useState<{
    type: 'mesh' | 'material' | null
    meshUuid?: string
    materialName?: string
    assignment?: Assignment
  } | null>(null)

  const [rooms, setRooms] = useState<Room[]>([
    { id: 'kitchen', name: 'Kitchen' },
    { id: 'living-room', name: 'Living Room' },
    { id: 'bedroom', name: 'Bedroom' },
    { id: 'bathroom', name: 'Bathroom' },
  ])

  const [assignments, setAssignments] = useState<Assignment[]>([])

  // Handle scene ready
  const handleSceneReady = useCallback(
    (scene: THREE.Scene, camera: THREE.Camera) => {
      const manager = new SelectionManager(scene, camera)
      manager.setMode(selectionMode)
      setSelectionManager(manager)
    },
    [selectionMode]
  )

  // Update selection mode
  useEffect(() => {
    if (selectionManager) {
      selectionManager.setMode(selectionMode)
      // Clear selection when mode changes
      highlightManager.clearAll()
      setCurrentSelection(null)
    }
  }, [selectionMode, selectionManager, highlightManager])

  // Handle click on canvas
  const handleCanvasClick = useCallback(
    (event: MouseEvent) => {
      if (!selectionManager || !canvasRef.current) return

      const rect = canvasRef.current.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      const result = selectionManager.select(x, y)

      // Clear previous highlights
      highlightManager.clearAll()

      if (!result) {
        setCurrentSelection(null)
        return
      }

      // Highlight based on selection type
      if (result.type === 'mesh') {
        highlightManager.highlightMesh(result.mesh)
        const assignment = assignmentStore.getAssignment(result.mesh.uuid)
        setCurrentSelection({
          type: 'mesh',
          meshUuid: result.mesh.uuid,
          assignment,
        })
      } else if (result.type === 'material') {
        // Find all meshes using this material
        const allMaterials = selectionManager.getAllMaterials()
        const meshesWithMaterial = allMaterials
          .filter(
            (m) =>
              m.materialIndex === result.materialIndex &&
              m.material.uuid === (Array.isArray(result.mesh.material)
                ? result.mesh.material[result.materialIndex!]?.uuid
                : result.mesh.material.uuid)
          )
          .map((m) => m.mesh)

        highlightManager.highlightMeshes(meshesWithMaterial)

        const materialUuid = Array.isArray(result.mesh.material)
          ? result.mesh.material[result.materialIndex!]?.uuid
          : result.mesh.material.uuid

        const assignment = assignmentStore.getAssignment(result.mesh.uuid, result.materialIndex)
        setCurrentSelection({
          type: 'material',
          meshUuid: result.mesh.uuid,
          materialName: result.materialName,
          assignment,
        })
      }
    },
    [selectionManager, highlightManager, assignmentStore]
  )

  // Attach click listener
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.addEventListener('click', handleCanvasClick)
    return () => canvas.removeEventListener('click', handleCanvasClick)
  }, [handleCanvasClick])

  // Assignment handlers
  const handleAssign = useCallback(
    (roomId: string) => {
      if (!currentSelection) return

      const room = rooms.find((r) => r.id === roomId)
      if (!room) return

      if (currentSelection.type === 'mesh' && currentSelection.meshUuid) {
        const meshes = selectionManager?.getAllMeshes() || []
        const mesh = meshes.find((m) => m.uuid === currentSelection.meshUuid)
        if (mesh) {
          const assignment = assignmentStore.assign(mesh, roomId, room.name)
          setCurrentSelection({ ...currentSelection, assignment })
          setAssignments(assignmentStore.getAllAssignments())
        }
      } else if (currentSelection.type === 'material' && currentSelection.meshUuid) {
        const meshes = selectionManager?.getAllMeshes() || []
        const mesh = meshes.find((m) => m.uuid === currentSelection.meshUuid)
        if (mesh) {
          // Get material index from current selection
          const allMaterials = selectionManager?.getAllMaterials() || []
          const materialInfo = allMaterials.find(
            (m) => m.mesh.uuid === currentSelection.meshUuid && m.material.name === currentSelection.materialName
          )
          if (materialInfo) {
            const assignment = assignmentStore.assign(
              mesh,
              roomId,
              room.name,
              materialInfo.index,
              currentSelection.materialName
            )
            setCurrentSelection({ ...currentSelection, assignment })
            setAssignments(assignmentStore.getAllAssignments())
          }
        }
      }
    },
    [currentSelection, rooms, selectionManager, assignmentStore]
  )

  const handleUnassign = useCallback(() => {
    if (!currentSelection) return

    if (currentSelection.type === 'mesh' && currentSelection.meshUuid) {
      assignmentStore.unassign(currentSelection.meshUuid)
      setCurrentSelection({ ...currentSelection, assignment: undefined })
      setAssignments(assignmentStore.getAllAssignments())
    } else if (currentSelection.type === 'material' && currentSelection.meshUuid) {
      const allMaterials = selectionManager?.getAllMaterials() || []
      const materialInfo = allMaterials.find(
        (m) => m.mesh.uuid === currentSelection.meshUuid && m.material.name === currentSelection.materialName
      )
      if (materialInfo) {
        assignmentStore.unassign(currentSelection.meshUuid, materialInfo.index)
        setCurrentSelection({ ...currentSelection, assignment: undefined })
        setAssignments(assignmentStore.getAllAssignments())
      }
    }
  }, [currentSelection, selectionManager, assignmentStore])

  const handleAddRoom = useCallback((name: string) => {
    const newRoom: Room = {
      id: `room-${Date.now()}`,
      name,
    }
    setRooms((prev) => [...prev, newRoom])
  }, [])

  const handleRemoveRoom = useCallback(
    (roomId: string) => {
      // Remove all assignments for this room
      const roomAssignments = assignmentStore.getAssignmentsByRoom(roomId)
      roomAssignments.forEach((assignment) => {
        assignmentStore.unassign(assignment.meshUuid, assignment.materialIndex)
      })
      setAssignments(assignmentStore.getAllAssignments())

      // Remove room
      setRooms((prev) => prev.filter((r) => r.id !== roomId))
    },
    [assignmentStore]
  )

  const handleRoomClick = useCallback(
    (roomId: string) => {
      // Highlight all assignments for this room
      highlightManager.clearAll()
      const roomAssignments = assignmentStore.getAssignmentsByRoom(roomId)

      const meshes = selectionManager?.getAllMeshes() || []
      roomAssignments.forEach((assignment) => {
        const mesh = meshes.find((m) => m.uuid === assignment.meshUuid)
        if (mesh) {
          highlightManager.highlightMesh(mesh)
        }
      })
    },
    [selectionManager, assignmentStore, highlightManager]
  )

  const handleExport = useCallback(() => {
    const data = {
      rooms,
      assignments: assignmentStore.getAllAssignments(),
    }
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'room-assignments.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [rooms, assignmentStore])

  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (data.rooms) setRooms(data.rooms)
        if (data.assignments) {
          assignmentStore.import(JSON.stringify(data.assignments))
          setAssignments(assignmentStore.getAllAssignments())
        }
      } catch (error) {
        console.error('Failed to import:', error)
      }
    }
    reader.readAsText(file)
  }, [assignmentStore])

  return (
    <div className="flex h-screen w-full">
      {/* Main Viewer */}
      <div className="flex-1 relative">
        {/* Controls */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <div className="bg-card border border-border rounded-lg p-2 flex gap-2">
            <Button
              size="sm"
              variant={selectionMode === 'mesh' ? 'default' : 'outline'}
              onClick={() => setSelectionMode('mesh')}
              className={selectionMode === 'mesh' ? 'bg-accent text-accent-foreground' : ''}
            >
              Mesh Mode
            </Button>
            <Button
              size="sm"
              variant={selectionMode === 'material' ? 'default' : 'outline'}
              onClick={() => setSelectionMode('material')}
              className={selectionMode === 'material' ? 'bg-accent text-accent-foreground' : ''}
            >
              Material Mode
            </Button>
          </div>
        </div>

        {/* Export/Import */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button size="sm" variant="outline" onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => document.getElementById('import-file')?.click()}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <input
            id="import-file"
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </div>

        {/* Mode Badge */}
        <div className="absolute bottom-4 left-4 z-10">
          <Badge variant="outline" className="bg-card">
            {selectionMode === 'mesh' ? 'Mesh Selection Mode' : 'Material Selection Mode'}
          </Badge>
        </div>

        {/* Canvas */}
        <Canvas ref={canvasRef} camera={{ position: [5, 5, 5], fov: 50 }}>
          <SceneSetup modelUrl={modelUrl} onSceneReady={handleSceneReady} />
        </Canvas>
      </div>

      {/* Side Panel */}
      <RoomAssignmentPanel
        rooms={rooms}
        currentSelection={currentSelection}
        assignments={assignments}
        onAssign={handleAssign}
        onUnassign={handleUnassign}
        onAddRoom={handleAddRoom}
        onRemoveRoom={handleRemoveRoom}
        onRoomClick={handleRoomClick}
      />
    </div>
  )
}
