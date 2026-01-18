import * as THREE from 'three'

// Predefined room colors for visual distinction
export const ROOM_COLORS: Record<string, number> = {
  'living-room': 0x4ade80, // green
  'kitchen': 0xfbbf24, // amber
  'bedroom': 0x60a5fa, // blue
  'bathroom': 0xa78bfa, // purple
  'office': 0xf472b6, // pink
  'dining': 0xfb923c, // orange
  'garage': 0x94a3b8, // slate
  'default': 0x00ff88, // bright green (selection)
  'hover': 0xffffff, // white (hover)
}

export class HighlightManager {
  private originalMaterials: Map<string, THREE.Material | THREE.Material[]> = new Map()
  private highlightedMeshes: Set<THREE.Mesh> = new Set()
  private highlightMaterial: THREE.MeshStandardMaterial
  private roomMaterials: Map<string, THREE.MeshStandardMaterial> = new Map()

  constructor() {
    // Create a reusable highlight material with emissive glow
    this.highlightMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00ff88,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    })

    // Pre-create materials for each room type
    Object.entries(ROOM_COLORS).forEach(([roomType, color]) => {
      this.roomMaterials.set(
        roomType,
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.4,
          transparent: true,
          opacity: 0.75,
          side: THREE.DoubleSide,
        })
      )
    })
  }

  /**
   * Get material for a specific room type
   */
  getRoomMaterial(roomId: string): THREE.MeshStandardMaterial {
    // Try to match room type from id
    const normalizedId = roomId.toLowerCase().replace(/[_\s]/g, '-')
    for (const key of Object.keys(ROOM_COLORS)) {
      if (normalizedId.includes(key)) {
        return this.roomMaterials.get(key)!
      }
    }
    return this.roomMaterials.get('default')!
  }

  /**
   * Highlight a single mesh
   */
  highlightMesh(mesh: THREE.Mesh, roomId?: string): void {
    if (this.highlightedMeshes.has(mesh)) return

    // Store original material
    this.originalMaterials.set(mesh.uuid, mesh.material)

    // Apply highlight material (room-specific or default)
    mesh.material = roomId ? this.getRoomMaterial(roomId) : this.highlightMaterial
    this.highlightedMeshes.add(mesh)
  }

  /**
   * Highlight multiple meshes (for material mode)
   */
  highlightMeshes(meshes: THREE.Mesh[], roomId?: string): void {
    meshes.forEach((mesh) => this.highlightMesh(mesh, roomId))
  }

  /**
   * Remove highlight from a mesh and restore original material
   */
  unhighlightMesh(mesh: THREE.Mesh): void {
    if (!this.highlightedMeshes.has(mesh)) return

    const originalMaterial = this.originalMaterials.get(mesh.uuid)
    if (originalMaterial) {
      mesh.material = originalMaterial
      this.originalMaterials.delete(mesh.uuid)
    }

    this.highlightedMeshes.delete(mesh)
  }

  /**
   * Clear all highlights
   */
  clearAll(): void {
    this.highlightedMeshes.forEach((mesh) => {
      const originalMaterial = this.originalMaterials.get(mesh.uuid)
      if (originalMaterial) {
        mesh.material = originalMaterial
      }
    })

    this.highlightedMeshes.clear()
    this.originalMaterials.clear()
  }

  /**
   * Get currently highlighted meshes
   */
  getHighlightedMeshes(): THREE.Mesh[] {
    return Array.from(this.highlightedMeshes)
  }

  /**
   * Check if a mesh is highlighted
   */
  isHighlighted(mesh: THREE.Mesh): boolean {
    return this.highlightedMeshes.has(mesh)
  }

  /**
   * Update highlight color
   */
  setHighlightColor(color: number, emissiveIntensity = 0.5): void {
    this.highlightMaterial.color.setHex(color)
    this.highlightMaterial.emissive.setHex(color)
    this.highlightMaterial.emissiveIntensity = emissiveIntensity
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.clearAll()
    this.highlightMaterial.dispose()
    this.roomMaterials.forEach((mat) => mat.dispose())
    this.roomMaterials.clear()
  }

  /**
   * Set opacity for all highlight materials
   */
  setOpacity(opacity: number): void {
    this.highlightMaterial.opacity = opacity
    this.roomMaterials.forEach((mat) => {
      mat.opacity = opacity
    })
  }
}
