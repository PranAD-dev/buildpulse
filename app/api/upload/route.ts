import { NextRequest, NextResponse } from 'next/server'
import { uploadDataUrl, STORAGE_BUCKETS } from '@/lib/supabase'

// POST /api/upload - Handle file uploads to Supabase Storage
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dataUrl, fileName, bucket } = body

    // Validate inputs
    if (!dataUrl || !fileName || !bucket) {
      return NextResponse.json(
        { error: 'Missing required fields: dataUrl, fileName, bucket' },
        { status: 400 }
      )
    }

    // Validate bucket name
    const validBuckets = Object.keys(STORAGE_BUCKETS)
    if (!validBuckets.includes(bucket)) {
      return NextResponse.json(
        { error: `Invalid bucket. Must be one of: ${validBuckets.join(', ')}` },
        { status: 400 }
      )
    }

    // Upload file
    const publicUrl = await uploadDataUrl(bucket as keyof typeof STORAGE_BUCKETS, dataUrl, fileName)

    return NextResponse.json({ url: publicUrl }, { status: 201 })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 })
  }
}
