import { NextRequest, NextResponse } from 'next/server'
import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'

// Schema for the AI response
const ComponentSuggestionSchema = z.object({
  suggestedName: z.string().describe('The suggested building component/element name'),
  confidence: z.enum(['high', 'medium', 'low']).describe('Confidence level of the suggestion'),
  reason: z.string().describe('Brief explanation for the suggestion'),
  alternativeNames: z.array(z.string()).max(3).describe('Up to 3 alternative component suggestions'),
})

// Geometry data interface
interface GeometryData {
  width: number
  height: number
  depth: number
  positionX: number
  positionY: number
  positionZ: number
  vertexCount: number
  faceCount: number
  aspectRatio: number
  isFlat: boolean
  isTall: boolean
  isWide: boolean
  relativeHeight: 'ground' | 'mid' | 'top'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      isHorizontal,
      surfaceArea,
      normalY,
      normalX,
      normalZ,
      objectDensity,
      meshName,
      materialName,
      selectionType,
      geometry,
    } = body as {
      isHorizontal: boolean
      surfaceArea: number
      normalY: number
      normalX: number
      normalZ: number
      objectDensity: number
      meshName?: string
      materialName?: string
      selectionType: string
      geometry?: GeometryData
    }

    // Build context for the AI
    const surfaceType = isHorizontal
      ? normalY > 0
        ? 'horizontal floor-like surface (facing up)'
        : 'horizontal ceiling-like surface (facing down)'
      : 'vertical wall-like surface'

    const sizeCategory =
      surfaceArea > 50 ? 'large' : surfaceArea > 20 ? 'medium' : 'small'

    const densityDescription =
      objectDensity > 10
        ? 'high (many nearby objects/fixtures)'
        : objectDensity > 5
        ? 'moderate'
        : 'low (sparse area)'

    // Build geometry description
    let geometryDescription = ''
    if (geometry) {
      geometryDescription = `
3D Geometry Data:
- Bounding box dimensions: ${geometry.width} x ${geometry.height} x ${geometry.depth} units (W x H x D)
- World position: (${geometry.positionX}, ${geometry.positionY}, ${geometry.positionZ})
- Mesh complexity: ${geometry.vertexCount} vertices, ${geometry.faceCount} faces
- Aspect ratio (W/H): ${geometry.aspectRatio}
- Shape characteristics: ${geometry.isFlat ? 'FLAT (thin panel-like)' : ''} ${geometry.isTall ? 'TALL (column-like)' : ''} ${geometry.isWide ? 'WIDE (spread out)' : ''}
- Vertical position in scene: ${geometry.relativeHeight} level`
    }

    // Determine facing direction for walls
    let facingDirection = ''
    if (!isHorizontal) {
      if (Math.abs(normalZ) > Math.abs(normalX)) {
        facingDirection = normalZ > 0 ? 'facing front (towards viewer)' : 'facing back (away from viewer)'
      } else {
        facingDirection = normalX > 0 ? 'facing right' : 'facing left'
      }
    }

    const prompt = `You are an AI assistant helping to identify BUILDING COMPONENTS and STRUCTURAL ELEMENTS in a 3D construction model. Based on the following selection data, suggest what building component/element this surface likely is.

IMPORTANT: Do NOT suggest room names like "Living Room", "Kitchen", "Bedroom". Instead, identify the STRUCTURAL COMPONENT or BUILDING ELEMENT.

Selection Data:
- Surface type: ${surfaceType}${facingDirection ? ` (${facingDirection})` : ''}
- Surface size: ${sizeCategory} (${Math.round(surfaceArea || 0)} square units)
- Surface normal: (${normalX?.toFixed(2) || 0}, ${normalY?.toFixed(2) || 0}, ${normalZ?.toFixed(2) || 0})
- Object density nearby: ${densityDescription} (${objectDensity} objects)
- Selection mode: ${selectionType}
${meshName ? `- Mesh name: "${meshName}"` : ''}
${materialName ? `- Material name: "${materialName}"` : ''}
${geometryDescription}

Common building components to identify:
- Roof, Roof Section, Roof Panel, Shingles
- Foundation, Foundation Slab, Basement Floor
- Main Floor, Ground Floor Slab, Upper Floor Slab, Subfloor
- Front Wall, Back Wall, Side Wall, Interior Wall, Partition Wall
- Garage Door, Entry Door, Window Frame, Door Frame
- Pillars, Columns, Support Beams, Posts
- Staircase, Landing, Steps, Railing
- Deck, Patio, Porch, Balcony
- Driveway, Walkway, Sidewalk
- Fascia, Soffit, Gutter, Trim
- Chimney, Fireplace

Key patterns to recognize:
- FLAT + horizontal + ground level → Foundation Slab or Floor
- FLAT + horizontal + top level → Roof
- FLAT + vertical + large → Wall (Front/Back/Side based on facing)
- TALL + vertical + thin → Column, Pillar, or Post
- FLAT + vertical + small + rectangular → Door or Window Frame
- Sloped surface at top level → Roof (pitched)
- Mesh/material names with "roof", "wall", "floor", "door", "window" → use those hints!
- CUBE-LIKE shape with small width/depth but BIG height → Pillar or Column (structural support)
- Square cross-section (width ≈ depth) + tall height → definitely a Pillar/Column
- If height is 2x+ larger than width AND depth, it's likely a vertical support element (pillar/column)
- Classical columns with decorative bases/capitals are still pillars even if the base is wider

Analyze the geometry data carefully - the shape, position, and dimensions are strong indicators of what the component is.

Provide your best suggestion with reasoning.`

    const { object } = await generateObject({
      model: google('gemini-2.0-flash'),
      schema: ComponentSuggestionSchema,
      prompt,
    })

    return NextResponse.json(object)
  } catch (error: unknown) {
    console.error('AI suggestion error:', error)

    // Fallback to heuristic-based suggestion if AI fails
    const body = await request.json().catch(() => ({}))
    const { isHorizontal, surfaceArea, objectDensity, normalY, geometry } = body as {
      isHorizontal?: boolean
      surfaceArea?: number
      objectDensity?: number
      normalY?: number
      geometry?: GeometryData
    }

    let suggestedName = 'Building Component'
    let confidence: 'high' | 'medium' | 'low' = 'low'
    let reason = 'AI unavailable, using basic heuristics'
    let alternativeNames = ['Wall Section', 'Floor Section', 'Structural Element']

    // Use geometry data if available for better heuristics
    if (geometry) {
      // Check for pillar/column pattern: height is 2x+ larger than both width and depth
      const isPillarShape = geometry.height > geometry.width * 2 && geometry.height > geometry.depth * 2
      // Also check for square-ish cross-section (width ≈ depth) which is typical for pillars
      const hasSquareCrossSection = Math.abs(geometry.width - geometry.depth) < Math.max(geometry.width, geometry.depth) * 0.7
      // Check if width and depth are both relatively small compared to height
      const hasNarrowProfile = geometry.width < geometry.height * 0.5 && geometry.depth < geometry.height * 0.5

      if (isPillarShape || (geometry.isTall && hasNarrowProfile)) {
        suggestedName = 'Pillar'
        confidence = isPillarShape && hasSquareCrossSection ? 'high' : 'medium'
        reason = isPillarShape
          ? `Height (${geometry.height}) is 2x+ larger than width (${geometry.width}) and depth (${geometry.depth})`
          : 'Tall, narrow vertical element'
        alternativeNames = ['Column', 'Support Beam', 'Post']
      } else if (geometry.isTall && !geometry.isWide) {
        suggestedName = 'Column'
        confidence = 'medium'
        reason = 'Tall, narrow vertical element'
        alternativeNames = ['Pillar', 'Support Beam', 'Post']
      } else if (geometry.isFlat && geometry.relativeHeight === 'top') {
        suggestedName = 'Roof'
        confidence = 'medium'
        reason = 'Flat surface at top of structure'
        alternativeNames = ['Ceiling', 'Roof Panel', 'Soffit']
      } else if (geometry.isFlat && geometry.relativeHeight === 'ground') {
        suggestedName = 'Foundation'
        confidence = 'medium'
        reason = 'Flat surface at ground level'
        alternativeNames = ['Floor Slab', 'Basement Floor', 'Subfloor']
      } else if (geometry.isFlat && !isHorizontal) {
        suggestedName = 'Exterior Wall'
        confidence = 'medium'
        reason = 'Flat vertical panel'
        alternativeNames = ['Front Wall', 'Side Wall', 'Back Wall']
      }
    } else if (isHorizontal) {
      if (normalY && normalY > 0) {
        if (surfaceArea && surfaceArea > 50) {
          suggestedName = 'Main Floor Slab'
          confidence = 'medium'
          reason = 'Large horizontal surface facing up'
          alternativeNames = ['Foundation', 'Roof', 'Upper Floor']
        } else if (surfaceArea && surfaceArea > 20) {
          suggestedName = 'Floor Section'
          confidence = 'low'
          reason = 'Medium horizontal surface facing up'
          alternativeNames = ['Landing', 'Porch', 'Deck']
        } else {
          suggestedName = 'Platform'
          confidence = 'low'
          reason = 'Small horizontal surface'
          alternativeNames = ['Step', 'Landing', 'Ledge']
        }
      } else {
        if (surfaceArea && surfaceArea > 50) {
          suggestedName = 'Roof'
          confidence = 'medium'
          reason = 'Large horizontal surface facing down'
          alternativeNames = ['Ceiling', 'Soffit', 'Overhang']
        } else {
          suggestedName = 'Ceiling Section'
          confidence = 'low'
          reason = 'Horizontal surface facing down'
          alternativeNames = ['Soffit', 'Overhang', 'Canopy']
        }
      }
    } else {
      if (surfaceArea && surfaceArea > 50) {
        suggestedName = 'Exterior Wall'
        confidence = 'medium'
        reason = 'Large vertical surface'
        alternativeNames = ['Front Wall', 'Side Wall', 'Back Wall']
      } else if (surfaceArea && surfaceArea > 20) {
        suggestedName = 'Wall Section'
        confidence = 'low'
        reason = 'Medium vertical surface'
        alternativeNames = ['Interior Wall', 'Partition', 'Panel']
      } else if (objectDensity && objectDensity > 5) {
        suggestedName = 'Door Frame'
        confidence = 'low'
        reason = 'Small vertical surface with nearby objects'
        alternativeNames = ['Window Frame', 'Opening', 'Pillar']
      } else {
        suggestedName = 'Column'
        confidence = 'low'
        reason = 'Small vertical element'
        alternativeNames = ['Pillar', 'Support Beam', 'Post']
      }
    }

    return NextResponse.json({
      suggestedName,
      confidence,
      reason,
      alternativeNames,
    })
  }
}
