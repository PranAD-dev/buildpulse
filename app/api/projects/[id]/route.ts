import { NextRequest, NextResponse } from 'next/server'
import { connectDB, Project, Room } from '@/lib/mongodb'

// GET /api/projects/[id] - Get single project with its rooms
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params

    console.log('Fetching project with ID:', id)

    // Get project from MongoDB
    const project = await Project.findById(id).lean()

    console.log('Project found:', project ? 'yes' : 'no')

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get rooms for this project
    const rooms = await Room.find({ project_id: id }).sort({ created_at: 1 }).lean()

    // Format rooms
    const formattedRooms = rooms.map((r: any) => ({
      ...r,
      id: r._id.toString(),
      _id: undefined,
    }))

    // Model URL is now a local path like /uploads/filename.glb
    // Files are served directly from public/uploads/ folder
    console.log('Returning project data with model_url:', project.model_url)

    return NextResponse.json({
      ...project,
      id: project._id.toString(),
      _id: undefined,
      model_url: project.model_url,
      rooms: formattedRooms,
    })
  } catch (error: any) {
    console.error('GET /api/projects/[id] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const body = await request.json()

    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.reference_type !== undefined) updateData.reference_type = body.reference_type
    if (body.model_url !== undefined) updateData.model_url = body.model_url
    if (body.target_completion_date !== undefined) updateData.target_completion_date = body.target_completion_date
    if (body.overall_progress !== undefined) updateData.overall_progress = body.overall_progress

    const project = await Project.findByIdAndUpdate(
      id,
      updateData,
      { new: true, lean: true }
    )

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...project,
      id: project._id.toString(),
      _id: undefined,
    })
  } catch (error: any) {
    console.error('PUT /api/projects/[id] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params

    // Get project to find model file path
    const project = await Project.findById(id).lean()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Delete the project from MongoDB
    await Project.findByIdAndDelete(id)

    // Also delete associated rooms
    await Room.deleteMany({ project_id: id })

    // TODO: Delete the 3D model file from disk if it exists
    // We can add this later using deleteFromLocalStorage()

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE /api/projects/[id] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
