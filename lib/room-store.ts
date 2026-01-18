import * as THREE from 'three'
import type { SelectionResult } from './selection-manager'

export interface RoomPhoto {
  id: string
  url: string // base64 or URL
  uploadedAt: number
  notes?: string
}

export interface Room {
  id: string
  name: string
  progress: number
  cameraTarget: { x: number; y: number; z: number } | null
  assignments: string[] // selection keys (meshUuid or meshUuid:materialIndex)
  photos: RoomPhoto[]
  referenceImageUrl: string | null // Target image showing completed state
  createdAt: number
  updatedAt: number
  // AI analysis results
  lastAnalysis?: {
    confidence: 'high' | 'medium' | 'low'
    visible_completed: string[]
    still_missing: string[]
    notes: string
    analyzedAt: number
  }
}

export interface RoomSuggestion {
  suggestedName: string
  confidence: 'high' | 'medium' | 'low'
  reason: string
  alternativeNames?: string[]
  isLoading?: boolean
}

// Default building component types for the dropdown
export const DEFAULT_COMPONENT_TYPES = [
  'Roof',
  'Main Floor Slab',
  'Foundation',
  'Front Wall',
  'Back Wall',
  'Side Wall',
  'Interior Wall',
  'Garage Door',
  'Entry Door',
  'Pillars',
  'Columns',
  'Staircase',
  'Deck',
  'Porch',
  'Driveway',
  'Upper Floor',
  'Ceiling',
  'Window Frame',
] as const

export class RoomStore {
  private rooms: Map<string, Room> = new Map()
  private listeners: Set<() => void> = new Set()

  /**
   * Generate a room ID from name
   */
  private generateId(name: string): string {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const existing = Array.from(this.rooms.keys()).filter((id) => id.startsWith(base))
    if (existing.length === 0) return base
    return `${base}-${existing.length + 1}`
  }

  /**
   * AI-assisted building component suggestion based on selection heuristics
   */
  suggestComponentName(selection: SelectionResult, objectDensity: number = 0): RoomSuggestion {
    const { isHorizontal, surfaceArea, normal } = selection

    // Size-based heuristics (in approximate square units)
    const isLarge = (surfaceArea || 0) > 50
    const isMedium = (surfaceArea || 0) > 20
    const isSmall = (surfaceArea || 0) <= 20

    // Density heuristics (many objects nearby = more fixtures)
    const isDense = objectDensity > 10

    // Horizontal surface facing up (floor or roof top)
    if (isHorizontal && normal && normal.y > 0.7) {
      if (isLarge) {
        return {
          suggestedName: 'Main Floor Slab',
          confidence: 'medium',
          reason: 'Large horizontal surface facing up',
          alternativeNames: ['Foundation', 'Roof', 'Upper Floor'],
        }
      }
      if (isMedium) {
        return {
          suggestedName: 'Floor Section',
          confidence: 'low',
          reason: 'Medium horizontal surface facing up',
          alternativeNames: ['Landing', 'Deck', 'Porch'],
        }
      }
      return {
        suggestedName: 'Platform',
        confidence: 'low',
        reason: 'Small horizontal surface',
        alternativeNames: ['Step', 'Landing', 'Ledge'],
      }
    }

    // Horizontal surface facing down (ceiling or roof underside)
    if (isHorizontal && normal && normal.y < -0.7) {
      if (isLarge) {
        return {
          suggestedName: 'Roof',
          confidence: 'medium',
          reason: 'Large horizontal surface facing down',
          alternativeNames: ['Ceiling', 'Soffit', 'Overhang'],
        }
      }
      return {
        suggestedName: 'Ceiling Section',
        confidence: 'low',
        reason: 'Horizontal surface facing down',
        alternativeNames: ['Soffit', 'Overhang', 'Canopy'],
      }
    }

    // Vertical surface (wall)
    if (!isHorizontal) {
      if (isLarge) {
        return {
          suggestedName: 'Exterior Wall',
          confidence: 'medium',
          reason: 'Large vertical surface',
          alternativeNames: ['Front Wall', 'Side Wall', 'Back Wall'],
        }
      }
      if (isMedium) {
        return {
          suggestedName: 'Wall Section',
          confidence: 'low',
          reason: 'Medium vertical surface',
          alternativeNames: ['Interior Wall', 'Partition', 'Panel'],
        }
      }
      if (isSmall && isDense) {
        return {
          suggestedName: 'Door Frame',
          confidence: 'low',
          reason: 'Small vertical surface with nearby objects',
          alternativeNames: ['Window Frame', 'Opening', 'Pillar'],
        }
      }
      return {
        suggestedName: 'Column',
        confidence: 'low',
        reason: 'Small vertical element',
        alternativeNames: ['Pillar', 'Support Beam', 'Post'],
      }
    }

    // Default fallback
    return {
      suggestedName: 'Building Component',
      confidence: 'low',
      reason: 'Unable to determine component type',
      alternativeNames: ['Wall Section', 'Floor Section', 'Structural Element'],
    }
  }

  /**
   * Create a new room
   */
  createRoom(name: string, initialProgress: number = 0): Room {
    const id = this.generateId(name)
    const room: Room = {
      id,
      name,
      progress: initialProgress,
      cameraTarget: null,
      assignments: [],
      photos: [],
      referenceImageUrl: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    this.rooms.set(id, room)
    this.notifyListeners()
    return room
  }

  /**
   * Get a room by ID
   */
  getRoom(id: string): Room | undefined {
    return this.rooms.get(id)
  }

  /**
   * Get all rooms
   */
  getAllRooms(): Room[] {
    return Array.from(this.rooms.values())
  }

  /**
   * Update room name
   */
  updateRoomName(id: string, name: string): void {
    const room = this.rooms.get(id)
    if (room) {
      room.name = name
      room.updatedAt = Date.now()
      this.notifyListeners()
    }
  }

  /**
   * Update room progress
   */
  updateProgress(id: string, progress: number): void {
    const room = this.rooms.get(id)
    if (room) {
      room.progress = Math.min(100, Math.max(0, progress))
      room.updatedAt = Date.now()
      this.notifyListeners()
    }
  }

  /**
   * Store AI analysis results
   */
  setAnalysisResult(
    id: string,
    analysis: {
      confidence: 'high' | 'medium' | 'low'
      visible_completed: string[]
      still_missing: string[]
      notes: string
    }
  ): void {
    const room = this.rooms.get(id)
    if (room) {
      room.lastAnalysis = {
        ...analysis,
        analyzedAt: Date.now(),
      }
      room.updatedAt = Date.now()
      this.notifyListeners()
    }
  }

  /**
   * Set camera target for a room
   */
  setCameraTarget(id: string, target: THREE.Vector3): void {
    const room = this.rooms.get(id)
    if (room) {
      room.cameraTarget = { x: target.x, y: target.y, z: target.z }
      room.updatedAt = Date.now()
      this.notifyListeners()
    }
  }

  /**
   * Add assignment to room
   */
  addAssignment(roomId: string, selectionKey: string): void {
    const room = this.rooms.get(roomId)
    if (room && !room.assignments.includes(selectionKey)) {
      room.assignments.push(selectionKey)
      room.updatedAt = Date.now()
      this.notifyListeners()
    }
  }

  /**
   * Remove assignment from room
   */
  removeAssignment(roomId: string, selectionKey: string): void {
    const room = this.rooms.get(roomId)
    if (room) {
      room.assignments = room.assignments.filter((a) => a !== selectionKey)
      room.updatedAt = Date.now()
      this.notifyListeners()
    }
  }

  /**
   * Add photo to room
   */
  addPhoto(roomId: string, photoUrl: string, notes?: string): RoomPhoto {
    const room = this.rooms.get(roomId)
    if (!room) throw new Error('Room not found')

    const photo: RoomPhoto = {
      id: `photo-${Date.now()}`,
      url: photoUrl,
      uploadedAt: Date.now(),
      notes,
    }
    room.photos.push(photo)
    room.updatedAt = Date.now()
    this.notifyListeners()
    return photo
  }

  /**
   * Remove photo from room
   */
  removePhoto(roomId: string, photoId: string): void {
    const room = this.rooms.get(roomId)
    if (room) {
      room.photos = room.photos.filter((p) => p.id !== photoId)
      room.updatedAt = Date.now()
      this.notifyListeners()
    }
  }

  /**
   * Delete a room
   */
  deleteRoom(id: string): void {
    this.rooms.delete(id)
    this.notifyListeners()
  }

  /**
   * Get room by assignment key
   */
  getRoomByAssignment(selectionKey: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.assignments.includes(selectionKey)) {
        return room
      }
    }
    return undefined
  }

  /**
   * Subscribe to changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener())
  }

  /**
   * Export rooms as JSON
   */
  export(): string {
    return JSON.stringify(Array.from(this.rooms.values()), null, 2)
  }

  /**
   * Import rooms from JSON
   */
  import(json: string): void {
    try {
      const data = JSON.parse(json) as Room[]
      this.rooms.clear()
      data.forEach((room) => {
        this.rooms.set(room.id, room)
      })
      this.notifyListeners()
    } catch (error) {
      console.error('Failed to import rooms:', error)
    }
  }

  /**
   * Clear all rooms
   */
  clear(): void {
    this.rooms.clear()
    this.notifyListeners()
  }

  /**
   * Get room count
   */
  get count(): number {
    return this.rooms.size
  }
}
