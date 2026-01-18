import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Building2, Plus } from "lucide-react"
import { AuthButton } from "@/components/auth/auth-button"

export function DashboardHeader() {
  return (
    <header className="bg-background border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg text-primary">BuildPulse</span>
        </Link>
        <div className="flex items-center gap-4">
          <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
            <Link href="/new">
              <Plus className="w-4 h-4" />
              New Project
            </Link>
          </Button>
          <AuthButton />
        </div>
      </div>
    </header>
  )
}
