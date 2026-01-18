import * as THREE from 'three'

export interface CameraState {
  position: THREE.Vector3
  target: THREE.Vector3
}

export interface AnimationOptions {
  duration?: number
  easing?: (t: number) => number
  onComplete?: () => void
}

// Easing functions
export const easings = {
  linear: (t: number) => t,
  easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
  easeIn: (t: number) => t * t * t,
}

export class CameraController {
  private camera: THREE.Camera
  private controls: any // OrbitControls from drei
  private isAnimating = false
  private animationId: number | null = null

  // Animation state
  private startState: CameraState | null = null
  private endState: CameraState | null = null
  private startTime: number = 0
  private duration: number = 1000
  private easing: (t: number) => number = easings.easeInOut
  private onComplete: (() => void) | null = null

  constructor(camera: THREE.Camera, controls?: any) {
    this.camera = camera
    this.controls = controls
  }

  /**
   * Set the orbit controls reference (can be set later)
   */
  setControls(controls: any): void {
    this.controls = controls
  }

  /**
   * Get current camera state
   */
  getCurrentState(): CameraState {
    const target = this.controls?.target?.clone() || new THREE.Vector3()
    return {
      position: this.camera.position.clone(),
      target,
    }
  }

  /**
   * Animate camera to look at a target point
   */
  flyTo(target: THREE.Vector3, options: AnimationOptions = {}): Promise<void> {
    return new Promise((resolve) => {
      const { duration = 1000, easing = easings.easeInOut, onComplete } = options

      // Calculate camera position based on target
      // Position camera at a good viewing distance and angle
      const distance = 8
      const height = 4
      const offset = new THREE.Vector3(distance, height, distance)
      const newPosition = target.clone().add(offset)

      this.animateTo(
        {
          position: newPosition,
          target: target.clone(),
        },
        {
          duration,
          easing,
          onComplete: () => {
            onComplete?.()
            resolve()
          },
        }
      )
    })
  }

  /**
   * Animate camera to specific state
   */
  animateTo(endState: CameraState, options: AnimationOptions = {}): void {
    const { duration = 1000, easing = easings.easeInOut, onComplete } = options

    // Cancel any existing animation
    this.stopAnimation()

    this.startState = this.getCurrentState()
    this.endState = endState
    this.startTime = performance.now()
    this.duration = duration
    this.easing = easing
    this.onComplete = onComplete || null
    this.isAnimating = true

    // Disable controls during animation
    if (this.controls) {
      this.controls.enabled = false
    }

    this.animate()
  }

  /**
   * Animation loop
   */
  private animate = (): void => {
    if (!this.isAnimating || !this.startState || !this.endState) return

    const elapsed = performance.now() - this.startTime
    const progress = Math.min(elapsed / this.duration, 1)
    const eased = this.easing(progress)

    // Interpolate position
    this.camera.position.lerpVectors(this.startState.position, this.endState.position, eased)

    // Interpolate target (if using orbit controls)
    if (this.controls?.target) {
      this.controls.target.lerpVectors(this.startState.target, this.endState.target, eased)
    }

    // Make camera look at target
    this.camera.lookAt(
      new THREE.Vector3().lerpVectors(this.startState.target, this.endState.target, eased)
    )

    if (progress < 1) {
      this.animationId = requestAnimationFrame(this.animate)
    } else {
      this.finishAnimation()
    }
  }

  /**
   * Finish animation and re-enable controls
   */
  private finishAnimation(): void {
    this.isAnimating = false
    this.animationId = null

    // Re-enable controls
    if (this.controls) {
      this.controls.enabled = true
      this.controls.update?.()
    }

    // Call completion callback
    this.onComplete?.()
    this.onComplete = null
  }

  /**
   * Stop current animation
   */
  stopAnimation(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    this.isAnimating = false

    // Re-enable controls
    if (this.controls) {
      this.controls.enabled = true
    }
  }

  /**
   * Check if animating
   */
  get animating(): boolean {
    return this.isAnimating
  }

  /**
   * Reset camera to default position
   */
  reset(options: AnimationOptions = {}): void {
    this.animateTo(
      {
        position: new THREE.Vector3(10, 10, 10),
        target: new THREE.Vector3(0, 0, 0),
      },
      options
    )
  }

  /**
   * Zoom to fit a bounding box
   */
  fitToBox(box: THREE.Box3, options: AnimationOptions = {}): void {
    const center = new THREE.Vector3()
    box.getCenter(center)

    const size = new THREE.Vector3()
    box.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)

    // Calculate distance based on field of view
    const fov = (this.camera as THREE.PerspectiveCamera).fov || 50
    const distance = maxDim / (2 * Math.tan((fov * Math.PI) / 360))

    const offset = new THREE.Vector3(1, 0.8, 1).normalize().multiplyScalar(distance * 1.5)
    const position = center.clone().add(offset)

    this.animateTo(
      {
        position,
        target: center,
      },
      options
    )
  }

  /**
   * Orbit around current target
   */
  orbitTo(angle: number, options: AnimationOptions = {}): void {
    const state = this.getCurrentState()
    const direction = state.position.clone().sub(state.target)
    const distance = direction.length()

    // Rotate around Y axis
    const newX = Math.cos(angle) * distance
    const newZ = Math.sin(angle) * distance
    const newPosition = new THREE.Vector3(newX, state.position.y, newZ).add(state.target)

    this.animateTo(
      {
        position: newPosition,
        target: state.target,
      },
      options
    )
  }
}
