'use client'

import { useEffect, useState } from 'react'
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ProjectCard } from "@/components/dashboard/project-card"
import { EmptyState } from "@/components/dashboard/empty-state"
import { FloatingBackground } from "@/components/3d/floating-background"
import { Loader2 } from 'lucide-react'
import type { Project } from '@/lib/supabase'

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadProjects() {
      try {
        const response = await fetch('/api/projects')
        if (response.ok) {
          const data = await response.json()
          setProjects(data)
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
