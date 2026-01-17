"use client"

import type React from "react"

import { useState, useCallback, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Upload, Camera, Sparkles, Check, X, Loader2 } from "lucide-react"
import { getZoneById } from "@/lib/mock-data"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import type { CheckInResult } from "@/lib/types"

interface CheckInPageProps {
  params: Promise<{ zoneId: string }>
}

export default function CheckInPage({ params }: CheckInPageProps) {
  const { zoneId } = use(params)
  const router = useRouter()
  const data = getZoneById(zoneId)

  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<CheckInResult | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileUpload = useCallback((file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
        setAnalysisResult(null)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      handleFileUpload(file)
    },
    [handleFileUpload],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const analyzeProgress = async () => {
    setIsAnalyzing(true)
    // Simulate AI analysis
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setAnalysisResult({
      percentComplete: Math.floor(Math.random() * 30) + 60,
      confidence: ["high", "medium", "low"][Math.floor(Math.random() * 3)] as "high" | "medium" | "low",
      visibleCompleted: ["Foundation poured", "Rebar installed", "Forms removed", "Initial curing complete"],
      stillMissing: ["Final grading", "Waterproofing membrane", "Drainage system"],
    })
    setIsAnalyzing(false)
  }

  const handleSave = () => {
    if (data) {
      router.push(`/project/${data.project.id}`)
    }
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-muted/20">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <h2 className="text-xl font-semibold text-foreground mb-2">Zone not found</h2>
            <Button asChild variant="outline" className="mt-4 bg-transparent">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  const { zone, project } = data

  return (
    <div className="min-h-screen bg-muted/20">
      <DashboardHeader />
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Button asChild variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
            <Link href={`/project/${project.id}`}>
              <ArrowLeft className="w-4 h-4" />
              Back to {project.name}
            </Link>
          </Button>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">Daily Check-in</h1>
          <p className="text-muted-foreground">
            Zone: <span className="font-medium text-foreground">{zone.name}</span>
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Reference Image */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Reference Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted">
                <img
                  src={zone.referenceImage || "/placeholder.svg"}
                  alt={`${zone.name} reference`}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Current Progress: <span className="font-medium text-foreground">{zone.progress}%</span>
              </p>
            </CardContent>
          </Card>

          {/* Upload Area */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">{"Today's Photo"}</CardTitle>
            </CardHeader>
            <CardContent>
              {uploadedImage ? (
                <div className="space-y-4">
                  <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted relative">
                    <img
                      src={uploadedImage || "/placeholder.svg"}
                      alt="Today's progress"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setUploadedImage(null)
                        setAnalysisResult(null)
                      }}
                    >
                      Change Photo
                    </Button>
                  </div>
                  {!analysisResult && (
                    <Button
                      onClick={analyzeProgress}
                      disabled={isAnalyzing}
                      className="w-full bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Analyze Progress
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ) : (
                <div
                  className={`aspect-[4/3] rounded-lg border-2 border-dashed transition-colors flex flex-col items-center justify-center cursor-pointer ${
                    isDragging ? "border-accent bg-accent/5" : "border-muted-foreground/25 hover:border-accent/50"
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => document.getElementById("file-upload")?.click()}
                >
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file)
                    }}
                  />
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    {isDragging ? (
                      <Upload className="w-8 h-8 text-accent" />
                    ) : (
                      <Camera className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground text-center px-4">
                    <span className="font-medium text-foreground">Click to upload</span> or drag and drop
                    <br />
                    PNG, JPG up to 10MB
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                AI Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-muted/50 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-2">Estimated Progress</p>
                  <p className="text-5xl font-bold text-accent">{analysisResult.percentComplete}%</p>
                </div>
                <div className="text-center p-6 bg-muted/50 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-2">Confidence Level</p>
                  <Badge
                    className={`text-lg px-4 py-1 ${
                      analysisResult.confidence === "high"
                        ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                        : analysisResult.confidence === "medium"
                          ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
                          : "bg-red-500/10 text-red-600 hover:bg-red-500/20"
                    }`}
                  >
                    {analysisResult.confidence.charAt(0).toUpperCase() + analysisResult.confidence.slice(1)}
                  </Badge>
                </div>
                <div className="text-center p-6 bg-muted/50 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-2">Change from Previous</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    +{analysisResult.percentComplete - zone.progress}%
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Visible Completed
                  </h4>
                  <ul className="space-y-2">
                    {analysisResult.visibleCompleted.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <X className="w-4 h-4 text-amber-600" />
                    Still Missing
                  </h4>
                  <ul className="space-y-2">
                    {analysisResult.stillMissing.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <Button onClick={handleSave} className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
                  <Check className="w-4 h-4" />
                  Save Check-in
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
