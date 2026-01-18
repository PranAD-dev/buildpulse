import { NextRequest, NextResponse } from 'next/server'
import { OpennoteClient } from '@opennote-ed/sdk'
import { connectDB, Project, Room } from '@/lib/mongodb'
import fs from 'fs'
import path from 'path'

const client = new OpennoteClient({ api_key: process.env.OPENNOTE_API_KEY! })

// POST /api/report - Generate shareholder video report
export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENNOTE_API_KEY) {
      return NextResponse.json(
        { error: 'Opennote API key not configured' },
        { status: 500 }
      )
    }

    await connectDB()
    const body = await request.json()
    const { projectId } = body

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing projectId' },
        { status: 400 }
      )
    }

    // Fetch project data
    const project = await Project.findById(projectId).lean()
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Fetch zones/rooms for this project
    const rooms = await Room.find({ project_id: projectId }).lean()

    // Calculate metrics
    const totalZones = rooms.length
    const completedZones = rooms.filter((r: any) => r.current_percent >= 100).length
    const avgProgress = totalZones > 0
      ? Math.round(rooms.reduce((sum: number, r: any) => sum + (r.current_percent || 0), 0) / totalZones)
      : 0

    const daysRemaining = project.target_completion_date
      ? Math.ceil((new Date(project.target_completion_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null

    const budgetFormatted = project.budget
      ? project.budget >= 1000000
        ? `$${(project.budget / 1000000).toFixed(1)} million`
        : `$${(project.budget / 1000).toFixed(0)} thousand`
      : 'Not specified'

    // Build zone breakdown
    const zoneBreakdown = rooms.map((r: any) => ({
      name: r.name,
      progress: r.current_percent || 0,
      status: (r.current_percent || 0) >= 100 ? 'Complete' : (r.current_percent || 0) >= 50 ? 'In Progress' : 'Early Stage'
    }))

    // Determine overall project status
    let projectStatus = 'On Track'
    if (daysRemaining !== null && daysRemaining < 0) {
      projectStatus = 'Behind Schedule'
    } else if (avgProgress < 50 && daysRemaining !== null && daysRemaining < 30) {
      projectStatus = 'At Risk'
    }

    // Create the prompt for the video
    const reportPrompt = `
Create a professional construction project status report video for shareholders and stakeholders.

PROJECT: ${project.name}
BUDGET: ${budgetFormatted}
TARGET COMPLETION: ${project.target_completion_date ? new Date(project.target_completion_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not set'}
DAYS REMAINING: ${daysRemaining !== null ? (daysRemaining > 0 ? `${daysRemaining} days` : 'Past deadline') : 'No deadline set'}

OVERALL STATUS: ${projectStatus}
OVERALL PROGRESS: ${project.overall_progress || avgProgress}%

ZONE BREAKDOWN (${totalZones} total zones, ${completedZones} completed):
${zoneBreakdown.map(z => `- ${z.name}: ${z.progress}% (${z.status})`).join('\n')}

Please create a shareholder-friendly video report that covers:
1. Executive Summary - Quick overview of project status
2. Progress Highlights - What has been accomplished
3. Current Phase Details - Where we are in the construction timeline
4. Budget Status - Financial overview (use the provided budget)
5. Timeline Analysis - Are we on track? Days remaining assessment
6. Zone-by-Zone Progress - Detail each construction zone
7. Risk Assessment - Any concerns or blockers
8. Next Steps - Upcoming milestones and what to expect
9. Conclusion - Summary and confidence level for on-time completion

Make it professional, data-driven, and suitable for executive stakeholders and investors.
Use clear visuals, charts concepts, and maintain an optimistic but honest tone.
`

    // Call Opennote API
    const response = await client.video.create({
      model: 'picasso',
      messages: [
        {
          role: 'system',
          content: 'You are a professional construction project manager creating a video status report for shareholders and investors. Be clear, concise, data-driven, and professional. Focus on key metrics, progress, and timeline adherence.'
        },
        {
          role: 'user',
          content: reportPrompt
        }
      ],
      title: `${project.name} - Status Report`,
      upload_to_s3: true,
      include_sources: false,
    })

    if (response.success && response.video_id) {
      // Save video ID to project
      await Project.findByIdAndUpdate(projectId, {
        report_video_id: response.video_id,
        report_video_url: null, // Will be updated when video is ready
      })

      return NextResponse.json({
        success: true,
        videoId: response.video_id,
        projectId: projectId,
        message: 'Video report generation started',
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to start video generation' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Report generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate report' },
      { status: 500 }
    )
  }
}

// GET /api/report?videoId=xxx&projectId=xxx - Check video status and download locally
export async function GET(request: NextRequest) {
  try {
    if (!process.env.OPENNOTE_API_KEY) {
      return NextResponse.json(
        { error: 'Opennote API key not configured' },
        { status: 500 }
      )
    }

    await connectDB()
    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')
    const projectId = searchParams.get('projectId')

    if (!videoId) {
      return NextResponse.json(
        { error: 'Missing videoId parameter' },
        { status: 400 }
      )
    }

    const status = await client.video.status({ video_id: videoId })

    // If completed, download and save locally
    if (status.status === 'completed' && (status as any).response?.s3_url) {
      const s3Url = (status as any).response.s3_url

      // Create reports directory if it doesn't exist
      const reportsDir = path.join(process.cwd(), 'public', 'reports')
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true })
      }

      const filename = `report-${projectId || videoId}-${Date.now()}.mp4`
      const localPath = path.join(reportsDir, filename)
      const publicUrl = `/reports/${filename}`

      // Check if we already downloaded this video
      const existingFiles = fs.readdirSync(reportsDir)
      const existingReport = existingFiles.find(f => f.includes(projectId || videoId))

      if (existingReport) {
        return NextResponse.json({
          status: 'completed',
          progress: 100,
          message: 'Video ready',
          videoUrl: `/reports/${existingReport}`,
          s3Url: s3Url,
        })
      }

      // Download from S3 and save locally
      try {
        const videoResponse = await fetch(s3Url)
        const videoBuffer = await videoResponse.arrayBuffer()
        fs.writeFileSync(localPath, Buffer.from(videoBuffer))

        // Save URL to project
        if (projectId) {
          await Project.findByIdAndUpdate(projectId, {
            report_video_url: publicUrl,
          })
        }

        return NextResponse.json({
          status: 'completed',
          progress: 100,
          message: 'Video ready',
          videoUrl: publicUrl,
          s3Url: s3Url,
        })
      } catch (downloadError) {
        console.error('Failed to download video locally:', downloadError)
        // Save S3 URL to project as fallback
        if (projectId) {
          await Project.findByIdAndUpdate(projectId, {
            report_video_url: s3Url,
          })
        }
        return NextResponse.json({
          status: 'completed',
          progress: 100,
          message: 'Video ready (remote)',
          videoUrl: s3Url,
        })
      }
    }

    return NextResponse.json({
      status: status.status,
      progress: (status as any).progress || 0,
      message: (status as any).message || '',
      videoUrl: null,
    })
  } catch (error: any) {
    console.error('Report status error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check status' },
      { status: 500 }
    )
  }
}
