import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { ProgressEntry } from '@/lib/supabase'

// GET /api/progress?room_id=xxx - List progress entries (optionally filtered by room)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('room_id')

    let query = supabase.from('progress_entries').select('*').order('captured_at', { ascending: false })

    if (roomId) {
      query = query.eq('room_id', roomId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data as ProgressEntry[])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/progress - Create new progress entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { data, error } = await supabase
      .from('progress_entries')
      .insert({
        room_id: body.room_id,
        photo_url: body.photo_url,
        ai_estimated_percent: body.ai_estimated_percent || null,
        ai_confidence: body.ai_confidence || null,
        visible_completed: body.visible_completed || null,
        still_missing: body.still_missing || null,
        notes: body.notes || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data as ProgressEntry, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
