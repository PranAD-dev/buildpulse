import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { Room } from '@/lib/supabase'

// GET /api/rooms/[id] - Get single room with progress entries
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Get room
    const { data: room, error: roomError } = await supabase.from('rooms').select('*').eq('id', id).single()

    if (roomError) {
      return NextResponse.json({ error: roomError.message }, { status: 500 })
    }

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Get progress entries for this room
    const { data: progressEntries, error: progressError } = await supabase
      .from('progress_entries')
      .select('*')
      .eq('room_id', id)
      .order('captured_at', { ascending: false })

    if (progressError) {
      return NextResponse.json({ error: progressError.message }, { status: 500 })
    }

    return NextResponse.json({
      ...room,
      progress_entries: progressEntries || [],
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/rooms/[id] - Update room
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()

    const { data, error } = await supabase
      .from('rooms')
      .update({
        name: body.name,
        reference_image_url: body.reference_image_url,
        model_camera_position: body.model_camera_position,
        current_percent: body.current_percent,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    return NextResponse.json(data as Room)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/rooms/[id] - Delete room
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const { error } = await supabase.from('rooms').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
