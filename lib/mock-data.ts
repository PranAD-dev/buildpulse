import type { Project, Zone } from "./types"

export const mockProjects: Project[] = [
  {
    id: "1",
    name: "Downtown Office Tower",
    targetDate: "2026-06-15",
    overallProgress: 67,
    status: "on-track",
    daysUntilDeadline: 150,
    lastUpdated: "2 hours ago",
    estimatedCompletion: "2026-06-10",
    totalBudget: 45000000,
    dailyDelayCost: 28500,
    zones: [
      {
        id: "z1",
        name: "Foundation",
        progress: 100,
        referenceImage: "/construction-foundation-concrete.jpg",
        x: 20,
        y: 80,
        model3dUrl: "/assets/3d/duck.glb",
      },
      {
        id: "z2",
        name: "Steel Frame",
        progress: 85,
        referenceImage: "/steel-frame-construction-building.jpg",
        x: 50,
        y: 50,
      },
      {
        id: "z3",
        name: "Exterior Walls",
        progress: 45,
        referenceImage: "/building-exterior-walls-construction.jpg",
        x: 30,
        y: 30,
      },
      {
        id: "z4",
        name: "Roofing",
        progress: 20,
        referenceImage: "/commercial-building-roofing-construction.jpg",
        x: 70,
        y: 20,
      },
    ],
    progressHistory: [
      { date: "2025-10-01", progress: 15 },
      { date: "2025-11-01", progress: 28 },
      { date: "2025-12-01", progress: 42 },
      { date: "2026-01-01", progress: 55 },
      { date: "2026-01-16", progress: 67 },
    ],
  },
  {
    id: "2",
    name: "Riverside Apartments",
    targetDate: "2026-04-01",
    overallProgress: 34,
    status: "behind",
    daysUntilDeadline: 75,
    lastUpdated: "1 day ago",
    estimatedCompletion: "2026-05-15",
    totalBudget: 32000000,
    dailyDelayCost: 18750,
    zones: [
      {
        id: "z5",
        name: "Building A Foundation",
        progress: 100,
        referenceImage: "/apartment-foundation-construction.jpg",
        x: 25,
        y: 75,
        model3dUrl: "/assets/3d/duck.glb",
      },
      {
        id: "z6",
        name: "Building A Structure",
        progress: 40,
        referenceImage: "/apartment-structure-framework.jpg",
        x: 25,
        y: 45,
      },
      {
        id: "z7",
        name: "Building B Foundation",
        progress: 60,
        referenceImage: "/residential-building-foundation.jpg",
        x: 75,
        y: 75,
      },
      {
        id: "z8",
        name: "Parking Structure",
        progress: 10,
        referenceImage: "/parking-garage-construction.jpg",
        x: 50,
        y: 85,
      },
    ],
    progressHistory: [
      { date: "2025-10-01", progress: 5 },
      { date: "2025-11-01", progress: 12 },
      { date: "2025-12-01", progress: 20 },
      { date: "2026-01-01", progress: 28 },
      { date: "2026-01-16", progress: 34 },
    ],
  },
  {
    id: "3",
    name: "Community Center",
    targetDate: "2026-03-01",
    overallProgress: 82,
    status: "on-track",
    daysUntilDeadline: 44,
    lastUpdated: "5 hours ago",
    estimatedCompletion: "2026-02-20",
    totalBudget: 8500000,
    dailyDelayCost: 6200,
    zones: [
      {
        id: "z9",
        name: "Main Hall",
        progress: 90,
        referenceImage: "/community-center-main-hall-construction.jpg",
        x: 50,
        y: 50,
        model3dUrl: "/assets/3d/duck.glb",
      },
      {
        id: "z10",
        name: "Kitchen Area",
        progress: 75,
        referenceImage: "/commercial-kitchen-construction.jpg",
        x: 80,
        y: 60,
      },
      {
        id: "z11",
        name: "Landscaping",
        progress: 65,
        referenceImage: "/landscaping-construction-outdoor.jpg",
        x: 30,
        y: 90,
      },
    ],
    progressHistory: [
      { date: "2025-10-01", progress: 35 },
      { date: "2025-11-01", progress: 52 },
      { date: "2025-12-01", progress: 68 },
      { date: "2026-01-01", progress: 76 },
      { date: "2026-01-16", progress: 82 },
    ],
  },
]

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
