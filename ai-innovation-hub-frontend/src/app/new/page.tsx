"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AILoader } from "@/components/ui/ai-loader"
import { api } from "@/lib/api"
import { UserType, USER_TYPE_LABELS } from "@/types"

export default function NewProject() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    user_type: "founder" as UserType,
    constraints: "",
    skills: "",
    time_available: "",
  })

  // Provide live context to the floating bot while the user is typing.
  useEffect(() => {
    try {
      const draft = {
        name: formData.name,
        description: formData.description,
        user_type: formData.user_type,
        constraints: formData.constraints,
        skills: formData.skills,
        time_available: formData.time_available,
      }
      localStorage.setItem("aih:draftIdea", JSON.stringify(draft, null, 2))
    } catch {
      // ignore
    }
  }, [formData])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.description.trim()) {
      setError("Name and description are required")
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const project = await api.projects.create({
        name: formData.name.trim(),
        description: formData.description.trim(),
        user_type: formData.user_type,
        constraints: formData.constraints.trim() || undefined,
        skills: formData.skills.trim() || undefined,
        time_available: formData.time_available.trim() || undefined
      })
      
      router.push(`/projects/${project.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Project</CardTitle>
          <CardDescription>
            Describe your idea and let AI help you develop it into a validated startup concept
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                placeholder="e.g., AI Study Companion"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your idea in detail. What problem does it solve? Who is it for?"
                className="min-h-[120px] idea-input-pulse"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user_type">User Type</Label>
              <Select
                value={formData.user_type}
                onValueChange={(value: UserType) => setFormData({ ...formData, user_type: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(USER_TYPE_LABELS) as UserType[]).map(type => (
                    <SelectItem key={type} value={type}>
                      {USER_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                This helps tailor the generated content to your context
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="constraints">Constraints (optional)</Label>
              <Textarea
                id="constraints"
                placeholder="e.g., Limited budget, need to launch in 4 weeks, no backend experience"
                value={formData.constraints}
                onChange={e => setFormData({ ...formData, constraints: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Your Skills (optional)</Label>
              <Input
                id="skills"
                placeholder="e.g., Python, React, basic ML"
                value={formData.skills}
                onChange={e => setFormData({ ...formData, skills: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time_available">Time Available (optional)</Label>
              <Input
                id="time_available"
                placeholder="e.g., 4 weeks, part-time"
                value={formData.time_available}
                onChange={e => setFormData({ ...formData, time_available: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard")}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <AILoader className="mr-2" text="" />}
                Create Project
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
