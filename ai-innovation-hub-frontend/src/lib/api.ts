import {
  Project,
  ProjectDetail,
  ProjectCreate,
  GenerateRequest,
  GenerateResponse,
  HealthStatus,
  Artifact,
  PhaseType,
  CodeGenSession,
  CodeGenSessionDetail,
  CodeGenCreateSessionRequest,
  CodeGenUpsertFileRequest,
  CodeGenGenerateFileRequest,
  CodeGenFile,
  CodeGenPlan,
  CodeGenApplyPlanResult,
  ChatRequest,
  ChatResponse,
} from "@/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

async function fetchApi<T>(
  endpoint: string, 
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "An error occurred" }))
    throw new Error(error.detail || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export const api = {
  health: {
    check: () => fetchApi<HealthStatus>("/health"),
  },

  projects: {
    list: () => fetchApi<Project[]>("/projects"),
    
    get: (id: number) => fetchApi<ProjectDetail>(`/projects/${id}`),
    
    create: (data: ProjectCreate) => 
      fetchApi<Project>("/projects", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    
    delete: (id: number) => 
      fetchApi<{ message: string }>(`/projects/${id}`, {
        method: "DELETE",
      }),
    
    export: (id: number) => 
      fetchApi<{ project_id: number; format: string; content: string }>(
        `/projects/${id}/export`
      ),
  },

  phases: {
    generate: (projectId: number, phaseType: PhaseType, data?: GenerateRequest) =>
      fetchApi<GenerateResponse>(
        `/projects/${projectId}/phases/${phaseType}/generate`,
        {
          method: "POST",
          body: JSON.stringify(data || {}),
        }
      ),
  },

  artifacts: {
    list: (projectId: number) =>
      fetchApi<Artifact[]>(`/projects/${projectId}/artifacts`),

    get: (id: number) =>
      fetchApi<Artifact>(`/artifacts/${id}`),
  },

  codegen: {
    latestSession: (projectId: number) =>
      fetchApi<CodeGenSession | null>(`/projects/${projectId}/codegen/sessions/latest`),

    createSession: (projectId: number, data?: CodeGenCreateSessionRequest) =>
      fetchApi<CodeGenSession>(`/projects/${projectId}/codegen/sessions`, {
        method: "POST",
        body: JSON.stringify(data || {}),
      }),

    getSession: (sessionId: number) =>
      fetchApi<CodeGenSessionDetail>(`/codegen/sessions/${sessionId}`),

    upsertFile: (sessionId: number, data: CodeGenUpsertFileRequest) =>
      fetchApi<CodeGenFile>(`/codegen/sessions/${sessionId}/files`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    deleteFile: (sessionId: number, fileId: number) =>
      fetchApi<{ message: string }>(`/codegen/sessions/${sessionId}/files/${fileId}`, {
        method: "DELETE",
      }),

    generateFile: (sessionId: number, data: CodeGenGenerateFileRequest) =>
      fetchApi<CodeGenFile>(`/codegen/sessions/${sessionId}/generate-file`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    getPlan: (sessionId: number) =>
      fetchApi<CodeGenPlan>(`/codegen/sessions/${sessionId}/plan`),

    applyPlan: (sessionId: number) =>
      fetchApi<CodeGenApplyPlanResult>(`/codegen/sessions/${sessionId}/plan/apply`, {
        method: "POST",
        body: JSON.stringify({}),
      }),
  },

  chat: {
    send: (data: ChatRequest) =>
      fetchApi<ChatResponse>("/chat", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
}
