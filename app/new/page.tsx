"use client"

import type React from "react"

import { useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ArrowRight, Upload, MapPin, X, Check, Loader2 } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"

interface ZoneMarker {
  id: string
  name: string
  x: number
  y: number
}

export default function NewProjectPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isCreating, setIsCreating] = useState(false)

  // Step 1: Project details
  const [projectName, setProjectName] = useState("")
  const [targetDate, setTargetDate] = useState("")

  // Step 2: Reference image
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Step 3: Zone markers
  const [zones, setZones] = useState<ZoneMarker[]>([])
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null)
  const [tempZoneName, setTempZoneName] = useState("")

  const handleFileUpload = useCallback((file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setReferenceImage(e.target?.result as string)
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

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (step !== 3 || !referenceImage) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const newZone: ZoneMarker = {
      id: `zone-${Date.now()}`,
      name: "",
      x,
      y,
    }

    setZones([...zones, newZone])
    setEditingZoneId(newZone.id)
    setTempZoneName("")
  }

  const saveZoneName = () => {
    if (editingZoneId && tempZoneName.trim()) {
      setZones(zones.map((z) => (z.id === editingZoneId ? { ...z, name: tempZoneName.trim() } : z)))
      setEditingZoneId(null)
      setTempZoneName("")
    }
  }

  const removeZone = (id: string) => {
    setZones(zones.filter((z) => z.id !== id))
    if (editingZoneId === id) {
      setEditingZoneId(null)
      setTempZoneName("")
    }
  }

  const canProceedStep1 = projectName.trim() && targetDate
  const canProceedStep2 = referenceImage
  const canCreate = zones.length > 0 && zones.every((z) => z.name.trim())

  const handleCreate = async () => {
    setIsCreating(true)
    // Simulate project creation
    await new Promise((resolve) => setTimeout(resolve, 1500))
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <DashboardHeader />
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Button asChild variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step === s
                    ? "bg-accent text-accent-foreground"
                    : step > s
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 3 && <div className={`w-16 h-0.5 ${step > s ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Project Details */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>Enter basic information about your construction project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  placeholder="e.g., Downtown Office Tower"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-date">Target Completion Date</Label>
                <Input
                  id="target-date"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
                >
                  Next Step
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Reference Image */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Reference Image</CardTitle>
              <CardDescription>Upload an image of your construction site or project plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {referenceImage ? (
                <div className="space-y-4">
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted relative">
                    <img
                      src={referenceImage || "/placeholder.svg"}
                      alt="Reference"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2"
                      onClick={() => setReferenceImage(null)}
                    >
                      Change Image
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className={`aspect-video rounded-lg border-2 border-dashed transition-colors flex flex-col items-center justify-center cursor-pointer ${
                    isDragging ? "border-accent bg-accent/5" : "border-muted-foreground/25 hover:border-accent/50"
                  }`}
                  onDrop={handleDrop}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    setIsDragging(false)
                  }}
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
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center px-4">
                    <span className="font-medium text-foreground">Click to upload</span> or drag and drop
                    <br />
                    PNG, JPG up to 10MB
                  </p>
                </div>
              )}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-2 bg-transparent">
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!canProceedStep2}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
                >
                  Next Step
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Define Zones */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Define Project Zones</CardTitle>
              <CardDescription>Click on the image to place markers for each zone you want to track</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                className="aspect-video rounded-lg overflow-hidden bg-muted relative cursor-crosshair"
                onClick={handleImageClick}
              >
                {referenceImage && (
                  <img
                    src={referenceImage || "/placeholder.svg"}
                    alt="Reference"
                    className="w-full h-full object-cover pointer-events-none"
                  />
                )}
                {zones.map((zone) => (
                  <div
                    key={zone.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shadow-lg border-2 border-accent-foreground/30">
                        <MapPin className="w-4 h-4 text-accent-foreground" />
                      </div>
                      {zone.name && (
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-card border border-border rounded-md px-2 py-1 shadow-lg whitespace-nowrap">
                          <span className="text-xs font-medium text-foreground">{zone.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Zone Editor */}
              {editingZoneId && (
                <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                  <MapPin className="w-4 h-4 text-accent flex-shrink-0" />
                  <Input
                    placeholder="Zone name (e.g., Foundation)"
                    value={tempZoneName}
                    onChange={(e) => setTempZoneName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveZoneName()}
                    autoFocus
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={saveZoneName}
                    disabled={!tempZoneName.trim()}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => removeZone(editingZoneId)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Zone List */}
              {zones.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Defined Zones ({zones.length})</h4>
                  <div className="space-y-2">
                    {zones
                      .filter((z) => z.name)
                      .map((zone) => (
                        <div key={zone.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-accent" />
                            <span className="text-sm font-medium text-foreground">{zone.name}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeZone(zone.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)} className="gap-2 bg-transparent">
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!canCreate || isCreating}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Project"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
