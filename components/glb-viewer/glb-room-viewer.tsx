'use client'

import { useRef, useState, useEffect, useCallback, Suspense } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { SelectionManager, type SelectionResult } from '@/lib/selection-manager'
import { AssignmentStore } from '@/lib/assignment-store'
import { HighlightManager } from '@/lib/highlight-manager'
import { RoomStore, type Room, type RoomSuggestion } from '@/lib/room-store'
import { CameraController, easings } from '@/lib/camera-controller'
import { RoomPanel } from './room-panel'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, Upload, RotateCcw, Grid3x3, Layers, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

// Database room type (from API)
interface DBRoom {
  id: string
  project_id: string
  name: string
  reference_image_url: string | null
  model_camera_position: { x: number; y: number; z: number } | null
  current_percent: number
  created_at: string
  mesh_assignments?: string[] // Store mesh UUIDs assigned to this room
}

// Loading component
function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#666" wireframe />
    </mesh>
  )
}

// Model component that loads and displays the GLB
function Model({ url, onLoad }: { url: string; onLoad?: (scene: THREE.Group) => void }) {
  const { scene } = useGLTF(url)
  const { camera } = useThree()
  const clonedScene = useRef<THREE.Group | null>(null)
  const fitted = useRef(false)

  useEffect(() => {
    if (scene && !clonedScene.current) {
      clonedScene.current = scene.clone()
      // Center the model
      const box = new THREE.Box3().setFromObject(clonedScene.current)
      const center = box.getCenter(new THREE.Vector3())
      clonedScene.current.position.sub(center)

      onLoad?.(clonedScene.current)
    }
  }, [scene, onLoad])

  // Auto-fit camera for non-part models
  useEffect(() => {
    const isPart3Model = url.includes('part') || url.includes('Part')

    if (clonedScene.current && !fitted.current && !isPart3Model) {
      fitted.current = true
      const box = new THREE.Box3().setFromObject(clonedScene.current)
      const size = box.getSize(new THREE.Vector3())

      // Get the max dimension to determine camera distance
      const maxDim = Math.max(size.x, size.y, size.z)
      const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180)
      let cameraDistance = maxDim / (2 * Math.tan(fov / 2))

      // Add padding to see the whole model
      cameraDistance *= 2.0

      // Position camera at an angle to see the model well
      camera.position.set(
        cameraDistance * 0.7,
        cameraDistance * 0.5,
        cameraDistance * 0.7
      )
      camera.lookAt(0, 0, 0)
      camera.updateProjectionMatrix()

      console.log('GLB Viewer - Model bounds:', { size, cameraDistance })
    }
  }, [scene, camera, url])

  if (!clonedScene.current) {
    clonedScene.current = scene.clone()
    const box = new THREE.Box3().setFromObject(clonedScene.current)
    const center = box.getCenter(new THREE.Vector3())
    clonedScene.current.position.sub(center)
  }

  return <primitive object={clonedScene.current} />
}

// Scene setup component
interface SceneSetupProps {
  onReady: (
    scene: THREE.Scene,
    camera: THREE.Camera,
    controls: any,
    gl: THREE.WebGLRenderer
  ) => void
}

function SceneSetup({ onReady }: SceneSetupProps) {
  const { scene, camera, gl } = useThree()
  const controlsRef = useRef<any>(null)

  useEffect(() => {
    if (controlsRef.current) {
      onReady(scene, camera, controlsRef.current, gl)
    }
  }, [scene, camera, gl, onReady])

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={0.5}
        maxDistance={500}
      />
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />
      <directionalLight position={[-10, 10, -10]} intensity={0.4} />
      <Environment preset="city" />
      <ContactShadows
        position={[0, -0.5, 0]}
        opacity={0.4}
        scale={20}
        blur={2}
        far={4}
      />
    </>
  )
}

// Camera animation component - kept for potential future use with useFrame animations
function CameraAnimator() {
  useFrame(() => {
    // Camera animations are handled internally by CameraController
  })
  return null
}

// Main GLBRoomViewer component
interface GLBRoomViewerProps {
  modelUrl: string
  projectId?: string
  projectName?: string
  onExport?: (data: { rooms: Room[]; assignments: any[] }) => void
}

export function GLBRoomViewer({ modelUrl, projectId, projectName, onExport }: GLBRoomViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Core managers
  const [selectionManager, setSelectionManager] = useState<SelectionManager | null>(null)
  const [assignmentStore] = useState(() => new AssignmentStore())
  const [highlightManager] = useState(() => new HighlightManager())
  const [roomStore] = useState(() => new RoomStore())
  const [cameraController, setCameraController] = useState<CameraController | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // State
  const [selectionMode, setSelectionMode] = useState<'mesh' | 'material'>('mesh')
  const [currentSelection, setCurrentSelection] = useState<SelectionResult | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [suggestion, setSuggestion] = useState<RoomSuggestion | null>(null)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [isSelectionAssigned, setIsSelectionAssigned] = useState(false)
  const [assignedRoomName, setAssignedRoomName] = useState<string | undefined>()
  const [, setModelLoaded] = useState(false)

  // Map to track DB room IDs to local room IDs
  const dbRoomIdMapRef = useRef<Map<string, string>>(new Map())

  // Load existing zones from database on mount
  useEffect(() => {
    if (!projectId) return

    const loadZones = async () => {
      try {
        const response = await fetch(`/api/rooms?project_id=${projectId}`)
        if (!response.ok) throw new Error('Failed to load zones')

        const dbRooms: DBRoom[] = await response.json()

        // Create rooms in local store from DB data
        dbRooms.forEach((dbRoom) => {
          const room = roomStore.createRoom(dbRoom.name, dbRoom.current_percent)
          // Map DB ID to local ID for later updates
          dbRoomIdMapRef.current.set(room.id, dbRoom.id)

          // Restore camera position if available
          if (dbRoom.model_camera_position) {
            const pos = dbRoom.model_camera_position
            roomStore.setCameraTarget(room.id, new THREE.Vector3(pos.x, pos.y, pos.z))
          }

          // Restore mesh assignments if available
          if (dbRoom.mesh_assignments) {
            dbRoom.mesh_assignments.forEach((assignment) => {
              roomStore.addAssignment(room.id, assignment)
            })
          }
        })

        setRooms(roomStore.getAllRooms())
      } catch (error) {
        console.error('Error loading zones:', error)
      }
    }

    loadZones()
  }, [projectId, roomStore])

  // Subscribe to room store changes
  useEffect(() => {
    const unsubscribe = roomStore.subscribe(() => {
      setRooms(roomStore.getAllRooms())
    })
    return unsubscribe
  }, [roomStore])

  // Save zone to database
  const saveZoneToDB = useCallback(async (room: Room): Promise<string | null> => {
    if (!projectId) return null

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          name: room.name,
          model_camera_position: room.cameraTarget,
          current_percent: room.progress,
        }),
      })

      if (!response.ok) throw new Error('Failed to save zone')

      const savedRoom = await response.json()
      return savedRoom.id
    } catch (error) {
      console.error('Error saving zone:', error)
      return null
    }
  }, [projectId])

  // Update zone in database
  const updateZoneInDB = useCallback(async (localRoomId: string, updates: { name?: string; current_percent?: number; model_camera_position?: any }) => {
    const dbRoomId = dbRoomIdMapRef.current.get(localRoomId)
    if (!dbRoomId) return

    try {
      await fetch(`/api/rooms/${dbRoomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
    } catch (error) {
      console.error('Error updating zone:', error)
    }
  }, [])

  // Delete zone from database
  const deleteZoneFromDB = useCallback(async (localRoomId: string) => {
    const dbRoomId = dbRoomIdMapRef.current.get(localRoomId)
    if (!dbRoomId) return

    try {
      await fetch(`/api/rooms/${dbRoomId}`, {
        method: 'DELETE',
      })
      dbRoomIdMapRef.current.delete(localRoomId)
    } catch (error) {
      console.error('Error deleting zone:', error)
    }
  }, [])

  // Sync mesh assignments to database
  const syncAssignmentsTooDB = useCallback(async (localRoomId: string, assignments: string[]) => {
    const dbRoomId = dbRoomIdMapRef.current.get(localRoomId)
    if (!dbRoomId) return

    try {
      await fetch(`/api/rooms/${dbRoomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mesh_assignments: assignments }),
      })
    } catch (error) {
      console.error('Error syncing assignments:', error)
    }
  }, [])

  // Handle scene ready
  const handleSceneReady = useCallback(
    (scene: THREE.Scene, camera: THREE.Camera, controls: any, gl: THREE.WebGLRenderer) => {
      const manager = new SelectionManager(scene, camera)
      manager.setMode(selectionMode)
      setSelectionManager(manager)

      const camController = new CameraController(camera, controls)
      setCameraController(camController)

      // Store renderer for canvas capture
      rendererRef.current = gl
    },
    [selectionMode]
  )

  // Handle model loaded
  const handleModelLoad = useCallback(
    (_modelScene: THREE.Group) => {
      setModelLoaded(true)
      // Invalidate selection cache when model loads
      if (selectionManager) {
        selectionManager.invalidateCache()
      }
    },
    [selectionManager]
  )

  // Update selection mode
  useEffect(() => {
    if (selectionManager) {
      selectionManager.setMode(selectionMode)
      highlightManager.clearAll()
      setCurrentSelection(null)
      setSuggestion(null)
    }
  }, [selectionMode, selectionManager, highlightManager])

  // Generate selection key using stable identifiers (mesh name instead of UUID)
  // UUIDs change on every page reload, but mesh names from GLB files are stable
  const getSelectionKey = useCallback((selection: SelectionResult): string => {
    // Use mesh name if available, otherwise fall back to UUID (less reliable on reload)
    const meshId = selection.mesh.name || selection.mesh.uuid
    if (selection.type === 'material' && selection.materialIndex !== undefined) {
      return `${meshId}:${selection.materialIndex}`
    }
    return meshId
  }, [])

  // Fetch AI suggestion from API
  const fetchAISuggestion = useCallback(
    async (selection: SelectionResult, objectDensity: number) => {
      try {
        const response = await fetch('/api/suggest-room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isHorizontal: selection.isHorizontal,
            surfaceArea: selection.surfaceArea,
            normalY: selection.normal?.y || 0,
            normalX: selection.normal?.x || 0,
            normalZ: selection.normal?.z || 0,
            objectDensity,
            meshName: selection.mesh.name || undefined,
            materialName: selection.materialName || undefined,
            selectionType: selection.type,
            // Add geometry data for better AI predictions
            geometry: selection.geometry,
          }),
        })

        if (!response.ok) throw new Error('Failed to get suggestion')

        const data = await response.json()
        setSuggestion({
          suggestedName: data.suggestedName,
          confidence: data.confidence,
          reason: data.reason,
          alternativeNames: data.alternativeNames,
          isLoading: false,
        })
      } catch (error) {
        console.error('AI suggestion error:', error)
        // Fallback to basic heuristic
        const fallbackSuggestion = roomStore.suggestComponentName(selection, objectDensity)
        setSuggestion({ ...fallbackSuggestion, isLoading: false })
      }
    },
    [roomStore]
  )

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
        setSuggestion(null)
        setIsSelectionAssigned(false)
        setAssignedRoomName(undefined)
        return
      }

      setCurrentSelection(result)

      // Get selection key and check if already assigned
      const selectionKey = getSelectionKey(result)
      const existingRoom = roomStore.getRoomByAssignment(selectionKey)

      if (existingRoom) {
        setIsSelectionAssigned(true)
        setAssignedRoomName(existingRoom.name)
        highlightManager.highlightMesh(result.mesh, existingRoom.id)
      } else {
        setIsSelectionAssigned(false)
        setAssignedRoomName(undefined)
        highlightManager.highlightMesh(result.mesh)

        // Show loading state while fetching AI suggestion
        setSuggestion({ suggestedName: '', confidence: 'low', reason: '', isLoading: true })

        // Fetch AI suggestion asynchronously
        const objectDensity = selectionManager.getObjectDensity(result.hitPoint, 3)
        fetchAISuggestion(result, objectDensity)
      }

      // Highlight based on selection type
      if (result.type === 'material') {
        const meshesWithMaterial = selectionManager.getMeshesWithMaterialName(
          result.materialName || ''
        )
        highlightManager.highlightMeshes(
          meshesWithMaterial,
          existingRoom?.id
        )
      }
    },
    [selectionManager, highlightManager, roomStore, getSelectionKey]
  )

  // Attach click listener
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.addEventListener('click', handleCanvasClick)
    return () => canvas.removeEventListener('click', handleCanvasClick)
  }, [handleCanvasClick])

  // Create room handler
  const handleCreateRoom = useCallback(
    async (name: string) => {
      const room = roomStore.createRoom(name)

      // If there's a current selection, assign it to this room
      if (currentSelection) {
        const selectionKey = getSelectionKey(currentSelection)
        roomStore.addAssignment(room.id, selectionKey)
        assignmentStore.assign(
          currentSelection.mesh,
          room.id,
          room.name,
          currentSelection.materialIndex,
          currentSelection.materialName
        )

        // Update camera target
        const centroid = selectionManager?.getMeshCentroid(currentSelection.mesh)
        if (centroid) {
          roomStore.setCameraTarget(room.id, centroid)
        }

        setIsSelectionAssigned(true)
        setAssignedRoomName(room.name)
        setSuggestion(null)

        // Update highlight
        highlightManager.clearAll()
        highlightManager.highlightMesh(currentSelection.mesh, room.id)
      }

      setRooms(roomStore.getAllRooms())

      // Save to database
      const dbRoomId = await saveZoneToDB(room)
      if (dbRoomId) {
        dbRoomIdMapRef.current.set(room.id, dbRoomId)
      }
    },
    [currentSelection, roomStore, assignmentStore, selectionManager, highlightManager, getSelectionKey, saveZoneToDB]
  )

  // Assign selection to existing room
  const handleAssignSelection = useCallback(
    (roomId: string) => {
      if (!currentSelection) return

      const room = roomStore.getRoom(roomId)
      if (!room) return

      const selectionKey = getSelectionKey(currentSelection)
      roomStore.addAssignment(roomId, selectionKey)
      assignmentStore.assign(
        currentSelection.mesh,
        roomId,
        room.name,
        currentSelection.materialIndex,
        currentSelection.materialName
      )

      // Update camera target if not set
      if (!room.cameraTarget) {
        const centroid = selectionManager?.getMeshCentroid(currentSelection.mesh)
        if (centroid) {
          roomStore.setCameraTarget(roomId, centroid)
        }
      }

      setIsSelectionAssigned(true)
      setAssignedRoomName(room.name)
      setSuggestion(null)

      // Update highlight
      highlightManager.clearAll()
      highlightManager.highlightMesh(currentSelection.mesh, roomId)

      // Sync assignments to database
      const updatedRoom = roomStore.getRoom(roomId)
      if (updatedRoom) {
        syncAssignmentsTooDB(roomId, updatedRoom.assignments)
      }
    },
    [currentSelection, roomStore, assignmentStore, selectionManager, highlightManager, getSelectionKey, syncAssignmentsTooDB]
  )

  // Unassign selection
  const handleUnassignSelection = useCallback(() => {
    if (!currentSelection) return

    const selectionKey = getSelectionKey(currentSelection)
    const room = roomStore.getRoomByAssignment(selectionKey)

    if (room) {
      const roomId = room.id
      roomStore.removeAssignment(roomId, selectionKey)
      assignmentStore.unassign(currentSelection.mesh.uuid, currentSelection.materialIndex)

      // Sync assignments to database
      const updatedRoom = roomStore.getRoom(roomId)
      if (updatedRoom) {
        syncAssignmentsTooDB(roomId, updatedRoom.assignments)
      }
    }

    setIsSelectionAssigned(false)
    setAssignedRoomName(undefined)

    // Re-generate suggestion
    if (selectionManager) {
      const objectDensity = selectionManager.getObjectDensity(currentSelection.hitPoint, 3)
      const newSuggestion = roomStore.suggestComponentName(currentSelection, objectDensity)
      setSuggestion(newSuggestion)
    }

    // Update highlight to default
    highlightManager.clearAll()
    highlightManager.highlightMesh(currentSelection.mesh)
  }, [currentSelection, roomStore, assignmentStore, selectionManager, highlightManager, getSelectionKey, syncAssignmentsTooDB])

  // Delete room
  const handleDeleteRoom = useCallback(
    async (roomId: string) => {
      const room = roomStore.getRoom(roomId)
      if (!room) return

      // Unassign all assignments for this room
      const meshes = selectionManager?.getAllMeshes() || []
      room.assignments.forEach((key) => {
        const parts = key.split(':')
        const meshId = parts[0]
        const materialIndex = parts[1] ? parseInt(parts[1]) : undefined
        // Find mesh by name or UUID and unassign using its UUID
        const mesh = meshes.find((m) => m.name === meshId || m.uuid === meshId)
        if (mesh) {
          assignmentStore.unassign(mesh.uuid, materialIndex)
        }
      })

      roomStore.deleteRoom(roomId)
      highlightManager.clearAll()

      if (selectedRoomId === roomId) {
        setSelectedRoomId(null)
      }

      // Delete from database
      await deleteZoneFromDB(roomId)
    },
    [roomStore, assignmentStore, highlightManager, selectedRoomId, deleteZoneFromDB, selectionManager]
  )

  // Room click - navigate camera and highlight
  const handleRoomClick = useCallback(
    (roomId: string) => {
      setSelectedRoomId(roomId)

      const room = roomStore.getRoom(roomId)
      if (!room) return

      // Highlight all meshes assigned to this room
      highlightManager.clearAll()
      const meshes = selectionManager?.getAllMeshes() || []

      room.assignments.forEach((key) => {
        const parts = key.split(':')
        const meshId = parts[0]
        // Find mesh by name first (stable), then fall back to UUID
        const mesh = meshes.find((m) => m.name === meshId || m.uuid === meshId)
        if (mesh) {
          highlightManager.highlightMesh(mesh, roomId)
        }
      })

      // Animate camera to room
      if (room.cameraTarget && cameraController) {
        const target = new THREE.Vector3(
          room.cameraTarget.x,
          room.cameraTarget.y,
          room.cameraTarget.z
        )
        cameraController.flyTo(target, {
          duration: 1200,
          easing: easings.easeInOut,
        })
      }
    },
    [roomStore, selectionManager, highlightManager, cameraController]
  )

  // Update room progress
  const handleUpdateProgress = useCallback(
    async (roomId: string, progress: number) => {
      roomStore.updateProgress(roomId, progress)

      // Update zone in database
      const dbRoomId = dbRoomIdMapRef.current.get(roomId)
      if (dbRoomId) {
        try {
          await fetch(`/api/rooms/${dbRoomId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ current_percent: progress }),
          })
        } catch (err) {
          console.error('Failed to save zone progress:', err)
        }
      }

      // Recalculate and update overall project progress
      const allRooms = roomStore.getAllRooms()
      const totalProgress = allRooms.reduce((sum, r) => {
        return sum + (r.id === roomId ? progress : r.progress)
      }, 0)
      const overallProgress = allRooms.length > 0 ? Math.round(totalProgress / allRooms.length) : 0

      if (projectId) {
        try {
          await fetch(`/api/projects/${projectId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ overall_progress: overallProgress }),
          })
          console.log('Updated overall progress:', overallProgress, '%')
        } catch (err) {
          console.error('Failed to update overall progress:', err)
        }
      }
    },
    [roomStore, projectId]
  )

  // Upload photo (just store, no analysis yet)
  const handleUploadPhoto = useCallback(
    (roomId: string, file: File) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        roomStore.addPhoto(roomId, dataUrl)
      }
      reader.readAsDataURL(file)
    },
    [roomStore]
  )

  // Analyze photos with AI
  const handleAnalyzeRoom = useCallback(
    async (roomId: string) => {
      const room = roomStore.getRoom(roomId)
      if (!room || room.photos.length === 0) {
        console.error('No photos to analyze')
        return
      }

      setIsAnalyzing(true)

      try {
        // Use the most recent photo for analysis
        const latestPhoto = room.photos[room.photos.length - 1]

        console.log('Analyzing', room.name, 'with photo')

        // Call Gemini API to analyze - just send photo and zone name
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            progressPhoto: latestPhoto.url,
            roomName: room.name,
          }),
        })

        if (response.ok) {
          const analysis = await response.json()
          const newProgress = Math.min(100, Math.max(0, analysis.percent_complete))

          // Update zone progress in local store
          roomStore.updateProgress(roomId, newProgress)

          // Store full analysis results (visible_completed, still_missing, etc.)
          roomStore.setAnalysisResult(roomId, {
            confidence: analysis.confidence,
            visible_completed: analysis.visible_completed || [],
            still_missing: analysis.still_missing || [],
            notes: analysis.notes || '',
          })

          // Save to database
          const dbRoomId = dbRoomIdMapRef.current.get(roomId)
          console.log('Saving progress - Local ID:', roomId, '| DB ID:', dbRoomId, '| Progress:', newProgress)

          if (dbRoomId) {
            try {
              const updateResponse = await fetch(`/api/rooms/${dbRoomId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ current_percent: newProgress }),
              })
              if (!updateResponse.ok) {
                console.error('Failed to save zone progress:', await updateResponse.text())
              }
            } catch (err) {
              console.error('Error saving zone progress:', err)
            }
          }

          // Calculate overall project progress (use updated value)
          const allRooms = roomStore.getAllRooms()
          // Make sure we use the new progress for the current room
          const totalProgress = allRooms.reduce((sum, r) => {
            return sum + (r.id === roomId ? newProgress : r.progress)
          }, 0)
          const overallProgress = allRooms.length > 0 ? Math.round(totalProgress / allRooms.length) : 0

          // Update project's overall progress in DB
          if (projectId) {
            try {
              const projectResponse = await fetch(`/api/projects/${projectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ overall_progress: overallProgress }),
              })
              if (!projectResponse.ok) {
                console.error('Failed to update overall progress:', await projectResponse.text())
              }
            } catch (err) {
              console.error('Failed to update overall progress:', err)
            }
          }

          console.log('AI Analysis:', analysis)
          console.log('Zone progress:', newProgress, '% | Overall:', overallProgress, '%')
        } else {
          const errorText = await response.text()
          console.error('Analysis failed:', errorText)
        }
      } catch (error) {
        console.error('Analysis error:', error)
      } finally {
        setIsAnalyzing(false)
      }
    },
    [roomStore, updateZoneInDB, projectId]
  )

  // Remove photo
  const handleRemovePhoto = useCallback(
    (roomId: string, photoId: string) => {
      roomStore.removePhoto(roomId, photoId)
    },
    [roomStore]
  )

  // Export data
  const handleExport = useCallback(() => {
    const data = {
      rooms: roomStore.getAllRooms(),
      assignments: assignmentStore.getAllAssignments(),
    }
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'room-progress-data.json'
    a.click()
    URL.revokeObjectURL(url)
    onExport?.(data)
  }, [roomStore, assignmentStore, onExport])

  // Import data
  const handleImport = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          if (data.rooms) {
            roomStore.import(JSON.stringify(data.rooms))
          }
          if (data.assignments) {
            assignmentStore.import(JSON.stringify(data.assignments))
          }
          setRooms(roomStore.getAllRooms())
        } catch (error) {
          console.error('Failed to import:', error)
        }
      }
      reader.readAsText(file)
    },
    [roomStore, assignmentStore]
  )

  // Reset camera
  const handleResetCamera = useCallback(() => {
    if (cameraController) {
      cameraController.reset({ duration: 800 })
    }
    highlightManager.clearAll()
    setCurrentSelection(null)
    setSuggestion(null)
    setSelectedRoomId(null)
  }, [cameraController, highlightManager])

  return (
    <div className="flex flex-col h-screen w-full bg-background">
      {/* Header with back button and project name */}
      {projectId && (
        <div className="h-14 border-b border-border bg-card/95 backdrop-blur-sm flex items-center px-4 gap-4 z-20">
          <Link href={`/project/${projectId}`}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Project
            </Button>
          </Link>
          {projectName && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">/</span>
              <span className="font-medium text-foreground">{projectName}</span>
              <Badge variant="outline">Component Progress Demo</Badge>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Main Viewer */}
        <div className="flex-1 relative">
          {/* Top Controls */}
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-1.5 flex gap-1 shadow-lg">
            <Button
              size="sm"
              variant={selectionMode === 'mesh' ? 'default' : 'ghost'}
              onClick={() => setSelectionMode('mesh')}
              className={`gap-2 ${
                selectionMode === 'mesh' ? 'bg-accent text-accent-foreground' : ''
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
              Mesh
            </Button>
            <Button
              size="sm"
              variant={selectionMode === 'material' ? 'default' : 'ghost'}
              onClick={() => setSelectionMode('material')}
              className={`gap-2 ${
                selectionMode === 'material' ? 'bg-accent text-accent-foreground' : ''
              }`}
            >
              <Layers className="w-4 h-4" />
              Material
            </Button>
          </div>
        </div>

        {/* Top Right Controls */}
        <div className="absolute top-4 right-[25rem] z-10 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetCamera}
            className="gap-2 bg-card/95 backdrop-blur-sm shadow-lg"
          >
            <RotateCcw className="w-4 h-4" />
            Reset View
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            className="gap-2 bg-card/95 backdrop-blur-sm shadow-lg"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => document.getElementById('import-file')?.click()}
            className="gap-2 bg-card/95 backdrop-blur-sm shadow-lg"
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
          <Badge variant="outline" className="bg-card/95 backdrop-blur-sm shadow-lg">
            {selectionMode === 'mesh' ? 'Mesh Selection' : 'Material Selection'} Mode
          </Badge>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-4 right-[25rem] z-10 bg-card/95 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-muted-foreground shadow-lg border border-border">
          <p>Click to select • Drag to rotate • Scroll to zoom • Right-click to pan</p>
        </div>

        {/* Canvas */}
        <Canvas
          ref={canvasRef}
          camera={{ position: [10, 10, 10], fov: 50 }}
          shadows
          className="w-full h-full"
          gl={{ preserveDrawingBuffer: true }}
        >
          <SceneSetup onReady={handleSceneReady} />
          <Suspense fallback={<LoadingFallback />}>
            <Model url={modelUrl} onLoad={handleModelLoad} />
          </Suspense>
          <CameraAnimator />
        </Canvas>
      </div>

        {/* Side Panel */}
        <RoomPanel
          rooms={rooms}
          currentSelection={
            currentSelection
              ? {
                  type: currentSelection.type,
                  meshUuid: currentSelection.mesh.uuid,
                  materialName: currentSelection.materialName,
                  isHorizontal: currentSelection.isHorizontal,
                  surfaceArea: currentSelection.surfaceArea,
                }
              : null
          }
          suggestion={suggestion}
          selectedRoomId={selectedRoomId}
          onCreateRoom={handleCreateRoom}
          onDeleteRoom={handleDeleteRoom}
          onRoomClick={handleRoomClick}
          onAssignSelection={handleAssignSelection}
          onUnassignSelection={handleUnassignSelection}
          onUpdateProgress={handleUpdateProgress}
          onUploadPhoto={handleUploadPhoto}
          onRemovePhoto={handleRemovePhoto}
          onAnalyzeRoom={handleAnalyzeRoom}
          isSelectionAssigned={isSelectionAssigned}
          assignedRoomName={assignedRoomName}
          isAnalyzing={isAnalyzing}
        />
      </div>
    </div>
  )
}
