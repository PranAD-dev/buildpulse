import type { WebGLRenderer } from 'three'

export interface CaptureOptions {
  format?: 'png' | 'jpeg'
  quality?: number // 0-1 for jpeg
}

/**
 * Captures the current Three.js canvas view as a base64 image
 * @param renderer - The Three.js WebGLRenderer instance
 * @param options - Optional format and quality settings
 * @returns Base64 encoded image string (with data URI prefix)
 */
export function captureThreeView(
  renderer: WebGLRenderer,
  options: CaptureOptions = {}
): string {
  const { format = 'png', quality = 0.92 } = options

  // Ensure the renderer has preserveDrawingBuffer enabled
  // If not, we need to render one more frame before capturing
  const canvas = renderer.domElement
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg'

  return canvas.toDataURL(mimeType, quality)
}

/**
 * Captures the Three.js canvas view without the data URI prefix
 * @param renderer - The Three.js WebGLRenderer instance
 * @param options - Optional format and quality settings
 * @returns Raw base64 string without data URI prefix
 */
export function captureThreeViewRaw(
  renderer: WebGLRenderer,
  options: CaptureOptions = {}
): string {
  const dataUrl = captureThreeView(renderer, options)
  // Remove the data:image/xxx;base64, prefix
  return dataUrl.split(',')[1]
}

/**
 * Captures a canvas element as a base64 image
 * Useful when you have direct access to the canvas element
 * @param canvas - The canvas element to capture
 * @param options - Optional format and quality settings
 * @returns Base64 encoded image string (with data URI prefix)
 */
export function captureCanvas(
  canvas: HTMLCanvasElement,
  options: CaptureOptions = {}
): string {
  const { format = 'png', quality = 0.92 } = options
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg'

  return canvas.toDataURL(mimeType, quality)
}

/**
 * Captures a canvas element by its ID
 * @param canvasId - The ID of the canvas element
 * @param options - Optional format and quality settings
 * @returns Base64 encoded image string or null if canvas not found
 */
export function captureCanvasById(
  canvasId: string,
  options: CaptureOptions = {}
): string | null {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null
  if (!canvas) {
    console.error(`Canvas with id "${canvasId}" not found`)
    return null
  }
  return captureCanvas(canvas, options)
}
