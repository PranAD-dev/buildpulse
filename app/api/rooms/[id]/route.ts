import { NextRequest, NextResponse } from 'next/server'
import { connectDB, Room, ProgressEntry } from '@/lib/mongodb'

// GET /api/rooms/[id] - Get single room with progress entries
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params

    const room = await Room.findById(id).lean()

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Get progress entries for this room
    const progressEntries = await ProgressEntry.find({ room_id: id })
      .sort({ captured_at: -1 })
      .lean()

    return NextResponse.json({
      ...(room as any),
      id: (room as any)._id.toString(),
      _id: undefined,
      progress_entries: progressEntries.map((p: any) => ({
        ...p,
        id: p._id.toString(),
        _id: undefined,
      })),
    })
  } catch (error: any) {
    console.error('GET /api/rooms/[id] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/rooms/[id] - Update room
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    const body = await request.json()

    // Build update object with only provided fields
    const updateData: Record<string, any> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.reference_image_url !== undefined) updateData.reference_image_url = body.reference_image_url
    if (body.model_camera_position !== undefined) updateData.model_camera_position = body.model_camera_position
    if (body.current_percent !== undefined) updateData.current_percent = body.current_percent
    if (body.mesh_assignments !== undefined) updateData.mesh_assignments = body.mesh_assignments

    const room = await Room.findByIdAndUpdate(id, updateData, { new: true }).lean()

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...(room as any),
      id: (room as any)._id.toString(),
      _id: undefined,
    })
  } catch (error: any) {
    console.error('PUT /api/rooms/[id] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/rooms/[id] - Delete room
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params

    // Delete all progress entries for this room first
    await ProgressEntry.deleteMany({ room_id: id })

    // Delete the room
    const result = await Room.findByIdAndDelete(id)

    if (!result) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE /api/rooms/[id] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
