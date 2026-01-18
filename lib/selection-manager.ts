import * as THREE from 'three'

export interface GeometryData {
  // Bounding box dimensions
  width: number
  height: number
  depth: number
  // Position in world space
  positionX: number
  positionY: number
  positionZ: number
  // Mesh statistics
  vertexCount: number
  faceCount: number
  // Shape analysis
  aspectRatio: number // width/height
  isFlat: boolean // one dimension much smaller than others
  isTall: boolean // height much larger than width/depth
  isWide: boolean // width much larger than height
  // Relative position in scene
  relativeHeight: 'ground' | 'mid' | 'top' // where in the scene vertically
}

export interface SelectionResult {
  type: 'mesh' | 'material'
  mesh: THREE.Mesh
  materialIndex?: number
  materialName?: string
  hitPoint: THREE.Vector3
  normal: THREE.Vector3
  surfaceArea?: number
  isHorizontal?: boolean
  geometry?: GeometryData
}

export interface MaterialInfo {
  mesh: THREE.Mesh
  material: THREE.Material
  materialIndex: number
  index: number
}

export class SelectionManager {
  private scene: THREE.Scene
  private camera: THREE.Camera
  private raycaster: THREE.Raycaster
  private mode: 'mesh' | 'material' = 'mesh'
  private meshCache: THREE.Mesh[] = []
  private materialCache: MaterialInfo[] = []
  private cacheValid = false

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene
    this.camera = camera
    this.raycaster = new THREE.Raycaster()
  }

  setMode(mode: 'mesh' | 'material'): void {
    this.mode = mode
  }

  getMode(): 'mesh' | 'material' {
    return this.mode
  }

  /**
   * Perform a raycast selection at normalized device coordinates
   */
  select(ndcX: number, ndcY: number): SelectionResult | null {
    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera)

    const meshes = this.getAllMeshes()
    const intersects = this.raycaster.intersectObjects(meshes, false)

    if (intersects.length === 0) return null

    const hit = intersects[0]
    const mesh = hit.object as THREE.Mesh

    if (!mesh.isMesh) return null

    const hitPoint = hit.point.clone()
    const normal = hit.face?.normal?.clone() || new THREE.Vector3(0, 1, 0)

    // Transform normal to world space
    normal.transformDirection(mesh.matrixWorld)

    // Check if surface is horizontal (floor/ceiling detection)
    const isHorizontal = Math.abs(normal.y) > 0.7

    // Calculate approximate surface area of the mesh
    const surfaceArea = this.estimateSurfaceArea(mesh)

    // Extract detailed geometry data for AI
    const geometry = this.extractGeometryData(mesh)

    if (this.mode === 'mesh') {
      return {
        type: 'mesh',
        mesh,
        hitPoint,
        normal,
        surfaceArea,
        isHorizontal,
        geometry,
      }
    } else {
      // Material mode - identify which material was hit
      const materialIndex = hit.face?.materialIndex ?? 0
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      const material = materials[materialIndex]
      const materialName = material?.name || `Material_${materialIndex}`

      return {
        type: 'material',
        mesh,
        materialIndex,
        materialName,
        hitPoint,
        normal,
        surfaceArea,
        isHorizontal,
        geometry,
      }
    }
  }

  /**
   * Get all meshes in the scene
   */
  getAllMeshes(): THREE.Mesh[] {
    if (this.cacheValid) return this.meshCache

    this.meshCache = []
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.visible) {
        this.meshCache.push(object)
      }
    })

    this.cacheValid = true
    return this.meshCache
  }

  /**
   * Get all unique materials with their associated meshes
   */
  getAllMaterials(): MaterialInfo[] {
    if (this.materialCache.length > 0) return this.materialCache

    const meshes = this.getAllMeshes()
    let globalIndex = 0

    meshes.forEach((mesh) => {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      materials.forEach((material, matIndex) => {
        this.materialCache.push({
          mesh,
          material,
          materialIndex: matIndex,
          index: globalIndex++,
        })
      })
    })

    return this.materialCache
  }

  /**
   * Find all meshes that use a specific material
   */
  getMeshesWithMaterial(targetMaterial: THREE.Material): THREE.Mesh[] {
    const meshes = this.getAllMeshes()
    const result: THREE.Mesh[] = []

    meshes.forEach((mesh) => {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      if (materials.some((m) => m.uuid === targetMaterial.uuid)) {
        result.push(mesh)
      }
    })

    return result
  }

  /**
   * Find all meshes using a material by name
   */
  getMeshesWithMaterialName(materialName: string): THREE.Mesh[] {
    const meshes = this.getAllMeshes()
    const result: THREE.Mesh[] = []

    meshes.forEach((mesh) => {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      if (materials.some((m) => m.name === materialName)) {
        result.push(mesh)
      }
    })

    return result
  }

  /**
   * Estimate surface area of a mesh (for room size heuristics)
   */
  private estimateSurfaceArea(mesh: THREE.Mesh): number {
    const geometry = mesh.geometry
    if (!geometry) return 0

    // Get bounding box as a quick estimate
    geometry.computeBoundingBox()
    const box = geometry.boundingBox
    if (!box) return 0

    const size = new THREE.Vector3()
    box.getSize(size)

    // Apply world scale
    const worldScale = new THREE.Vector3()
    mesh.getWorldScale(worldScale)
    size.multiply(worldScale)

    // Approximate surface area (sum of all box faces)
    return 2 * (size.x * size.y + size.y * size.z + size.z * size.x)
  }

  /**
   * Get centroid of a mesh in world coordinates
   */
  getMeshCentroid(mesh: THREE.Mesh): THREE.Vector3 {
    const geometry = mesh.geometry
    geometry.computeBoundingBox()
    const center = new THREE.Vector3()
    geometry.boundingBox?.getCenter(center)
    center.applyMatrix4(mesh.matrixWorld)
    return center
  }

  /**
   * Get combined centroid of multiple meshes
   */
  getCombinedCentroid(meshes: THREE.Mesh[]): THREE.Vector3 {
    if (meshes.length === 0) return new THREE.Vector3()

    const centroid = new THREE.Vector3()
    meshes.forEach((mesh) => {
      centroid.add(this.getMeshCentroid(mesh))
    })
    centroid.divideScalar(meshes.length)

    return centroid
  }

  /**
   * Invalidate cache (call after scene changes)
   */
  invalidateCache(): void {
    this.cacheValid = false
    this.meshCache = []
    this.materialCache = []
  }

  /**
   * Get nearby meshes within a radius
   */
  getNearbyMeshes(point: THREE.Vector3, radius: number): THREE.Mesh[] {
    const meshes = this.getAllMeshes()
    return meshes.filter((mesh) => {
      const centroid = this.getMeshCentroid(mesh)
      return centroid.distanceTo(point) <= radius
    })
  }

  /**
   * Count objects near a point (for density heuristics)
   */
  getObjectDensity(point: THREE.Vector3, radius: number): number {
    return this.getNearbyMeshes(point, radius).length
  }

  /**
   * Extract detailed geometry data from a mesh for AI analysis
   */
  extractGeometryData(mesh: THREE.Mesh): GeometryData {
    const geometry = mesh.geometry
    geometry.computeBoundingBox()

    const box = geometry.boundingBox!
    const size = new THREE.Vector3()
    box.getSize(size)

    // Apply world scale
    const worldScale = new THREE.Vector3()
    mesh.getWorldScale(worldScale)
    size.multiply(worldScale)

    // Get world position
    const worldPos = new THREE.Vector3()
    mesh.getWorldPosition(worldPos)

    // Get vertex and face counts
    const vertexCount = geometry.attributes.position?.count || 0
    const indexCount = geometry.index?.count || 0
    const faceCount = indexCount > 0 ? indexCount / 3 : vertexCount / 3

    // Calculate aspect ratio and shape characteristics
    const width = size.x
    const height = size.y
    const depth = size.z
    const maxDim = Math.max(width, height, depth)
    const minDim = Math.min(width, height, depth)

    const aspectRatio = width / (height || 0.001)
    const isFlat = minDim < maxDim * 0.1 // One dimension is < 10% of max
    const isTall = height > width * 1.5 && height > depth * 1.5
    const isWide = width > height * 2 || depth > height * 2

    // Determine relative height in scene
    const sceneBox = new THREE.Box3()
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        sceneBox.expandByObject(obj)
      }
    })
    const sceneHeight = sceneBox.max.y - sceneBox.min.y
    const relativeY = (worldPos.y - sceneBox.min.y) / (sceneHeight || 1)

    let relativeHeight: 'ground' | 'mid' | 'top' = 'mid'
    if (relativeY < 0.3) relativeHeight = 'ground'
    else if (relativeY > 0.7) relativeHeight = 'top'

    return {
      width: Math.round(width * 100) / 100,
      height: Math.round(height * 100) / 100,
      depth: Math.round(depth * 100) / 100,
      positionX: Math.round(worldPos.x * 100) / 100,
      positionY: Math.round(worldPos.y * 100) / 100,
      positionZ: Math.round(worldPos.z * 100) / 100,
      vertexCount,
      faceCount: Math.round(faceCount),
      aspectRatio: Math.round(aspectRatio * 100) / 100,
      isFlat,
      isTall,
      isWide,
      relativeHeight,
    }
  }
}
