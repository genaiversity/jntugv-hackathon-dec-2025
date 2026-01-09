
export type View = 'dashboard' | 'tech-accelerator' | 'skill-gap' | 'mentor' | 'projects' | 'interview' | 'trends' | 'timetable' | 'lab' | 'peers' | 'notes' | 'parents' | 'scholar';

export interface User {
  name: string;
  email: string;
  college: string;
  year: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface SkillAnalysis {
  matchScore: number;
  missingSkills: {
    skill: string;
    courseLink: string;
    platform: 'Coursera' | 'NPTEL' | 'Udemy' | 'Other';
  }[];
  recommendations: string[];
  roleFit: string;
}

export interface CompanyFitAnalysis {
  matchScore: number;
  culturalFit: string;
  technicalGaps: string[];
  accelerationPlan: {
    week: string;
    focus: string;
    tasks: string[];
  }[];
}

export interface ProjectIdea {
  title: string;
  description: string;
  techStack: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  roadmap: string[];
}

export interface TrendItem {
  technology: string;
  demandLevel: 'High' | 'Medium' | 'Low';
  growth: string;
  description: string;
}

export interface WorkflowStep {
  phaseName: string;
  duration: string;
  description: string;
  keyConcepts: string[];
  tools: string[];
  practicalTask: string;
}

export interface InternshipOpportunity {
  id: string;
  institute: string;
  professor: string;
  domain: string;
  title: string;
  description: string;
  slots: number;
  deadline: string;
  prerequisites: string[];
  tags: string[];
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
}

// Ambient module declaration for legacy pdfjs import used in component/Notes.tsx
declare module 'pdfjs-dist';
