import { NextRequest, NextResponse } from 'next/server'
import { getFromGridFS } from '@/lib/gridfs'

// GET /api/files/[id] - Get a file from GridFS
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const dataUrl = await getFromGridFS(id)

    return NextResponse.json({ data: dataUrl })
  } catch (error: any) {
    console.error('GET /api/files/[id] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
