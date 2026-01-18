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

    // Calculate financial impact of delays
    // Industry standard: construction delays cost ~$100k-500k per day for large projects
    // We'll use a conservative estimate based on budget size
    const estimatedDailyDelayCost = project.budget
      ? Math.round(project.budget * 0.001) // 0.1% of budget per day (conservative estimate)
      : 100000 // Default $100k/day if no budget specified

    // Calculate days ahead/behind based on progress vs time
    const totalProjectDays = project.target_completion_date
      ? Math.ceil((new Date(project.target_completion_date).getTime() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 365 // Default to 1 year

    const daysPassed = project.target_completion_date
      ? totalProjectDays - (daysRemaining || 0)
      : 0

    const expectedProgressByNow = totalProjectDays > 0 ? (daysPassed / totalProjectDays) * 100 : 0
    const actualProgress = project.overall_progress || avgProgress
    const progressDelta = actualProgress - expectedProgressByNow

    // Estimate days ahead or behind
    const daysAheadOrBehind = totalProjectDays > 0
      ? Math.round((progressDelta / 100) * totalProjectDays)
      : 0

    // Calculate financial impact
    let financialImpact = ''
    let financialImpactAmount = 0

    if (daysAheadOrBehind < 0) {
      // Behind schedule - money potentially lost
      financialImpactAmount = Math.abs(daysAheadOrBehind) * estimatedDailyDelayCost
      const impactFormatted = financialImpactAmount >= 1000000
        ? `$${(financialImpactAmount / 1000000).toFixed(2)} million`
        : `$${(financialImpactAmount / 1000).toFixed(0)} thousand`
      financialImpact = `⚠️ POTENTIAL COST OVERRUN: Project is approximately ${Math.abs(daysAheadOrBehind)} days behind schedule, representing potential additional costs of ${impactFormatted} (at ~$${(estimatedDailyDelayCost / 1000).toFixed(0)}k per day for labor, equipment rental, financing, and overhead).`
    } else if (daysAheadOrBehind > 0) {
      // Ahead of schedule - money saved
      financialImpactAmount = daysAheadOrBehind * estimatedDailyDelayCost
      const savingsFormatted = financialImpactAmount >= 1000000
        ? `$${(financialImpactAmount / 1000000).toFixed(2)} million`
        : `$${(financialImpactAmount / 1000).toFixed(0)} thousand`
      financialImpact = `✅ COST SAVINGS: Project is approximately ${daysAheadOrBehind} days ahead of schedule, representing potential cost savings of ${savingsFormatted} in reduced labor, equipment rental, and overhead costs.`
    } else {
      financialImpact = `✓ ON SCHEDULE: Project is progressing as planned with no significant cost overruns or delays expected at this time.`
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

FINANCIAL IMPACT:
${financialImpact}

ZONE BREAKDOWN (${totalZones} total zones, ${completedZones} completed):
${zoneBreakdown.map(z => `- ${z.name}: ${z.progress}% (${z.status})`).join('\n')}

Please create a shareholder-friendly video report that covers:
1. Executive Summary - Quick overview of project status and financial position
2. Progress Highlights - What has been accomplished
3. Current Phase Details - Where we are in the construction timeline
4. Budget Status - Financial overview and cost analysis
5. Timeline Analysis - Are we on track? Days remaining assessment
6. Financial Impact - CRITICAL: Emphasize money saved if ahead of schedule OR potential cost overruns if behind schedule
7. Zone-by-Zone Progress - Detail each construction zone
8. Risk Assessment - Any concerns or blockers that could cause delays
9. Cost Mitigation Strategies - If behind, what steps to minimize additional costs
10. Next Steps - Upcoming milestones and what to expect
11. Conclusion - Summary with financial outlook and confidence level for on-time completion

IMPORTANT: Pay special attention to the financial impact section. If the project is ahead of schedule, highlight the cost savings prominently as a positive achievement. If behind schedule, clearly communicate the financial risks and urgency of getting back on track.

Make it professional, data-driven, and suitable for executive stakeholders and investors.
Use clear visuals, charts concepts, and maintain an optimistic but honest tone about both progress and financial implications.
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
