import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Link from "next/link"
import "./globals.css"
import { FloatingChatBot } from "@/components/FloatingChatBot"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AI Innovation Hub",
  description: "Transform raw ideas into validated mini-startup concepts using AI",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-background antialiased overflow-x-hidden`}>
        <div className="relative flex min-h-screen flex-col w-full max-w-full overflow-x-hidden">
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="h-1 w-full animate-gradient"></div>
            <div className="container flex h-14 items-center">
              <Link href="/" className="flex items-center space-x-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 text-primary"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                <span className="font-bold">AI Innovation Hub</span>
              </Link>
              <nav className="ml-auto flex items-center space-x-4">
                <Link
                  href="/"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  Home
                </Link>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  Dashboard
                </Link>
                <Link
                  href="/new"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  New Project
                </Link>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <FloatingChatBot />
          <footer className="border-t py-6 md:py-0">
            <div className="container flex h-14 items-center justify-center text-sm text-muted-foreground">
              AI Innovation Hub - Transform ideas into startups
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
