"use client"

import type React from "react"

import { useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ArrowRight, Upload, X, Check, Loader2, Box, Home } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface InteriorRoom {
  id: string
  name: string
  images: { id: string; data: string }[]
}

export default function NewProjectPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isCreating, setIsCreating] = useState(false)

  // Step 1: Project details
  const [projectName, setProjectName] = useState("")
  const [targetDate, setTargetDate] = useState("")
  const [budget, setBudget] = useState("")

  // Step 2: 3D Model or Images
  const [uploadType, setUploadType] = useState<"model" | "images">("model")
  const [model3D, setModel3D] = useState<string | null>(null)

  // Images mode
  const [interiorRooms, setInteriorRooms] = useState<InteriorRoom[]>([])
  const [currentRoomName, setCurrentRoomName] = useState("")
  const [currentRoomImages, setCurrentRoomImages] = useState<{ id: string; data: string }[]>([])
  const [exteriorImages, setExteriorImages] = useState<{ id: string; data: string }[]>([])
  const [isAddingRoom, setIsAddingRoom] = useState(false)

  // Step 3: Reference image
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handle3DModelUpload = useCallback((file: File) => {
    if (file && (file.name.endsWith('.glb') || file.name.endsWith('.gltf'))) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setModel3D(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const handleRoomImageUpload = useCallback((files: FileList) => {
    const newImages = Array.from(files).map((file) => {
      return new Promise<{ id: string; data: string }>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          resolve({
            id: `img-${Date.now()}-${Math.random()}`,
            data: e.target?.result as string
          })
        }
        reader.readAsDataURL(file)
      })
    })

    Promise.all(newImages).then((images) => {
      setCurrentRoomImages([...currentRoomImages, ...images])
    })
  }, [currentRoomImages])

  const handleExteriorImageUpload = useCallback((files: FileList) => {
    const newImages = Array.from(files).map((file) => {
      return new Promise<{ id: string; data: string }>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          resolve({
            id: `ext-${Date.now()}-${Math.random()}`,
            data: e.target?.result as string
          })
        }
        reader.readAsDataURL(file)
      })
    })

    Promise.all(newImages).then((images) => {
      setExteriorImages([...exteriorImages, ...images])
    })
  }, [exteriorImages])

  const saveCurrentRoom = () => {
    if (currentRoomName.trim() && currentRoomImages.length > 0) {
      setInteriorRooms([
        ...interiorRooms,
        {
          id: `room-${Date.now()}`,
          name: currentRoomName,
          images: currentRoomImages
        }
      ])
      setCurrentRoomName("")
      setCurrentRoomImages([])
      setIsAddingRoom(false)
    }
  }

  const removeRoom = (id: string) => {
    setInteriorRooms(interiorRooms.filter(r => r.id !== id))
  }

  const removeRoomImage = (imageId: string) => {
    setCurrentRoomImages(currentRoomImages.filter(img => img.id !== imageId))
  }

  const removeExteriorImage = (imageId: string) => {
    setExteriorImages(exteriorImages.filter(img => img.id !== imageId))
  }

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

  const canProceedStep1 = projectName.trim() && targetDate
  const canProceedStep2 = uploadType === "model"
    ? model3D !== null
    : (interiorRooms.length > 0 || exteriorImages.length > 0)

  // For 3D model: can create after step 2
  // For images: need reference image in step 3
  const canCreate = uploadType === "model" ? canProceedStep2 : referenceImage !== null

  const handleCreate = async () => {
    setIsCreating(true)

    try {
      // Step 1: For 3D models, store data URL directly (avoid Supabase 50MB limit)
      // In production, you'd use a dedicated file storage service
      let modelUrl: string | null = null
      if (uploadType === 'model' && model3D) {
        // Just use the data URL directly for now (stored in browser/DB)
        modelUrl = model3D
      }

      // Step 2: Create project
      const projectResponse = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          reference_type: uploadType === 'model' ? '3d_model' : 'images',
          model_url: modelUrl,
          target_completion_date: targetDate,
          budget: budget ? parseFloat(budget) : 0,
        }),
      })

      if (!projectResponse.ok) {
        throw new Error('Failed to create project')
      }

      const project = await projectResponse.json()

      // Step 3: Create rooms if in images mode
      if (uploadType === 'images') {
        // Create interior rooms
        for (const room of interiorRooms) {
          // Use first image as reference (store data URL directly for hackathon)
          const firstImage = room.images[0]
          if (firstImage) {
            // Create room with data URL (for hackathon - production would use proper storage)
            await fetch('/api/rooms', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                project_id: project.id,
                name: room.name,
                reference_image_url: firstImage.data,
              }),
            })
          }
        }
      }

      // Success - redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project. Please try again.')
      setIsCreating(false)
    }
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

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {/* Show 2 steps for 3D model, 3 steps for images */}
          {(uploadType === "model" ? [1, 2] : [1, 2, 3]).map((s, idx, arr) => (
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
              {idx < arr.length - 1 && <div className={`w-16 h-0.5 ${step > s ? "bg-primary" : "bg-muted"}`} />}
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
              <div className="space-y-2">
                <Label htmlFor="budget">Project Budget ($)</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="e.g., 1500000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
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

        {/* Step 2: 3D Model or Images */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Completed House Visualization</CardTitle>
              <CardDescription>Choose to upload a 3D model or images of the completed house</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs value={uploadType} onValueChange={(v) => setUploadType(v as "model" | "images")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="model">3D Model</TabsTrigger>
                  <TabsTrigger value="images">Images</TabsTrigger>
                </TabsList>

                {/* 3D Model Upload */}
                <TabsContent value="model" className="space-y-4">
                  {model3D ? (
                    <div className="space-y-4">
                      <div className="p-8 rounded-lg bg-muted/50 border border-border flex flex-col items-center justify-center">
                        <Box className="w-16 h-16 text-accent mb-4" />
                        <p className="text-sm font-medium text-foreground">3D Model Uploaded</p>
                        <p className="text-xs text-muted-foreground">GLB/GLTF file ready</p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setModel3D(null)}
                        className="w-full"
                      >
                        Change Model
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-accent/50 transition-colors flex flex-col items-center justify-center cursor-pointer"
                      onClick={() => document.getElementById("model-upload")?.click()}
                    >
                      <input
                        id="model-upload"
                        type="file"
                        accept=".glb,.gltf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handle3DModelUpload(file)
                        }}
                      />
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Box className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground text-center px-4">
                        <span className="font-medium text-foreground">Click to upload 3D model</span>
                        <br />
                        GLB or GLTF format
                      </p>
                    </div>
                  )}
                </TabsContent>

                {/* Images Upload */}
                <TabsContent value="images" className="space-y-6">
                  {/* Interior Rooms */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-foreground">Interior Rooms</h4>
                        <p className="text-xs text-muted-foreground">Add photos for each room</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setIsAddingRoom(true)}
                        className="bg-accent hover:bg-accent/90 text-accent-foreground"
                      >
                        Add Room
                      </Button>
                    </div>

                    {/* Add New Room */}
                    {isAddingRoom && (
                      <Card className="border-accent/50">
                        <CardContent className="pt-6 space-y-4">
                          <Input
                            placeholder="Room name (e.g., Kitchen, Living Room)"
                            value={currentRoomName}
                            onChange={(e) => setCurrentRoomName(e.target.value)}
                          />

                          <div>
                            <input
                              id="room-images"
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files) handleRoomImageUpload(e.target.files)
                              }}
                            />
                            <Button
                              variant="outline"
                              onClick={() => document.getElementById("room-images")?.click()}
                              className="w-full"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Images
                            </Button>
                          </div>

                          {currentRoomImages.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                              {currentRoomImages.map((img) => (
                                <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden group">
                                  <img src={img.data} alt="Room" className="w-full h-full object-cover" />
                                  <button
                                    onClick={() => removeRoomImage(img.id)}
                                    className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button
                              onClick={saveCurrentRoom}
                              disabled={!currentRoomName.trim() || currentRoomImages.length === 0}
                              className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                            >
                              Save Room
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsAddingRoom(false)
                                setCurrentRoomName("")
                                setCurrentRoomImages([])
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Saved Rooms List */}
                    {interiorRooms.length > 0 && (
                      <div className="space-y-2">
                        {interiorRooms.map((room) => (
                          <div key={room.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Home className="w-4 h-4 text-accent" />
                              <div>
                                <p className="text-sm font-medium text-foreground">{room.name}</p>
                                <p className="text-xs text-muted-foreground">{room.images.length} images</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => removeRoom(room.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Exterior Images */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-1">Exterior Images</h4>
                      <p className="text-xs text-muted-foreground">Upload photos of the building exterior</p>
                    </div>

                    <div>
                      <input
                        id="exterior-images"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) handleExteriorImageUpload(e.target.files)
                        }}
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById("exterior-images")?.click()}
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Exterior Images
                      </Button>
                    </div>

                    {exteriorImages.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {exteriorImages.map((img) => (
                          <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden group">
                            <img src={img.data} alt="Exterior" className="w-full h-full object-cover" />
                            <button
                              onClick={() => removeExteriorImage(img.id)}
                              className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-2 bg-transparent">
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </Button>
                {uploadType === "model" ? (
                  <Button
                    onClick={handleCreate}
                    disabled={!canProceedStep2 || isCreating}
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
                ) : (
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!canProceedStep2}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
                  >
                    Next Step
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Reference Image (only for images mode) */}
        {step === 3 && uploadType === "images" && (
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
