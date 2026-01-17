import type { Project, Zone } from "./types"

export const mockProjects: Project[] = []

export function getProjectById(id: string): Project | undefined {
  return mockProjects.find((p) => p.id === id)
}

export function getZoneById(zoneId: string): { zone: Zone; project: Project } | undefined {
  for (const project of mockProjects) {
    const zone = project.zones.find((z) => z.id === zoneId)
    if (zone) {
      return { zone, project }
    }
  }
  return undefined
}
