import { NextRequest, NextResponse } from 'next/server'
import { connectDB, Project } from '@/lib/mongodb'
import { saveToLocalStorage } from '@/lib/local-storage'

// GET /api/projects - List all projects
export async function GET() {
  try {
    await connectDB()
    const projects = await Project.find({}).sort({ created_at: -1 }).lean()

    // Convert MongoDB _id to id for frontend compatibility
    const formattedProjects = projects.map((p: any) => ({
      ...p,
      id: p._id.toString(),
      _id: undefined,
    }))

    return NextResponse.json(formattedProjects)
  } catch (error: any) {
    console.error('GET /api/projects error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()

    let modelUrl = body.model_url

    // If there's a 3D model, save it to local disk
    if (body.reference_type === '3d_model' && body.model_url) {
      // Estimate size: base64 is ~33% larger than binary
      const estimatedSizeKB = (body.model_url.length * 3) / 4 / 1024
      console.log(`3D model detected (${Math.round(estimatedSizeKB / 1024)}MB), saving to local storage...`)

      const filename = `${body.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.glb`
      modelUrl = saveToLocalStorage(body.model_url, filename)

      console.log(`Saved to local storage: ${modelUrl}`)
    }

    const project = await Project.create({
      name: body.name,
      reference_type: body.reference_type,
      model_url: modelUrl || null,
      target_completion_date: body.target_completion_date || null,
      overall_progress: 0,
      budget: body.budget || 0,
    })

    return NextResponse.json(
      {
        ...project.toObject(),
        id: project._id.toString(),
        _id: undefined,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('POST /api/projects error:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      {
        error: error.message || 'Failed to create project',
        details: error.toString(),
      },
      { status: 500 }
    )
  }
}
