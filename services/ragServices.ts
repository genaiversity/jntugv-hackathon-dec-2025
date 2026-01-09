/**
 * RAG (Retrieval-Augmented Generation) Services
 * Combines document retrieval with AI generation for context-aware responses
 */

import { GoogleGenAI } from "@google/genai";

const apiKey = (import.meta as any).env.VITE_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

interface Document {
  id: string;
  title: string;
  content: string;
  category: string;
  embedding?: number[];
  metadata?: Record<string, any>;
}

interface RAGQuery {
  question: string;
  category?: string;
  topK?: number;
}

interface RAGResponse {
  answer: string;
  sources: Document[];
  confidence: number;
}

// Mock knowledge base for demonstration
const knowledgeBase: Document[] = [
  {
    id: "course_001",
    title: "System Design Fundamentals",
    content: "System design is the process of defining the architecture, components, and interfaces of a system. Key concepts include scalability, load balancing, databases, caching, microservices, and deployment strategies.",
    category: "backend",
    metadata: { level: "intermediate", duration: "40 hours" }
  },
  {
    id: "course_002",
    title: "React Advanced Patterns",
    content: "Advanced React patterns include Custom Hooks, Higher-Order Components, Render Props, Context API, and Concurrent Features. These patterns enable code reusability and optimal performance.",
    category: "frontend",
    metadata: { level: "advanced", duration: "35 hours" }
  },
  {
    id: "course_003",
    title: "Machine Learning Pipeline",
    content: "ML pipelines involve data collection, preprocessing, feature engineering, model training, validation, deployment, and monitoring. Tools include TensorFlow, PyTorch, and scikit-learn.",
    category: "ml",
    metadata: { level: "advanced", duration: "50 hours" }
  },
  {
    id: "skill_001",
    title: "Docker & Kubernetes",
    content: "Docker containerizes applications for consistency. Kubernetes orchestrates containers across clusters. Essential for microservices deployment, scaling, and management in production environments.",
    category: "devops",
    metadata: { level: "intermediate", certifications: ["CKA", "CKAD"] }
  },
  {
    id: "skill_002",
    title: "AWS Cloud Services",
    content: "AWS provides EC2 for compute, S3 for storage, RDS for databases, Lambda for serverless, and many other services. Used by enterprises for scalable cloud infrastructure.",
    category: "cloud",
    metadata: { level: "intermediate", certifications: ["AWS Solutions Architect"] }
  },
  {
    id: "project_001",
    title: "E-commerce Platform",
    content: "Build a scalable e-commerce platform with microservices architecture, real-time inventory management, payment integration, and analytics dashboard.",
    category: "project",
    metadata: { type: "full-stack", techStack: ["React", "Node.js", "MongoDB"] }
  },
  {
    id: "interview_001",
    title: "System Design Interview Tips",
    content: "In system design interviews, clarify requirements, propose solutions, discuss tradeoffs, and dive deep into components. Common topics: URL shortener, cache design, distributed systems.",
    category: "interview",
    metadata: { difficulty: "hard", duration: "45-60 mins" }
  }
];

/**
 * Simple cosine similarity calculation for embedding-based search
 * In production, use vector databases like Weaviate, Pinecone, or Milvus
 */
const calculateSimilarity = (query: string, text: string): number => {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  
  // Simple keyword matching as fallback
  const queryWords = queryLower.split(/\s+/);
  let matchCount = 0;
  
  queryWords.forEach(word => {
    if (textLower.includes(word) && word.length > 3) {
      matchCount++;
    }
  });
  
  return matchCount > 0 ? matchCount / queryWords.length : 0;
};

/**
 * Retrieve relevant documents from knowledge base
 */
export const retrieveDocuments = (query: RAGQuery): Document[] => {
  const { question, category, topK = 3 } = query;
  
  let filtered = [...knowledgeBase];
  
  // Filter by category if specified
  if (category) {
    filtered = filtered.filter(doc => doc.category === category);
  }
  
  // Score documents based on relevance
  const scored = filtered.map(doc => ({
    doc,
    score: calculateSimilarity(question, `${doc.title} ${doc.content}`)
  }));
  
  // Sort by score and return top-k
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter(s => s.score > 0)
    .map(s => s.doc);
};

/**
 * Generate RAG response combining retrieval and generation
 */
export const generateRAGResponse = async (query: RAGQuery): Promise<RAGResponse> => {
  try {
    // Step 1: Retrieve relevant documents
    const relevantDocs = retrieveDocuments(query);
    
    if (relevantDocs.length === 0) {
      return {
        answer: "I couldn't find relevant information about your question. Please try a different query or ask for a specific topic.",
        sources: [],
        confidence: 0
      };
    }
    
    // Step 2: Prepare context from retrieved documents
    const context = relevantDocs
      .map(doc => `## ${doc.title}\n${doc.content}`)
      .join('\n\n');
    
    // Step 3: Generate answer using Gemini AI with retrieved context
    if (!ai || !apiKey || apiKey === 'your_api_key_here') {
      // Fallback response without API
      return {
        answer: `Based on the available knowledge about "${query.question}", the most relevant resources are: ${relevantDocs.map(d => d.title).join(', ')}. Configure your API key for detailed answers.`,
        sources: relevantDocs,
        confidence: 0.6
      };
    }
    
    const prompt = `You are an educational assistant. Answer the following question based on the provided context.

Context:
${context}

Question: ${query.question}

Provide a clear, concise answer focusing on the provided information. If the information isn't sufficient, acknowledge it.`;
    
    const response = await (ai as any).generateContent({
      contents: [{ text: prompt }]
    });
    
    const answer = response.candidates?.[0]?.content?.parts?.[0]?.text || 
      "Unable to generate response. Please check API configuration.";
    
    return {
      answer,
      sources: relevantDocs,
      confidence: Math.min(1, relevantDocs.length * 0.3)
    };
  } catch (error) {
    console.error('RAG generation error:', error);
    return {
      answer: "Error generating response. Please try again.",
      sources: [],
      confidence: 0
    };
  }
};

/**
 * Semantic search across knowledge base
 */
export const semanticSearch = (query: string, limit: number = 5): Document[] => {
  return retrieveDocuments({ question: query, topK: limit });
};

/**
 * Get recommendations based on user profile
 */
export const getPersonalizedRecommendations = async (
  userProfile: {
    currentSkills: string[];
    targetRole: string;
    experience: string;
  }
): Promise<Document[]> => {
  const query = `Learning resources for ${userProfile.targetRole} role with skills in ${userProfile.currentSkills.join(', ')}`;
  return semanticSearch(query, 5);
};

/**
 * Add custom document to knowledge base
 */
export const addDocument = (doc: Document): void => {
  knowledgeBase.push(doc);
};

/**
 * Get knowledge base statistics
 */
export const getKnowledgeBaseStats = () => {
  const categories = new Map<string, number>();
  knowledgeBase.forEach(doc => {
    categories.set(doc.category, (categories.get(doc.category) || 0) + 1);
  });
  
  return {
    totalDocuments: knowledgeBase.length,
    categories: Object.fromEntries(categories),
    lastUpdated: new Date().toISOString()
  };
};

export default {
  retrieveDocuments,
  generateRAGResponse,
  semanticSearch,
  getPersonalizedRecommendations,
  addDocument,
  getKnowledgeBaseStats
};
