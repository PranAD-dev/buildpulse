import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { AuthButton } from "@/components/auth/auth-button"

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
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
        <nav className="hidden md:flex items-center gap-6">
          <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Features
          </Link>
          <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            How It Works
          </Link>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Dashboard
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/dashboard">Get Started</Link>
          </Button>
          <AuthButton />
        </div>
      </div>
    </header>
  )
}
