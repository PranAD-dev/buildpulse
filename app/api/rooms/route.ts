import { NextRequest, NextResponse } from 'next/server'
import { connectDB, Room } from '@/lib/mongodb'

// GET /api/rooms?project_id=xxx - List rooms (optionally filtered by project)
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project_id')

    const filter = projectId ? { project_id: projectId } : {}
    const rooms = await Room.find(filter).sort({ created_at: 1 }).lean()

    const formattedRooms = rooms.map((r: any) => ({
      ...r,
      id: r._id.toString(),
      _id: undefined,
    }))

    return NextResponse.json(formattedRooms)
  } catch (error: any) {
    console.error('GET /api/rooms error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/rooms - Create new room
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()

    const room = await Room.create({
      project_id: body.project_id,
      name: body.name,
      reference_image_url: body.reference_image_url || null,
      model_camera_position: body.model_camera_position || null,
      mesh_assignments: body.mesh_assignments || [],
      current_percent: body.current_percent || 0,
    })

    return NextResponse.json(
      {
        ...room.toObject(),
        id: room._id.toString(),
        _id: undefined,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('POST /api/rooms error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
