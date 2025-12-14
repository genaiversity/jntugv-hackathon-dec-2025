"use client"

import { useCallback, useEffect, useMemo, useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, Loader2, Wand2, Save, Trash2 } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { CodeGenFile, CodeGenSessionDetail, CodeGenPlan } from "@/types"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ProjectCodeGenPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const projectId = parseInt(id)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [session, setSession] = useState<CodeGenSessionDetail | null>(null)
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null)

  const [newFilePath, setNewFilePath] = useState("README.md")
  const [instructions, setInstructions] = useState("")

  const [workingContent, setWorkingContent] = useState("")
  const [busy, setBusy] = useState(false)
  const [plan, setPlan] = useState<CodeGenPlan | null>(null)

  const selectedFile: CodeGenFile | null = useMemo(() => {
    if (!session || selectedFileId == null) return null
    return session.files.find((f) => f.id === selectedFileId) || null
  }, [session, selectedFileId])

  const loadOrCreateSession = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const latest = await api.codegen.latestSession(projectId)
      const s = latest ?? (await api.codegen.createSession(projectId))
      const detail = await api.codegen.getSession(s.id)
      setSession(detail)

      // Fetch suggested file plan (best-effort)
      try {
        const p = await api.codegen.getPlan(s.id)
        setPlan(p)
      } catch {
        setPlan(null)
      }

      if (detail.files.length > 0) {
        setSelectedFileId(detail.files[0].id)
        setWorkingContent(detail.files[0].content)
      } else {
        setSelectedFileId(null)
        setWorkingContent("")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load codegen session")
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadOrCreateSession()
  }, [loadOrCreateSession])

  useEffect(() => {
    if (selectedFile) {
      setWorkingContent(selectedFile.content)
    }
  }, [selectedFile])

  async function handleGenerateFile() {
    if (!session) return
    if (!newFilePath.trim()) {
      alert("File path is required")
      return
    }

    try {
      setBusy(true)
      const f = await api.codegen.generateFile(session.id, {
        path: newFilePath.trim(),
        instructions: instructions.trim() || undefined,
      })

      const detail = await api.codegen.getSession(session.id)
      setSession(detail)
      setSelectedFileId(f.id)
      setWorkingContent(f.content)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to generate file")
    } finally {
      setBusy(false)
    }
  }

  async function handleSaveFile() {
    if (!session) return

    const path = selectedFile?.path || newFilePath.trim()
    if (!path) {
      alert("Select a file or enter a file path")
      return
    }

    try {
      setBusy(true)
      const saved = await api.codegen.upsertFile(session.id, { path, content: workingContent })
      const detail = await api.codegen.getSession(session.id)
      setSession(detail)
      setSelectedFileId(saved.id)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save file")
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteSelectedFile() {
    if (!session || !selectedFile) return
    if (!confirm(`Delete ${selectedFile.path}?`)) return

    try {
      setBusy(true)
      await api.codegen.deleteFile(session.id, selectedFile.id)
      const detail = await api.codegen.getSession(session.id)
      setSession(detail)

      if (detail.files.length > 0) {
        setSelectedFileId(detail.files[0].id)
        setWorkingContent(detail.files[0].content)
      } else {
        setSelectedFileId(null)
        setWorkingContent("")
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete file")
    } finally {
      setBusy(false)
    }
  }

  async function handleApplyPlan() {
    if (!session) return
    try {
      setBusy(true)
      await api.codegen.applyPlan(session.id)
      const detail = await api.codegen.getSession(session.id)
      setSession(detail)
      if (detail.files.length > 0 && selectedFileId == null) {
        setSelectedFileId(detail.files[0].id)
        setWorkingContent(detail.files[0].content)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to apply file plan")
    } finally {
      setBusy(false)
    }
  }

  async function handleDownloadZip() {
    if (!session) return

    try {
      setBusy(true)
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const response = await fetch(`${apiBase}/codegen/sessions/${session.id}/zip`)
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
      a.download = `project_${projectId}_code.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to download ZIP")
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-96 mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-destructive mb-4">{error || "Codegen session not found"}</div>
          <Button onClick={() => router.push(`/projects/${projectId}`)}>Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href={`/projects/${projectId}`}>
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Project
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">File-by-file Code Generator</h1>
          <p className="text-muted-foreground">
            Generate and edit files one at a time, then download a ZIP.
          </p>
        </div>
        <Button onClick={handleDownloadZip} disabled={busy || session.files.length === 0}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Download ZIP
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Files ({session.files.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {session.files.length === 0 && plan?.suggested_paths?.length ? (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Suggested files (click &quot;Create list&quot; to add placeholders):
                </div>
                <div className="text-xs font-mono bg-muted p-3 rounded-md max-h-48 overflow-auto">
                  <ul className="list-disc pl-5 space-y-1">
                    {plan.suggested_paths.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
                <Button size="sm" variant="outline" onClick={handleApplyPlan} disabled={busy}>
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create file list
                </Button>
              </div>
            ) : session.files.length === 0 ? (
              <div className="text-sm text-muted-foreground">No files yet. Generate one to start.</div>
            ) : (
              <div className="space-y-1">
                {session.files.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFileId(f.id)}
                    className={`w-full text-left rounded-md px-3 py-2 text-sm font-mono transition-colors ${
                      selectedFileId === f.id ? "bg-muted" : "hover:bg-muted/50"
                    }`}
                  >
                    {f.path}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Generate a file</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-path">File path</Label>
                <Input
                  id="file-path"
                  value={newFilePath}
                  onChange={(e) => setNewFilePath(e.target.value)}
                  placeholder="e.g., README.md or src/app/page.tsx"
                  disabled={busy}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions (optional)</Label>
                <Textarea
                  id="instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="What should this file do?"
                  className="min-h-[100px]"
                  disabled={busy}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleGenerateFile} disabled={busy}>
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                  Generate
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Editor</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleSaveFile} disabled={busy}>
                    {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save
                  </Button>
                  <Button variant="ghost" onClick={handleDeleteSelectedFile} disabled={busy || !selectedFile}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xs text-muted-foreground font-mono">
                {selectedFile ? selectedFile.path : "(new file)"}
              </div>
              <Textarea
                value={workingContent}
                onChange={(e) => setWorkingContent(e.target.value)}
                placeholder="Generate or paste code here…"
                className="min-h-[420px] font-mono"
                disabled={busy}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
