import mongoose from 'mongoose'
import { connectDB } from './mongodb'

let gridFSBucket: any = null

export async function getGridFSBucket() {
  if (gridFSBucket) {
    return gridFSBucket
  }

  const conn = await connectDB()

  if (!conn.connection.db) {
    throw new Error('Database connection not established')
  }

  gridFSBucket = new mongoose.mongo.GridFSBucket(conn.connection.db, {
    bucketName: 'uploads',
  })

  return gridFSBucket
}

/**
 * Upload a base64 file to GridFS
 * @param base64Data - The base64 data URL (e.g., "data:model/gltf-binary;base64,...")
 * @param filename - The filename to store
 * @returns The file ID
 */
export async function uploadToGridFS(base64Data: string, filename: string): Promise<string> {
  const bucket = await getGridFSBucket()

  // Remove the data URL prefix and convert to buffer
  const base64Content = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data
  const buffer = Buffer.from(base64Content, 'base64')

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename)

    // Write the buffer directly
    uploadStream.write(buffer, (error: Error) => {
      if (error) {
        reject(error)
        return
      }

      uploadStream.end(() => {
        resolve(uploadStream.id.toString())
      })
    })

    uploadStream.on('error', (error: Error) => {
      reject(error)
    })
  })
}

/**
 * Get a file from GridFS as a base64 data URL
 * @param fileId - The GridFS file ID
 * @returns Base64 data URL
 */
export async function getFromGridFS(fileId: string): Promise<string> {
  const bucket = await getGridFSBucket()
  const objectId = new mongoose.Types.ObjectId(fileId)

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const downloadStream = bucket.openDownloadStream(objectId)

    downloadStream.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })

    downloadStream.on('end', () => {
      const buffer = Buffer.concat(chunks)
      const base64 = buffer.toString('base64')

      // Get file info to determine content type
      bucket.find({ _id: objectId }).toArray((err: Error, files: any[]) => {
        if (err) {
          reject(err)
          return
        }

        const file = files[0]
        const contentType = file.filename.endsWith('.glb')
          ? 'model/gltf-binary'
          : file.filename.endsWith('.gltf')
            ? 'model/gltf+json'
            : 'image/jpeg'

        resolve(`data:${contentType};base64,${base64}`)
      })
    })

    downloadStream.on('error', (error: Error) => {
      reject(error)
    })
  })
}

/**
 * Delete a file from GridFS
 * @param fileId - The GridFS file ID
 */
export async function deleteFromGridFS(fileId: string): Promise<void> {
  const bucket = await getGridFSBucket()
  const objectId = new mongoose.Types.ObjectId(fileId)

  return new Promise((resolve, reject) => {
    bucket.delete(objectId, (error: Error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}
