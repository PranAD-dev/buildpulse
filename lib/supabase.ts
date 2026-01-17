import { createClient } from '@supabase/supabase-js'

// ============================================
// Type Definitions
// ============================================

export interface Project {
  id: string
  name: string
  reference_type: 'images' | '3d_model'
  model_url: string | null
  target_completion_date: string | null
  overall_progress: number
  created_at: string
}

export interface Room {
  id: string
  project_id: string
  name: string
  reference_image_url: string | null
  model_camera_position: any | null
  current_percent: number
  created_at: string
}

export interface ProgressEntry {
  id: string
  room_id: string
  photo_url: string
  ai_estimated_percent: number | null
  ai_confidence: 'high' | 'medium' | 'low' | null
  visible_completed: string[] | null
  still_missing: string[] | null
  notes: string | null
  captured_at: string
}

// ============================================
// Supabase Client (Browser)
// ============================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================
// Storage Helpers
// ============================================

export const STORAGE_BUCKETS = {
  MODELS: 'models',
  REFERENCE_IMAGES: 'reference-images',
  PROGRESS_PHOTOS: 'progress-photos',
} as const

/**
 * Upload a file to Supabase Storage
 * @param bucket - The bucket name (models, reference-images, progress-photos)
 * @param file - The file to upload
 * @param path - Optional path within the bucket (e.g., 'project-123/room-456.jpg')
 * @returns Public URL of the uploaded file
 */
export async function uploadFile(
  bucket: keyof typeof STORAGE_BUCKETS,
  file: File,
  path?: string
): Promise<string> {
  const bucketName = STORAGE_BUCKETS[bucket]

  // Generate unique filename if path not provided
  const fileName = path || `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

  const { data, error } = await supabase.storage.from(bucketName).upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`)
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucketName).getPublicUrl(data.path)

  return publicUrl
}

/**
 * Upload a base64 data URL to Supabase Storage
 * @param bucket - The bucket name
 * @param dataUrl - Base64 data URL (e.g., from FileReader)
 * @param fileName - File name to use
 * @returns Public URL of the uploaded file
 */
export async function uploadDataUrl(
  bucket: keyof typeof STORAGE_BUCKETS,
  dataUrl: string,
  fileName: string
): Promise<string> {
  const bucketName = STORAGE_BUCKETS[bucket]

  // Convert data URL to blob
  const response = await fetch(dataUrl)
  const blob = await response.blob()

  // Generate unique filename
  const uniqueFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`

  const { data, error } = await supabase.storage.from(bucketName).upload(uniqueFileName, blob, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`)
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucketName).getPublicUrl(data.path)

  return publicUrl
}

/**
 * Delete a file from Supabase Storage
 * @param bucket - The bucket name
 * @param path - The file path in the bucket
 */
export async function deleteFile(bucket: keyof typeof STORAGE_BUCKETS, path: string): Promise<void> {
  const bucketName = STORAGE_BUCKETS[bucket]

  const { error } = await supabase.storage.from(bucketName).remove([path])

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`)
  }
}
