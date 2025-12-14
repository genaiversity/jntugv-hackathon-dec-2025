"use client"

import { useCallback, useEffect, useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Download, 
  Play, 
  RefreshCw,
  CheckCircle2,
  Circle,
  Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import { 
  ProjectDetail, 
  Phase, 
  PhaseType, 
  PHASE_ORDER, 
  PHASE_LABELS, 
  PHASE_DESCRIPTIONS,
  ARTIFACT_LABELS,
  Artifact,
} from "@/types"
import { AILoader } from "@/components/ui/ai-loader"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ProjectPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const projectId = parseInt(id)
  
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState<PhaseType | null>(null)
  const [exporting, setExporting] = useState(false)
  const [activePhase, setActivePhase] = useState<PhaseType>("ideation")
  const [customInstructions, setCustomInstructions] = useState("")
  // artifact_type -> artifact.id mapping for final spec selection
  const [selectedFinalArtifacts, setSelectedFinalArtifacts] = useState<Record<string, number>>({})

  // File-by-file code generator session info (used to drive Code Generator phase status)
  const [codegenFilesCount, setCodegenFilesCount] = useState(0)

  const loadProject = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.projects.get(projectId)
      setProject(data)
      setError(null)

      // Best-effort: determine if the file-by-file code generator already has files.
      // This lets us mark the Code Generator phase as completed even when the phase-based
      // artifact isn't used.
      try {
        const latest = await api.codegen.latestSession(projectId)
        if (latest) {
          const detail = await api.codegen.getSession(latest.id)
          setCodegenFilesCount(detail.files.length)
        } else {
          setCodegenFilesCount(0)
        }
      } catch {
        setCodegenFilesCount(0)
      }

      // Set active phase to first incomplete or last completed
      const firstIncomplete = PHASE_ORDER.find(pt => {
        const phase = data.phases.find(p => p.phase_type === pt)
        return phase?.status !== "completed"
      })
      if (firstIncomplete) {
        setActivePhase(firstIncomplete)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project")
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadProject()
  }, [loadProject])

  // Provide active project context to the floating bot.
  useEffect(() => {
    if (!project) return
    try {
      const summary = {
        id: project.id,
        name: project.name,
        description: project.description,
        user_type: project.user_type,
        constraints: project.constraints,
        skills: project.skills,
        time_available: project.time_available,
      }
      localStorage.setItem("aih:activeProject", JSON.stringify(summary, null, 2))
    } catch {
      // ignore
    }
  }, [project])

  async function handleGenerate(phaseType: PhaseType, regenerate = false) {
    try {
      setGenerating(phaseType)
      await api.phases.generate(projectId, phaseType, {
        regenerate,
        custom_instructions: customInstructions.trim() || undefined
      })
      await loadProject()
      setCustomInstructions("")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to generate phase")
    } finally {
      setGenerating(null)
    }
  }

  async function handleExport(format: "markdown" | "pdf" | "docx") {
    try {
      setExporting(true)

      const safeName = project?.name.replace(/\s+/g, "_") ?? "project"
      const baseFilename = `${safeName}_spec`

      if (format === "markdown") {
        const result = await api.projects.export(projectId)
        // Download as markdown file (Notion-friendly full spec)
        const blob = new Blob([result.content], { type: "text/markdown" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${baseFilename}.md`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        const response = await fetch(
          `${apiBase}/projects/${projectId}/export-file?format=${format}`
        )
        if (!response.ok) {
          throw new Error(`Export failed with status ${response.status}`)
        }

        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${baseFilename}.${format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to export project")
    } finally {
      setExporting(false)
    }
  }

  async function handleArtifactDownload(artifact: Artifact, format: "markdown" | "pdf" | "docx") {
    try {
      if (!project) {
        throw new Error("Project not loaded")
      }
      const safeProjectName = project.name.replace(/\s+/g, "_")
      const safeArtifactType = artifact.artifact_type.replace(/\s+/g, "_")
      const baseFilename = `${safeProjectName}_${safeArtifactType}_v${artifact.version}`

      if (format === "markdown") {
        const header = `${project.name} - ${ARTIFACT_LABELS[artifact.artifact_type]} (v${artifact.version})`
        const content = `# ${header}\n\n${artifact.content}\n`
        const blob = new Blob([content], { type: "text/markdown" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${baseFilename}.md`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        return
      }

      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const response = await fetch(`${apiBase}/artifacts/${artifact.id}/export?format=${format}`)
      if (!response.ok) {
        throw new Error(`Export failed with status ${response.status}`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${baseFilename}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to export artifact")
    }
  }

  async function handleFinalExport(format: "markdown" | "pdf" | "docx") {
    try {
      const ids = Object.values(selectedFinalArtifacts)
      if (ids.length === 0) {
        alert("Select at least one artifact variant to include in the final spec.")
        return
      }

      setExporting(true)

      const safeName = project?.name.replace(/\s+/g, "_") ?? "project"
      const baseFilename = `${safeName}_final_spec`
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

      const response = await fetch(`${apiBase}/projects/${projectId}/export-custom`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ artifact_ids: ids, format }),
      })

      if (!response.ok) {
        throw new Error(`Export failed with status ${response.status}`)
      }

      if (format === "markdown") {
        const data = await response.json()
        const blob = new Blob([data.content], { type: "text/markdown" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${baseFilename}.md`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${baseFilename}.${format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to export final spec")
    } finally {
      setExporting(false)
    }
  }

  function getPhaseStatus(phaseType: PhaseType): "pending" | "in_progress" | "completed" {
    const phase = project?.phases.find(p => p.phase_type === phaseType)
    const base = (phase?.status as "pending" | "in_progress" | "completed") || "pending"

    // If the user generated code using the file-by-file code generator, the backend phase
    // status may still be pending. Treat it as completed once any files exist.
    if (phaseType === "code_generation") {
      const hasPhaseArtifact = (phase?.artifacts?.length || 0) > 0
      if (base === "completed" || hasPhaseArtifact || codegenFilesCount > 0) {
        return "completed"
      }
      return base
    }

    return base
  }

  function getPhase(phaseType: PhaseType): Phase | undefined {
    return project?.phases.find(p => p.phase_type === phaseType)
  }

  function getCompletedCount(): number {
    return PHASE_ORDER.filter((pt) => getPhaseStatus(pt) === "completed").length
  }

  function getProgressPercentage(): number {
    return (getCompletedCount() / PHASE_ORDER.length) * 100
  }

  function canGenerate(phaseType: PhaseType): boolean {
    // Final spec does not depend on code generation; it's a documentation artifact.
    // Allow generating it as soon as Tech Build is completed.
    if (phaseType === "final_spec") {
      return getPhaseStatus("tech_build") === "completed"
    }

    const phaseIndex = PHASE_ORDER.indexOf(phaseType)
    if (phaseIndex === 0) return true

    // Check if previous phase is completed
    const prevPhaseType = PHASE_ORDER[phaseIndex - 1]
    return getPhaseStatus(prevPhaseType) === "completed"
  }

  async function handleDownloadCodeZip(artifactId?: number) {
    try {
      const safeName = project?.name.replace(/\s+/g, "_") ?? "project"
      const baseFilename = `${safeName}_code.zip`
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

      const response = await fetch(`${apiBase}/projects/${projectId}/codezip`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(artifactId ? { artifact_id: artifactId } : {}),
      })

      if (!response.ok) {
        let detail = "Failed to download ZIP"
        try {
          const data = await response.json()
          detail = data.detail || detail
        } catch {}
        throw new Error(detail)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = baseFilename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to download ZIP")
    }
  }

  type GeneratedAppJson = {
    files: { path: string; content: string }[]
    instructions?: string
  }

  function extractJsonFromContent(content: string): unknown | null {
    function tryParseJson(text: string): unknown | null {
      // Try direct JSON parse first
      try {
        return JSON.parse(text)
      } catch {
        // Continue
      }

      // Try to fix unescaped newlines in string values (common LLM issue)
      try {
        // Replace literal newlines with \n
        const fixed = text.replace(/(?<!\\)\n/g, '\\n')
        return JSON.parse(fixed)
      } catch {
        // Continue
      }

      return null
    }

    // Try direct parse
    let result = tryParseJson(content)
    if (result) return result

    // Try to extract JSON from markdown code block (```json ... ``` or ``` ... ```)
    const codeBlockPattern = /```(?:json)?\s*([\s\S]*?)```/g
    let match
    while ((match = codeBlockPattern.exec(content)) !== null) {
      result = tryParseJson(match[1].trim())
      if (result) return result
    }

    // Try to find JSON object pattern { ... } in the content
    const jsonPattern = /\{[\s\S]*\}/
    const jsonMatch = content.match(jsonPattern)
    if (jsonMatch) {
      result = tryParseJson(jsonMatch[0])
      if (result) return result
    }

    // Last resort: manually extract files from malformed JSON
    try {
      const files: { path: string; content: string }[] = []
      const pathRegex = /"path"\s*:\s*"([^"]+)"/g
      const paths: string[] = []
      let pathMatch
      while ((pathMatch = pathRegex.exec(content)) !== null) {
        paths.push(pathMatch[1])
      }

      // For each path, try to extract corresponding content
      for (const path of paths) {
        const pathIdx = content.indexOf(`"path": "${path}"`) || content.indexOf(`"path":"${path}"`)
        if (pathIdx === -1) continue

        const contentIdx = content.indexOf('"content"', pathIdx)
        if (contentIdx === -1) continue

        // Find the opening quote of content value
        const afterContent = content.slice(contentIdx + 10)
        const colonIdx = afterContent.indexOf(':')
        if (colonIdx === -1) continue

        const afterColon = afterContent.slice(colonIdx + 1).trimStart()
        if (!afterColon.startsWith('"')) continue

        // Extract content until we find closing pattern
        let escaped = false
        let endIdx = 1
        const restContent = afterColon.slice(1)

        for (let i = 0; i < restContent.length; i++) {
          const ch = restContent[i]
          if (escaped) {
            escaped = false
            continue
          }
          if (ch === '\\') {
            escaped = true
            continue
          }
          if (ch === '"') {
            endIdx = i
            break
          }
        }

        let fileContent = restContent.slice(0, endIdx)
        // Unescape
        fileContent = fileContent.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
        files.push({ path, content: fileContent })
      }

      if (files.length > 0) {
        return { files, instructions: "See README.md for setup instructions" }
      }
    } catch {
      // Continue
    }

    return null
  }

  function normalizeFileContent(content: string): string {
    // Convert escaped sequences to actual characters
    let normalized = content
    // Convert escaped newlines to real newlines
    normalized = normalized.replace(/\\n/g, '\n')
    // Convert escaped tabs to real tabs
    normalized = normalized.replace(/\\t/g, '\t')
    // Convert escaped quotes
    normalized = normalized.replace(/\\"/g, '"')
    // Convert escaped backslashes (do this last)
    normalized = normalized.replace(/\\\\/g, '\\')
    // Normalize line endings
    normalized = normalized.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    return normalized
  }

  function tryParseGeneratedApp(content: string): GeneratedAppJson | null {
    const parsed = extractJsonFromContent(content)
    if (!parsed || typeof parsed !== "object") return null
    const obj = parsed as Record<string, unknown>

    const filesVal = obj.files
    if (!Array.isArray(filesVal)) return null

    const sanitizedFiles = filesVal
      .filter((f): f is { path: string; content: string } => {
        if (!f || typeof f !== "object") return false
        const fileObj = f as Record<string, unknown>
        return typeof fileObj.path === "string" && typeof fileObj.content === "string"
      })
      .map((f) => ({ path: f.path, content: normalizeFileContent(f.content) }))

    const instructions = typeof obj.instructions === "string" ? normalizeFileContent(obj.instructions) : undefined
    return { files: sanitizedFiles, instructions }
  }

  if (loading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-96 mb-8" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-destructive mb-4">
            {error || "Project not found"}
          </div>
          <Button onClick={() => router.push("/")}>Back to Dashboard</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground mt-1">{project.description}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <Button
              onClick={() => handleExport("markdown")}
              disabled={exporting || getCompletedCount() === 0}
            >
              {exporting ? (
                <AILoader className="mr-2" text="" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              .md
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport("pdf")}
              disabled={exporting || getCompletedCount() === 0}
            >
              PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport("docx")}
              disabled={exporting || getCompletedCount() === 0}
            >
              DOCX
            </Button>
          </div>
          <span className="text-xs text-muted-foreground">Export full spec</span>
          <div className="mt-1 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleFinalExport("markdown")}
              disabled={exporting || getCompletedCount() === 0}
            >
              Final .md
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleFinalExport("pdf")}
              disabled={exporting || getCompletedCount() === 0}
            >
              Final PDF
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleFinalExport("docx")}
              disabled={exporting || getCompletedCount() === 0}
            >
              Final DOCX
            </Button>
          </div>
          <span className="text-xs text-muted-foreground">
            Using selected variants
          </span>
        </div>
      </div>

      {/* Progress */}
      <Card className="mb-8">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Progress</CardTitle>
            <span className="text-sm text-muted-foreground">
              {getCompletedCount()} of {PHASE_ORDER.length} phases completed
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={getProgressPercentage()} className="h-2" />
          <div className="flex justify-between mt-4">
            {PHASE_ORDER.map((phaseType, index) => {
              const status = getPhaseStatus(phaseType)
              return (
                <button
                  key={phaseType}
                  onClick={() => setActivePhase(phaseType)}
                  className={`flex flex-col items-center gap-1 text-xs transition-colors ${
                    activePhase === phaseType ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {status === "completed" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : status === "in_progress" ? (
                    <Clock className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                  <span className="hidden sm:block">{PHASE_LABELS[phaseType]}</span>
                  <span className="sm:hidden">{index + 1}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Phase Tabs */}
      <Tabs value={activePhase} onValueChange={(v) => setActivePhase(v as PhaseType)}>
        <TabsList className="grid grid-cols-3 lg:grid-cols-7 mb-6 w-full max-w-full">
          {PHASE_ORDER.map(phaseType => (
            <TabsTrigger key={phaseType} value={phaseType} className="text-xs sm:text-sm">
              {PHASE_LABELS[phaseType]}
            </TabsTrigger>
          ))}
        </TabsList>

        {PHASE_ORDER.map(phaseType => {
          const phase = getPhase(phaseType)
          const status = getPhaseStatus(phaseType)
          const isGenerating = generating === phaseType
          const canGen = canGenerate(phaseType)

          return (
            <TabsContent key={phaseType} value={phaseType}>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{PHASE_LABELS[phaseType]}</CardTitle>
                      <CardDescription>{PHASE_DESCRIPTIONS[phaseType]}</CardDescription>
                    </div>
                    <Badge
                      variant={
                        status === "completed"
                          ? "success"
                          : status === "in_progress"
                          ? "warning"
                          : "secondary"
                      }
                    >
                      {status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Custom Instructions */}
                  {canGen && phaseType !== "code_generation" && (
                    <div className="mb-6 space-y-2">
                      <Label htmlFor="custom-instructions">
                        Custom Instructions (optional)
                      </Label>
                      <Textarea
                        id="custom-instructions"
                        placeholder="Add specific instructions for this phase, e.g., 'Focus on mobile-first approach' or 'Target enterprise customers'"
                        value={customInstructions}
                        onChange={(e) => setCustomInstructions(e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>
                  )}

                  {phaseType === "code_generation" ? (
                    <div className="mb-6">
                      <Link href={`/projects/${projectId}/codegen`}>
                        <Button variant="outline" size="sm">
                          Open file-by-file code generator
                        </Button>
                      </Link>
                      <p className="mt-2 text-xs text-muted-foreground">
                        File-by-file generation is recommended for local models to avoid long-context JSON failures.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Generate Buttons */}
                      <div className="flex gap-2 mb-6">
                        {status !== "completed" && (
                          <Button
                            onClick={() => handleGenerate(phaseType)}
                            disabled={isGenerating || !canGen}
                          >
                            {isGenerating ? (
                              <AILoader className="mr-2" text="" />
                            ) : (
                              <Play className="mr-2 h-4 w-4" />
                            )}
                            Generate
                          </Button>
                        )}
                        {status === "completed" && (
                          <Button
                            variant="outline"
                            onClick={() => handleGenerate(phaseType, true)}
                            disabled={isGenerating}
                          >
                            {isGenerating ? (
                              <AILoader className="mr-2" text="" />
                            ) : (
                              <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                            Regenerate
                          </Button>
                        )}
                        {!canGen && status === "pending" && (
                          <p className="text-sm text-muted-foreground">
                            Complete the previous phase first
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {/* Artifacts */}
                  {phase && phase.artifacts.length > 0 ? (
                    phaseType === "code_generation" ? (
                      <div className="space-y-4">
                        {phase.artifacts.map((artifact) => {
                          const parsed = tryParseGeneratedApp(artifact.content)
                          return (
                            <Card key={artifact.id}>
                              <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <CardTitle className="text-base">
                                      {ARTIFACT_LABELS[artifact.artifact_type]} (v{artifact.version})
                                    </CardTitle>
                                    <Badge variant="outline" className="text-xs">
                                      {artifact.model_used}
                                    </Badge>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDownloadCodeZip(artifact.id)}
                                  >
                                    Download ZIP
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                {parsed ? (
                                  <>
                                    <div>
                                      <div className="text-sm font-medium mb-2">Files ({parsed.files.length})</div>
                                      <div className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
                                        <ul className="list-disc pl-5 space-y-1">
                                          {parsed.files.map((f) => (
                                            <li key={f.path} className="font-mono text-xs">{f.path}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>
                                    {parsed.instructions && (
                                      <div>
                                        <div className="text-sm font-medium mb-2">Run Instructions</div>
                                        <div className="whitespace-pre-wrap text-sm bg-muted p-3 rounded-md">
                                          {parsed.instructions}
                                        </div>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <div className="text-sm text-destructive">
                                      Could not parse generated JSON. You can still try downloading the ZIP.
                                    </div>
                                    <div className="whitespace-pre-wrap text-sm bg-muted p-3 rounded-md overflow-x-auto">
                                      {artifact.content}
                                    </div>
                                  </>
                                )}
                                <div className="text-xs text-muted-foreground">
                                  Generated on {new Date(artifact.created_at).toLocaleString()}
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    ) : (
                      <Accordion type="multiple" className="w-full">
                        {phase.artifacts.map((artifact) => (
                          <AccordionItem key={artifact.id} value={artifact.id.toString()}>
                            <AccordionTrigger>
                              <div className="flex items-center gap-2">
                                <span>{ARTIFACT_LABELS[artifact.artifact_type]}</span>
                                <Badge variant="outline" className="text-xs">
                                  v{artifact.version}
                                </Badge>
                                <label
                                  className="ml-2 flex items-center gap-1 text-[10px] text-muted-foreground"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <input
                                    type="radio"
                                    name={`final-${artifact.artifact_type}`}
                                    className="h-3 w-3"
                                    checked={
                                      selectedFinalArtifacts[artifact.artifact_type] ===
                                      artifact.id
                                    }
                                    onChange={(e) => {
                                      e.stopPropagation()
                                      setSelectedFinalArtifacts((prev) => ({
                                        ...prev,
                                        [artifact.artifact_type]: artifact.id,
                                      }))
                                    }}
                                  />
                                  Use in final
                                </label>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="prose prose-sm max-w-none dark:prose-invert">
                                <div className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg overflow-x-auto">
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                  components={{
                                    p: ({ ...props }) => (
                                      <p className="animate-fade-in" {...props} />
                                    ),
                                    li: ({ ...props }) => (
                                      <li className="animate-fade-in" {...props} />
                                    ),
                                    h1: ({ ...props }) => (
                                      <h1 className="animate-fade-in" {...props} />
                                    ),
                                    h2: ({ ...props }) => (
                                      <h2 className="animate-fade-in" {...props} />
                                    ),
                                    h3: ({ ...props }) => (
                                      <h3 className="animate-fade-in" {...props} />
                                    ),
                                  }}
                                  >
                                    {artifact.content}
                                  </ReactMarkdown>
                                </div>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleArtifactDownload(artifact, "markdown")}
                                >
                                  Download .md
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleArtifactDownload(artifact, "pdf")}
                                >
                                  Download PDF
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleArtifactDownload(artifact, "docx")}
                                >
                                  Download DOCX
                                </Button>
                              </div>
                              <div className="mt-2 text-xs text-muted-foreground">
                                Generated by {artifact.model_used} on{" "}
                                {new Date(artifact.created_at).toLocaleString()}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )
                  ) : phaseType === "code_generation" && codegenFilesCount > 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Code files have been generated in the file-by-file code generator.
                      <div className="mt-1 text-xs">
                        Click <span className="font-medium">Open file-by-file code generator</span> to view/edit and download the ZIP.
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No artifacts generated yet. Click Generate to start.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
