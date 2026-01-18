import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

interface AnalysisResult {
  percent_complete: number
  confidence: 'high' | 'medium' | 'low'
  visible_completed: string[]
  still_missing: string[]
  notes: string
}

function buildPrompt(roomName: string): string {
  return `You are a construction progress analyzer.

Look at this construction site photo and analyze the progress of: "${roomName}"

YOUR TASK:
1. Find the "${roomName}" in this photo (it may be partially visible)
2. Estimate how complete it is (0-100%)
3. List what parts are done and what's still missing

WHAT TO LOOK FOR in a typical "${roomName}":
- Structural elements (framing, supports, base structure)
- Surface work (concrete, drywall, sheathing)
- Fixtures and installations
- Finishing work (paint, trim, final touches)

SCORING GUIDE:
- 0-20%: Just started, mainly framing/foundation
- 20-40%: Structure in place, rough work ongoing
- 40-60%: Major structural complete, MEP rough-in
- 60-80%: Surfaces installed, finishing started
- 80-100%: Nearly complete, final touches/inspection ready

The photo may show other parts of the building - IGNORE them and focus only on "${roomName}".

Respond ONLY with valid JSON:
{
"percent_complete": <number 0-100>,
"confidence": "<high|medium|low>",
"visible_completed": ["<item1>", "<item2>"],
"still_missing": ["<item1>", "<item2>"],
"notes": "<brief observation>"
}`
}

function stripBase64Prefix(base64: string): string {
  const match = base64.match(/^data:image\/\w+;base64,(.+)$/)
  return match ? match[1] : base64
}

function extractJson(text: string): AnalysisResult | null {
  // Try direct parse first
  try {
    return JSON.parse(text)
  } catch {
    // Try to extract JSON from markdown code blocks or surrounding text
    const jsonMatch = text.match(/\{[\s\S]*?"percent_complete"[\s\S]*?\}/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0])
      } catch {
        return null
      }
    }
    return null
  }
}

export async function POST(request: Request) {
  try {
    const { progressPhoto, roomName } = await request.json()

    if (!progressPhoto || !roomName) {
      return NextResponse.json(
        { error: 'Missing required fields: progressPhoto, roomName' },
        { status: 400 }
      )
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    const prompt = buildPrompt(roomName)
    const progressData = stripBase64Prefix(progressPhoto)

    // Determine MIME type
    const progressMime = progressPhoto.includes('image/png') ? 'image/png' : 'image/jpeg'

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: progressMime,
                data: progressData,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024,
      },
    })

    const response = result.response
    const text = response.text()

    const analysis = extractJson(text)

    if (!analysis) {
      console.error('Failed to parse Gemini response:', text)
      return NextResponse.json(
        { error: 'Failed to parse AI response', raw: text },
        { status: 500 }
      )
    }

    // Validate the response structure
    if (
      typeof analysis.percent_complete !== 'number' ||
      !['high', 'medium', 'low'].includes(analysis.confidence) ||
      !Array.isArray(analysis.visible_completed) ||
      !Array.isArray(analysis.still_missing)
    ) {
      return NextResponse.json(
        { error: 'Invalid AI response structure', raw: analysis },
        { status: 500 }
      )
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    )
  }
}
