import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AuthButton } from "@/components/auth/auth-button"

export function DashboardHeader() {
  return (
    <header className="bg-background border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="BuildPulse Logo"
            width={36}
            height={36}
            className="w-9 h-9"
          />
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
