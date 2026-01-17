import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FolderOpen, Plus } from "lucide-react"

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
        <FolderOpen className="w-10 h-10 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">No projects yet</h2>
      <p className="text-muted-foreground text-center max-w-sm mb-6">
        Create your first project to start tracking construction progress with AI-powered analysis.
      </p>
      <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
        <Link href="/new">
          <Plus className="w-4 h-4" />
          Create Your First Project
        </Link>
      </Button>
    </div>
  )
}
