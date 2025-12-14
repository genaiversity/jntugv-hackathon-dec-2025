"use client"

import { useEffect, useRef, useState } from "react"
import { MessageCircle, Send, X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"

type ChatRole = "user" | "assistant"

interface ChatMessage {
  role: ChatRole
  content: string
}

const KNOWLEDGE_BASE = `AI Innovation Hub helps turn a rough idea into a build-ready mini-startup blueprint.

Core phases:
- ideation -> concept_design -> launch_content -> validation -> tech_build -> code_generation -> final_spec

Frontend routes:
- /dashboard: list projects
- /new: create a new project
- /projects/[id]: phase workspace
- /projects/[id]/codegen: file-by-file code generator

If user asks: "generate a better project description", respond with ONLY the description text.`

function safeTrim(s: string) {
  return (s || "").trim()
}

export function FloatingChatBot() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! Send me any message. You can also say: \"Generate a better project description for: ...\"",
    },
  ])

  const scrollRef = useRef<HTMLDivElement | null>(null)

  function getDynamicContext() {
    const ideaDraft = safeTrim(typeof window !== "undefined" ? localStorage.getItem("aih:draftIdea") || "" : "")
    const activeProject = safeTrim(typeof window !== "undefined" ? localStorage.getItem("aih:activeProject") || "" : "")

    const parts: string[] = [KNOWLEDGE_BASE]
    if (ideaDraft) parts.push(`Current draft idea (from UI):\n${ideaDraft}`)
    if (activeProject) parts.push(`Current project context (from UI):\n${activeProject}`)
    return parts.join("\n\n---\n\n")
  }

  useEffect(() => {
    if (!open) return
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
    }, 0)
  }, [open])

  useEffect(() => {
    if (!open) return
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, open])

  async function send() {
    const text = safeTrim(input)
    if (!text || busy) return

    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: text }])
    setBusy(true)

    try {
      const res = await api.chat.send({ message: text, context: getDynamicContext() })
      setMessages((prev) => [...prev, { role: "assistant", content: safeTrim(res.reply) || "(no response)" }])
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: e instanceof Error ? e.message : "Failed to contact backend chat endpoint",
        },
      ])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[60]">
      {open ? (
        <Card className="w-[360px] shadow-xl border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Bot
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close chat">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div ref={scrollRef} className="h-[340px] overflow-y-auto rounded-md border bg-background p-3 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[85%] rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm"
                        : "max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm"
                    }
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {busy && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm">
                    <span className="typing-dots" aria-label="Typing">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 flex gap-2">
              <Input
                placeholder={busy ? "Thinking…" : "Type a message…"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    send()
                  }
                }}
                disabled={busy}
              />
              <Button size="icon" onClick={send} disabled={busy || !safeTrim(input)} aria-label="Send">
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-2 text-xs text-muted-foreground">
              Uses backend <code>POST /chat</code>.
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button className="rounded-full shadow-lg" size="icon" onClick={() => setOpen(true)} aria-label="Open chat">
          <MessageCircle className="h-5 w-5" />
        </Button>
      )}
    </div>
  )
}
