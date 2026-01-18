'use client'

import { useEffect, useState } from 'react'
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ProjectCard } from "@/components/dashboard/project-card"
import { EmptyState } from "@/components/dashboard/empty-state"
import { FloatingBackground } from "@/components/3d/floating-background"
import { Loader2 } from 'lucide-react'
import type { Project } from '@/lib/supabase'

// Extended project type with delay status
interface ProjectWithDelayStatus extends Project {
  isDelayed?: boolean
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectWithDelayStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadProjects() {
      try {
        const response = await fetch('/api/projects')
        if (response.ok) {
          const data: Project[] = await response.json()

          // Fetch zone counts for each project to determine delay status
          const projectsWithDelayStatus = await Promise.all(
            data.map(async (project) => {
              try {
                const zonesRes = await fetch(`/api/rooms?project_id=${project.id}`)
                const zones = zonesRes.ok ? await zonesRes.json() : []
                const zoneCount = zones?.length || 0

                // Check delay conditions: deadline <= 1 day AND has zones
                const daysUntilDeadline = project.target_completion_date
                  ? Math.ceil((new Date(project.target_completion_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  : null

                const isDelayed = daysUntilDeadline !== null && daysUntilDeadline <= 1 && zoneCount > 0

                return { ...project, isDelayed }
              } catch {
                return { ...project, isDelayed: false }
              }
            })
          )

          setProjects(projectsWithDelayStatus)
        }
      } catch (error) {
        console.error('Failed to load projects:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProjects()
  }, [])

  return (
    <div className="min-h-screen relative">
      <FloatingBackground />
      <div className="relative z-10 bg-background/50 backdrop-blur-sm min-h-screen">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">Your Projects</h1>
          <p className="text-muted-foreground">Track and manage your construction progress</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
        </main>
      </div>
    </div>
  )
}
