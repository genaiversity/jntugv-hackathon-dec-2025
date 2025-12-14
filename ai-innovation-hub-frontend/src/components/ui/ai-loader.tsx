import { cn } from "@/lib/utils"

interface AILoaderProps {
  className?: string
  text?: string
}

export function AILoader({ className, text }: AILoaderProps) {
  const displayText = text ?? "Generating Innovation..."

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className="ai-loader">
        <div className="ai-loader-dot"></div>
        <div className="ai-loader-dot"></div>
        <div className="ai-loader-dot"></div>
        <div className="ai-loader-dot"></div>
      </div>
      {displayText && (
        <p className="text-sm text-muted-foreground animate-pulse">{displayText}</p>
      )}
    </div>
  )
}
