import fs from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

/**
 * Save a base64 file to local disk
 * @param base64Data - The base64 data URL (e.g., "data:model/gltf-binary;base64,...")
 * @param filename - The filename to store
 * @returns The public URL path to access the file
 */
export function saveToLocalStorage(base64Data: string, filename: string): string {
  // Remove the data URL prefix and convert to buffer
  const base64Content = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data
  const buffer = Buffer.from(base64Content, 'base64')

  // Save to disk
  const filePath = path.join(UPLOAD_DIR, filename)
  fs.writeFileSync(filePath, buffer)

  // Return public URL path
  return `/uploads/${filename}`
}

/**
 * Delete a file from local disk
 * @param publicPath - The public URL path (e.g., "/uploads/filename.glb")
 */
export function deleteFromLocalStorage(publicPath: string): void {
  const filename = path.basename(publicPath)
  const filePath = path.join(UPLOAD_DIR, filename)

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

/**
 * Check if a file exists
 * @param publicPath - The public URL path (e.g., "/uploads/filename.glb")
 */
export function fileExists(publicPath: string): boolean {
  const filename = path.basename(publicPath)
  const filePath = path.join(UPLOAD_DIR, filename)
  return fs.existsSync(filePath)
}
