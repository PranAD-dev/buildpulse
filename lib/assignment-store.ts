import * as THREE from 'three'

export interface Assignment {
  id: string
  meshUuid: string
  meshName: string
  roomId: string
  roomName: string
  materialIndex?: number
  materialName?: string
  centroid: { x: number; y: number; z: number }
  createdAt: number
}

export interface RoomAssignmentSummary {
  roomId: string
  roomName: string
  assignmentCount: number
  meshUuids: string[]
  centroid: THREE.Vector3
}

export class AssignmentStore {
  private assignments: Map<string, Assignment> = new Map()

  /**
   * Generate a unique key for an assignment
   */
  private getKey(meshUuid: string, materialIndex?: number): string {
    return materialIndex !== undefined ? `${meshUuid}:${materialIndex}` : meshUuid
  }

  /**
   * Assign a mesh (or mesh+material) to a room
   */
  assign(
    mesh: THREE.Mesh,
    roomId: string,
    roomName: string,
    materialIndex?: number,
    materialName?: string
  ): Assignment {
    const key = this.getKey(mesh.uuid, materialIndex)

    // Calculate centroid
    const geometry = mesh.geometry
    geometry.computeBoundingBox()
    const center = new THREE.Vector3()
    geometry.boundingBox?.getCenter(center)
    center.applyMatrix4(mesh.matrixWorld)

    const assignment: Assignment = {
      id: key,
      meshUuid: mesh.uuid,
      meshName: mesh.name || `Mesh_${mesh.uuid.slice(0, 8)}`,
      roomId,
      roomName,
      materialIndex,
      materialName,
      centroid: { x: center.x, y: center.y, z: center.z },
      createdAt: Date.now(),
    }

    this.assignments.set(key, assignment)
    return assignment
  }

  /**
   * Remove an assignment
   */
  unassign(meshUuid: string, materialIndex?: number): boolean {
    const key = this.getKey(meshUuid, materialIndex)
    return this.assignments.delete(key)
  }

  /**
   * Get an assignment by mesh UUID (and optional material index)
   */
  getAssignment(meshUuid: string, materialIndex?: number): Assignment | undefined {
    const key = this.getKey(meshUuid, materialIndex)
    return this.assignments.get(key)
  }

  /**
   * Get all assignments for a specific room
   */
  getAssignmentsByRoom(roomId: string): Assignment[] {
    return Array.from(this.assignments.values()).filter((a) => a.roomId === roomId)
  }

  /**
   * Get all assignments
   */
  getAllAssignments(): Assignment[] {
    return Array.from(this.assignments.values())
  }

  /**
   * Get summary for each room
   */
  getRoomSummaries(): RoomAssignmentSummary[] {
    const roomMap = new Map<string, RoomAssignmentSummary>()

    this.assignments.forEach((assignment) => {
      if (!roomMap.has(assignment.roomId)) {
        roomMap.set(assignment.roomId, {
          roomId: assignment.roomId,
          roomName: assignment.roomName,
          assignmentCount: 0,
          meshUuids: [],
          centroid: new THREE.Vector3(),
        })
      }

      const summary = roomMap.get(assignment.roomId)!
      summary.assignmentCount++
      summary.meshUuids.push(assignment.meshUuid)
      summary.centroid.add(
        new THREE.Vector3(assignment.centroid.x, assignment.centroid.y, assignment.centroid.z)
      )
    })

    // Compute average centroid for each room
    roomMap.forEach((summary) => {
      if (summary.assignmentCount > 0) {
        summary.centroid.divideScalar(summary.assignmentCount)
      }
    })

    return Array.from(roomMap.values())
  }

  /**
   * Get room centroid from assignments
   */
  getRoomCentroid(roomId: string): THREE.Vector3 | null {
    const assignments = this.getAssignmentsByRoom(roomId)
    if (assignments.length === 0) return null

    const centroid = new THREE.Vector3()
    assignments.forEach((a) => {
      centroid.add(new THREE.Vector3(a.centroid.x, a.centroid.y, a.centroid.z))
    })
    centroid.divideScalar(assignments.length)

    return centroid
  }

  /**
   * Check if a mesh is assigned
   */
  isAssigned(meshUuid: string, materialIndex?: number): boolean {
    const key = this.getKey(meshUuid, materialIndex)
    return this.assignments.has(key)
  }

  /**
   * Clear all assignments
   */
  clear(): void {
    this.assignments.clear()
  }

  /**
   * Export assignments as JSON
   */
  export(): string {
    return JSON.stringify(Array.from(this.assignments.values()), null, 2)
  }

  /**
   * Import assignments from JSON
   */
  import(json: string): void {
    try {
      const data = JSON.parse(json) as Assignment[]
      this.assignments.clear()
      data.forEach((assignment) => {
        const key = this.getKey(assignment.meshUuid, assignment.materialIndex)
        this.assignments.set(key, assignment)
      })
    } catch (error) {
      console.error('Failed to import assignments:', error)
    }
  }

  /**
   * Get count of assignments
   */
  get count(): number {
    return this.assignments.size
  }
}
