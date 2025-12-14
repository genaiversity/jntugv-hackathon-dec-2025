export type UserType = "student" | "founder" | "hackathon" | "incubator"

export type PhaseType = 
  | "ideation" 
  | "concept_design" 
  | "launch_content" 
  | "validation" 
  | "tech_build" 
  | "code_generation"
  | "final_spec"

export type ArtifactType =
  | "problem_statement"
  | "personas"
  | "idea_variants"
  | "feature_list"
  | "user_flows"
  | "landing_page"
  | "pitch_outline"
  | "taglines"
  | "experiment_plan"
  | "survey_questions"
  | "metrics"
  | "tech_stack"
  | "api_design"
  | "project_tasks"
  | "starter_code"
  | "generated_app"
  | "full_spec"

export interface Project {
  id: number
  name: string
  description: string
  user_type: UserType
  constraints: string | null
  skills: string | null
  time_available: string | null
  created_at: string
  updated_at: string
}

export interface Artifact {
  id: number
  phase_id: number
  artifact_type: ArtifactType
  content: string
  version: number
  model_used: string
  created_at: string
}

export interface Phase {
  id: number
  project_id: number
  phase_type: PhaseType
  status: string
  started_at: string | null
  completed_at: string | null
  artifacts: Artifact[]
}

export interface ProjectDetail extends Project {
  phases: Phase[]
}

export interface GenerateRequest {
  regenerate?: boolean
  custom_instructions?: string
}

export interface GenerateResponse {
  phase: Phase
  artifacts: Artifact[]
  message: string
}

export interface ProjectCreate {
  name: string
  description: string
  user_type: UserType
  constraints?: string
  skills?: string
  time_available?: string
}

export interface HealthStatus {
  api: string
  llm: {
    connected: boolean
    primary_model: string
    coder_model: string
  }
}

// --- File-by-file code generation (chat-style) ---

export interface CodeGenSession {
  id: number
  project_id: number
  status: string
  model_used: string
  created_at: string
  updated_at: string
}

export interface CodeGenFile {
  id: number
  session_id: number
  path: string
  content: string
  created_at: string
  updated_at: string
}

export interface CodeGenMessage {
  id: number
  session_id: number
  role: string
  content: string
  created_at: string
}

export interface CodeGenSessionDetail extends CodeGenSession {
  files: CodeGenFile[]
  messages: CodeGenMessage[]
}

export interface CodeGenCreateSessionRequest {
  model_used?: string
}

export interface CodeGenUpsertFileRequest {
  path: string
  content: string
}

export interface CodeGenGenerateFileRequest {
  path: string
  instructions?: string
}

export interface CodeGenPlan {
  session_id: number
  suggested_paths: string[]
}

export interface CodeGenApplyPlanResult {
  session_id: number
  created_files: number
  total_files: number
}

// --- Chat bot ---

export interface ChatRequest {
  message: string
  context?: string
}

export interface ChatResponse {
  reply: string
}

export const PHASE_ORDER: PhaseType[] = [
  "ideation",
  "concept_design",
  "launch_content",
  "validation",
  "tech_build",
  "code_generation",
  "final_spec"
]

export const PHASE_LABELS: Record<PhaseType, string> = {
  ideation: "Ideation",
  concept_design: "Concept Design",
  launch_content: "Launch Content",
  validation: "Validation",
  tech_build: "Tech Build",
  code_generation: "Code Generator",
  final_spec: "Final Spec"
}

export const PHASE_DESCRIPTIONS: Record<PhaseType, string> = {
  ideation: "Problem statement, personas, and idea variants",
  concept_design: "Feature list and user flows",
  launch_content: "Landing page copy, pitch outline, and taglines",
  validation: "Experiment plans, survey questions, and metrics",
  tech_build: "Tech stack, API design, and project tasks",
  code_generation: "Generate a runnable starter application (multi-file) based on your project",
  final_spec: "Complete project specification"
}

export const ARTIFACT_LABELS: Record<ArtifactType, string> = {
  problem_statement: "Problem Statement",
  personas: "User Personas",
  idea_variants: "Idea Variants",
  feature_list: "Feature List",
  user_flows: "User Flows",
  landing_page: "Landing Page Copy",
  pitch_outline: "Pitch Outline",
  taglines: "Taglines",
  experiment_plan: "Experiment Plan",
  survey_questions: "Survey Questions",
  metrics: "Success Metrics",
  tech_stack: "Tech Stack",
  api_design: "API Design",
  project_tasks: "Project Tasks",
  starter_code: "Starter Code",
  generated_app: "Generated Application",
  full_spec: "Full Specification"
}

export const USER_TYPE_LABELS: Record<UserType, string> = {
  student: "Student",
  founder: "Founder",
  hackathon: "Hackathon",
  incubator: "Incubator"
}
