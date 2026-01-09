/**
 * Advanced AI Agents Service
 * Multi-step reasoning agents for complex educational tasks
 */

import { GoogleGenAI } from "@google/genai";
import { generateRAGResponse } from "./ragServices";
import { matchPeers, predictPerformance } from "./mlServices";

const apiKey = (import.meta as any).env.VITE_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

interface AgentState {
  taskId: string;
  objective: string;
  steps: string[];
  currentStep: number;
  context: Record<string, any>;
  result: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

interface RecommendationAgent {
  userId: string;
  currentSkills: string[];
  targetRole: string;
  constraints?: {
    timeFrame?: string;
    budget?: string;
    learningStyle?: string;
  };
}

/**
 * Course Recommendation Agent
 * Multi-step reasoning: Assess skills -> Find gaps -> Recommend courses -> Create timeline
 */
export const courseRecommendationAgent = async (
  profile: RecommendationAgent
): Promise<AgentState> => {
  const agentState: AgentState = {
    taskId: `agent_${Date.now()}`,
    objective: `Create personalized learning path for ${profile.targetRole}`,
    steps: [
      'Step 1: Analyze current skills',
      'Step 2: Identify skill gaps',
      'Step 3: Search for courses',
      'Step 4: Create learning timeline',
      'Step 5: Set milestones'
    ],
    currentStep: 0,
    context: {
      userProfile: profile,
      assessmentResults: null,
      recommendedCourses: [],
      learningPlan: null
    },
    result: null,
    status: 'running'
  };
  
  try {
    // Step 1: Analyze current skills using AI
    if (!ai || !apiKey || apiKey === 'your_api_key_here') {
      agentState.context.assessmentResults = {
        proficiencyLevel: 'intermediate',
        strongAreas: profile.currentSkills.slice(0, 2),
        weakAreas: ['System Design', 'Advanced Data Structures']
      };
    } else {
      const assessmentPrompt = `Analyze these skills for a ${profile.targetRole} role: ${profile.currentSkills.join(', ')}. Return JSON with proficiencyLevel, strongAreas, weakAreas.`;
      const response = await (ai as any).generateContent({ contents: [{ text: assessmentPrompt }] });
      try {
        const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        agentState.context.assessmentResults = JSON.parse(responseText.match(/\{[\s\S]*\}/)?.[0] || '{}');
      } catch {
        agentState.context.assessmentResults = {
          proficiencyLevel: 'intermediate',
          strongAreas: profile.currentSkills.slice(0, 2),
          weakAreas: ['Advanced concepts']
        };
      }
    }
    
    agentState.currentStep = 1;
    
    // Step 2: Identify skill gaps
    const gapQuery = {
      question: `Skills needed for ${profile.targetRole}`,
      category: profile.targetRole.toLowerCase()
    };
    
    const gapAnalysis = await generateRAGResponse(gapQuery);
    agentState.context.skillGaps = gapAnalysis.answer;
    
    agentState.currentStep = 2;
    
    // Step 3: Recommend courses
    const courseQuery = {
      question: `Best courses to become a ${profile.targetRole}`,
      topK: 5
    };
    
    const courseAnalysis = await generateRAGResponse(courseQuery);
    agentState.context.recommendedCourses = courseAnalysis.sources;
    
    agentState.currentStep = 3;
    
    // Step 4: Create learning timeline
    const timelinePrompt = `Create a realistic 3-month learning plan to transition to ${profile.targetRole} from current skills: ${profile.currentSkills.join(', ')}. Include weekly milestones.`;
    
    if (ai && apiKey && apiKey !== 'your_api_key_here') {
      const timelineResponse = await (ai as any).generateContent({ contents: [{ text: timelinePrompt }] });
      agentState.context.learningPlan = timelineResponse.candidates?.[0]?.content?.parts?.[0]?.text;
    } else {
      agentState.context.learningPlan = `
Week 1-2: Fundamentals Review
Week 3-4: Advanced Concepts
Week 5-8: Project Work
Week 9-12: Capstone Project & Interview Prep`;
    }
    
    agentState.currentStep = 4;
    
    // Step 5: Set milestones
    agentState.context.milestones = [
      { week: 2, milestone: 'Complete fundamentals course', target: 'Core concepts mastered' },
      { week: 4, milestone: 'Advanced training completion', target: 'Advanced topics understood' },
      { week: 8, milestone: 'Portfolio project launch', target: 'Real-world project completed' },
      { week: 12, milestone: 'Interview ready', target: 'Technical interviews passed' }
    ];
    
    agentState.currentStep = 5;
    agentState.status = 'completed';
    agentState.result = {
      recommendedCourses: agentState.context.recommendedCourses,
      learningPlan: agentState.context.learningPlan,
      milestones: agentState.context.milestones,
      estimatedDuration: '12 weeks',
      successProbability: 0.85
    };
    
    return agentState;
  } catch (error) {
    console.error('Course recommendation agent error:', error);
    agentState.status = 'failed';
    return agentState;
  }
};

/**
 * Job Matching Agent
 * Multi-step: Analyze profile -> Search jobs -> Calculate fit -> Prepare application
 */
export const jobMatchingAgent = async (
  userProfile: any,
  _targetCompanies?: string[]
): Promise<AgentState> => {
  const agentState: AgentState = {
    taskId: `agent_${Date.now()}`,
    objective: `Find best job matches for user profile`,
    steps: [
      'Step 1: Analyze user profile',
      'Step 2: Search matching jobs',
      'Step 3: Calculate job fit scores',
      'Step 4: Generate application strategies'
    ],
    currentStep: 0,
    context: { userProfile, jobMatches: [], applicationStrategies: [] },
    result: null,
    status: 'running'
  };
  
  try {
    // Simulate job database
    const jobDatabase = [
      { id: 1, title: 'Senior React Developer', company: 'Tech Corp', skills: ['React', 'TypeScript', 'Node.js'], level: 'senior' },
      { id: 2, title: 'Full Stack Engineer', company: 'StartUp XYZ', skills: ['React', 'Node.js', 'MongoDB'], level: 'mid' },
      { id: 3, title: 'ML Engineer', company: 'AI Solutions', skills: ['Python', 'TensorFlow', 'SQL'], level: 'mid' }
    ];
    
    agentState.currentStep = 1;
    
    // Step 2: Search and score
    const matches = jobDatabase.map(job => {
      const userSkillsSet = new Set(userProfile.skills.map((s: string) => s.toLowerCase()));
      const jobSkillsSet = new Set(job.skills.map((s: string) => s.toLowerCase()));
      const common = Array.from(jobSkillsSet).filter(s => userSkillsSet.has(s));
      const fitScore = (common.length / job.skills.length) * 100;
      
      return { ...job, fitScore, matchedSkills: common };
    }).sort((a, b) => b.fitScore - a.fitScore);
    
    agentState.context.jobMatches = matches;
    agentState.currentStep = 2;
    
    // Step 3: Generate strategies
    const strategies = matches.slice(0, 3).map(job => ({
      jobId: job.id,
      position: job.title,
      fitScore: job.fitScore,
      strategy: `Focus on ${job.matchedSkills.join(', ')} in your application. Prepare for questions about ${job.skills.filter(s => !new Set(userProfile.skills).has(s))[0] || 'problem solving'}.`,
      nextSteps: [
        'Polish resume highlighting relevant projects',
        'Practice technical interview questions',
        'Research company culture and products',
        'Prepare portfolio of relevant work'
      ]
    }));
    
    agentState.context.applicationStrategies = strategies;
    agentState.currentStep = 3;
    agentState.status = 'completed';
    agentState.result = {
      topMatches: matches.slice(0, 5),
      applicationStrategies: strategies,
      interviewPreparation: {
        topics: Array.from(new Set(matches.flatMap(m => m.skills))).slice(0, 5),
        estimatedPrepTime: '4-6 weeks',
        resources: ['LeetCode', 'Interview.io', 'System Design Primer']
      }
    };
    
    return agentState;
  } catch (error) {
    console.error('Job matching agent error:', error);
    agentState.status = 'failed';
    return agentState;
  }
};

/**
 * Peer Connection Agent
 * Find and connect users with complementary skills
 */
export const peerConnectionAgent = async (
  userProfile: any,
  poolSize: number = 10
): Promise<AgentState> => {
  const agentState: AgentState = {
    taskId: `agent_${Date.now()}`,
    objective: `Find compatible peer connections`,
    steps: [
      'Step 1: Analyze user profile',
      'Step 2: Generate peer pool',
      'Step 3: Calculate compatibility scores',
      'Step 4: Suggest connections with reasoning'
    ],
    currentStep: 0,
    context: { userProfile, peerMatches: [] },
    result: null,
    status: 'running'
  };
  
  try {
    // Generate mock peer pool
    const peerPool = Array.from({ length: poolSize }, (_, i) => ({
      id: `peer_${i + 1}`,
      name: `Peer ${i + 1}`,
      skills: Array.from({ length: Math.random() > 0.5 ? 3 : 4 }, () => 
        ['React', 'Python', 'DevOps', 'ML', 'Cloud', 'Database'][Math.floor(Math.random() * 6)]
      ),
      targetRole: ['Frontend Dev', 'Backend Dev', 'Data Scientist', 'DevOps Engineer'][Math.floor(Math.random() * 4)],
      interests: ['Startups', 'Open Source', 'Research', 'Teaching'][Math.floor(Math.random() * 4)]
    }));
    
    agentState.currentStep = 1;
    
    // Calculate matches using ML
    const matches = peerPool.map(peer => {
      const score = matchPeers(userProfile, peer);
      return { ...peer, ...score };
    }).sort((a, b) => b.score - a.score);
    
    agentState.context.peerMatches = matches.slice(0, 5);
    agentState.currentStep = 2;
    
    agentState.status = 'completed';
    agentState.result = {
      suggestedConnections: matches.slice(0, 5).map(peer => ({
        peerId: peer.id,
        name: peer.name,
        compatibility: peer.compatibility,
        compatibilityScore: peer.score,
        commonSkills: peer.commonSkills,
        complementarySkills: peer.complementarySkills,
        suggestionReason: `${peer.compatibility} match - ${peer.commonSkills.length} shared skills, ${peer.complementarySkills.length} complementary skills`
      })),
      communicationSuggestions: [
        'Discuss shared projects and interests',
        'Exchange learning resources',
        'Schedule pair programming sessions',
        'Collaborate on open source projects'
      ]
    };
    
    return agentState;
  } catch (error) {
    console.error('Peer connection agent error:', error);
    agentState.status = 'failed';
    return agentState;
  }
};

/**
 * Interview Preparation Agent
 * Create personalized interview prep plan
 */
export const interviewPrepAgent = async (
  userProfile: any,
  targetRole: string,
  company?: string
): Promise<AgentState> => {
  const agentState: AgentState = {
    taskId: `agent_${Date.now()}`,
    objective: `Create personalized interview prep plan`,
    steps: [
      'Step 1: Analyze skill level',
      'Step 2: Identify weak areas',
      'Step 3: Generate practice plan',
      'Step 4: Create mock interview schedule'
    ],
    currentStep: 0,
    context: { userProfile, targetRole, company },
    result: null,
    status: 'running'
  };
  
  try {
    // Performance prediction
    const performance = predictPerformance(userProfile);
    agentState.context.performancePrediction = performance;
    agentState.currentStep = 1;
    
    // Identify gaps
    const commonInterviewTopics = [
      'Data Structures', 'Algorithms', 'System Design', 
      'Behavioral Questions', 'Coding Challenges'
    ];
    
    const gaps = commonInterviewTopics.filter(topic => 
      !userProfile.skills.some((s: string) => s.toLowerCase().includes(topic.toLowerCase()))
    );
    
    agentState.context.identifiedGaps = gaps;
    agentState.currentStep = 2;
    
    // Generate practice plan
    const practicePlan = {
      week1: { focus: 'Data Structures', resources: ['Arrays', 'LinkedLists', 'Trees'], practice: '15 problems' },
      week2: { focus: 'Algorithms', resources: ['Sorting', 'Search', 'Dynamic Programming'], practice: '15 problems' },
      week3: { focus: 'System Design', resources: ['Scalability', 'Database Design'], practice: '5 projects' },
      week4: { focus: 'Behavioral', resources: ['STAR method', 'Case studies'], practice: '3 mock interviews' }
    };
    
    agentState.context.practicePlan = practicePlan;
    agentState.currentStep = 3;
    
    // Mock interview schedule
    const mockInterviews = [
      { date: '+1 week', focus: 'Technical fundamentals', duration: '45 min' },
      { date: '+2 weeks', focus: 'Coding challenges', duration: '60 min' },
      { date: '+3 weeks', focus: 'System design', duration: '60 min' },
      { date: '+4 weeks', focus: 'Full mock interview', duration: '90 min' }
    ];
    
    agentState.currentStep = 4;
    agentState.status = 'completed';
    agentState.result = {
      prepDuration: '4 weeks',
      successProbability: performance.predictedScore > 70 ? 0.85 : 0.65,
      practicePlan,
      mockInterviews,
      recommendedResources: [
        'LeetCode Premium',
        'Interview.io',
        'System Design Primer',
        'Behavioral interview book'
      ],
      dailySchedule: {
        codingPractice: '2-3 hours',
        systemDesign: '1 hour',
        behavioral: '30 minutes',
        mockInterviews: 'Weekly'
      }
    };
    
    return agentState;
  } catch (error) {
    console.error('Interview prep agent error:', error);
    agentState.status = 'failed';
    return agentState;
  }
};

export default {
  courseRecommendationAgent,
  jobMatchingAgent,
  peerConnectionAgent,
  interviewPrepAgent
};
