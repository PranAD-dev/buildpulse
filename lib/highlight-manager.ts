import * as THREE from 'three'

export class HighlightManager {
  private originalMaterials: Map<string, THREE.Material | THREE.Material[]> = new Map()
  private highlightedMeshes: Set<THREE.Mesh> = new Set()
  private highlightMaterial: THREE.MeshStandardMaterial

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
  }

  /**
   * Highlight a single mesh
   */
  highlightMesh(mesh: THREE.Mesh): void {
    if (this.highlightedMeshes.has(mesh)) return

    // Store original material
    this.originalMaterials.set(mesh.uuid, mesh.material)

    // Apply highlight material
    mesh.material = this.highlightMaterial
    this.highlightedMeshes.add(mesh)
  }

  /**
   * Highlight multiple meshes (for material mode)
   */
  highlightMeshes(meshes: THREE.Mesh[]): void {
    meshes.forEach((mesh) => this.highlightMesh(mesh))
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
  }
}
