export interface AnalysisResult {
  percent_complete: number
  confidence: 'high' | 'medium' | 'low'
  visible_completed: string[]
  still_missing: string[]
  notes: string
}

export interface AnalysisError {
  error: string
  raw?: string
}

/**
 * Sends target and progress images to Gemini for AI analysis
 * @param targetImage - Base64 encoded target/reference image from 3D view
 * @param progressPhoto - Base64 encoded progress photo from user upload
 * @param roomName - Name of the room being analyzed
 * @returns Analysis result or throws error
 */
export async function analyzeProgress(
  targetImage: string,
  progressPhoto: string,
  roomName: string
): Promise<AnalysisResult> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetImage, progressPhoto, roomName }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Analysis failed')
  }

  return data as AnalysisResult
}

/**
 * Converts a File to base64 string
 * @param file - The file to convert
 * @returns Promise resolving to base64 string with data URI prefix
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to read file as base64'))
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/**
 * Fetches an image URL and converts it to base64
 * @param url - The image URL to fetch
 * @returns Promise resolving to base64 string with data URI prefix
 */
export async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to convert URL to base64'))
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/**
 * Validates that an image is suitable for analysis
 * @param base64 - The base64 image string
 * @returns Object with valid flag and optional error message
 */
export function validateImage(base64: string): { valid: boolean; error?: string } {
  if (!base64) {
    return { valid: false, error: 'No image provided' }
  }

  // Check if it's a valid data URI or raw base64
  const isDataUri = base64.startsWith('data:image/')
  const isRawBase64 = /^[A-Za-z0-9+/=]+$/.test(base64.slice(0, 100))

  if (!isDataUri && !isRawBase64) {
    return { valid: false, error: 'Invalid image format' }
  }

  // Check approximate size (base64 is ~33% larger than original)
  // Limit to ~10MB original (~13MB base64)
  const sizeInBytes = (base64.length * 3) / 4
  const maxSize = 13 * 1024 * 1024 // 13MB

  if (sizeInBytes > maxSize) {
    return { valid: false, error: 'Image too large (max 10MB)' }
  }

  return { valid: true }
}
