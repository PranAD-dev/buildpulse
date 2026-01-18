"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileVideo, Loader2, CheckCircle2, XCircle, Play } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface GenerateReportButtonProps {
  projectId: string
  projectName: string
  existingVideoUrl?: string | null
}

type ReportStatus = "idle" | "generating" | "completed" | "failed"

export function GenerateReportButton({ projectId, projectName, existingVideoUrl }: GenerateReportButtonProps) {
  const [isGenerateOpen, setIsGenerateOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [status, setStatus] = useState<ReportStatus>("idle")
  const [progress, setProgress] = useState(0)
  const [videoUrl, setVideoUrl] = useState<string | null>(existingVideoUrl || null)
  const [error, setError] = useState<string | null>(null)

  const pollStatus = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/report?videoId=${id}&projectId=${projectId}`)
      const data = await response.json()

      if (data.status === "completed" && data.videoUrl) {
        setStatus("completed")
        setVideoUrl(data.videoUrl)
        setProgress(100)
      } else if (data.status === "failed") {
        setStatus("failed")
        setError(data.message || "Video generation failed")
      } else {
        setProgress(data.progress || 0)
        // Continue polling
        setTimeout(() => pollStatus(id), 5000)
      }
    } catch (err) {
      console.error("Status poll error:", err)
      // Retry on error
      setTimeout(() => pollStatus(id), 10000)
    }
  }, [projectId])

  const handleGenerate = async () => {
    setStatus("generating")
    setProgress(0)
    setError(null)
    setIsGenerateOpen(true)

    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      })

      const data = await response.json()

      if (data.success && data.videoId) {
        // Start polling for status
        pollStatus(data.videoId)
      } else {
        setStatus("failed")
        setError(data.error || "Failed to start video generation")
      }
    } catch (err: any) {
      setStatus("failed")
      setError(err.message || "Failed to generate report")
    }
  }

  const handleGenerateClose = () => {
    if (status !== "generating") {
      setIsGenerateOpen(false)
      // Reset state after a delay
      setTimeout(() => {
        setStatus("idle")
        setProgress(0)
        setError(null)
      }, 300)
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          onClick={handleGenerate}
          className="gap-2"
          variant="outline"
        >
          <FileVideo className="w-4 h-4" />
          Generate Report
        </Button>

        {(videoUrl || existingVideoUrl) && (
          <Button
            onClick={() => setIsViewOpen(true)}
            className="gap-2"
            variant="default"
          >
            <Play className="w-4 h-4" />
            View Report
          </Button>
        )}
      </div>

      {/* Generate Dialog */}
      <Dialog open={isGenerateOpen} onOpenChange={handleGenerateClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileVideo className="w-5 h-5" />
              Generating Report
            </DialogTitle>
            <DialogDescription>
              AI-generated video report for {projectName}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            {status === "generating" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <Loader2 className="w-12 h-12 text-accent animate-spin" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    Generating your video report...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This may take a few minutes.
                  </p>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  {progress}% complete
                </p>
              </div>
            )}

            {status === "completed" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    Report generated successfully!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Click "View Report" to watch your video.
                  </p>
                </div>
                <div className="flex justify-center">
                  <Button onClick={() => { handleGenerateClose(); setIsViewOpen(true); }} className="gap-2">
                    <Play className="w-4 h-4" />
                    View Report
                  </Button>
                </div>
              </div>
            )}

            {status === "failed" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-destructive" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    Report generation failed
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {error || "An unexpected error occurred."}
                  </p>
                </div>
                <div className="flex justify-center">
                  <Button onClick={handleGenerate} variant="outline" className="gap-2">
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* View Report Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              Shareholder Report - {projectName}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {(videoUrl || existingVideoUrl) ? (
              <video
                controls
                autoPlay
                className="w-full rounded-lg"
                src={videoUrl || existingVideoUrl || ''}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <p>No report available. Generate one first.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
