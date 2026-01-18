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

    // If project has progress but no history, seed it with current progress
    let progressHistory = project.progress_history || []
    if (progressHistory.length === 0 && project.overall_progress > 0) {
      // Add an initial entry with project creation date and a current entry
      progressHistory = [
        { date: project.created_at, progress: 0 },
        { date: new Date(), progress: project.overall_progress },
      ]
      // Save this to DB for future consistency
      await Project.findByIdAndUpdate(id, {
        $set: { progress_history: progressHistory },
      })
    }

    return NextResponse.json({
      ...project,
      id: project._id.toString(),
      _id: undefined,
      model_url: project.model_url,
      progress_history: progressHistory,
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

    // Build the update operation
    const updateOperation: any = { $set: updateData }

    // If progress is being updated, add to progress history
    if (body.overall_progress !== undefined) {
      updateOperation.$push = {
        progress_history: {
          date: new Date(),
          progress: body.overall_progress,
        },
      }
    }

    const project = await Project.findByIdAndUpdate(
      id,
      updateOperation,
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
