import React, { useState, useCallback } from 'react';
import { Brain, Zap, FileText, TrendingUp } from 'lucide-react';
import { courseRecommendationAgent, jobMatchingAgent, peerConnectionAgent, interviewPrepAgent } from '../services/aiAgentsServices';
import { generateRAGResponse } from '../services/ragServices';
import { parseResume } from '../services/mlServices';

const AIEnhancedDashboard: React.FC = () => {
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [agentResults, setAgentResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [ragQuery, setRagQuery] = useState('');

  // User profile for agents
  const userProfile = {
    id: 'user_123',
    name: 'John Doe',
    currentSkills: ['JavaScript', 'React', 'Node.js'],
    targetRole: 'Senior Full Stack Engineer',
    yearsOfExperience: 3,
    interests: ['Open Source', 'Startups'],
    pastScores: [75, 78, 82, 85],
    studyHours: [2, 2.5, 3, 3.5]
  };

  // Run course recommendation agent
  const runCourseAgent = useCallback(async () => {
    setLoading(true);
    try {
      const result = await courseRecommendationAgent({
        userId: userProfile.id,
        currentSkills: userProfile.currentSkills,
        targetRole: userProfile.targetRole,
        constraints: { timeFrame: '3 months' }
      });
      setAgentResults(result);
      setActiveAgent('course');
    } catch (error) {
      console.error('Error running course agent:', error);
    }
    setLoading(false);
  }, [userProfile]);

  // Run job matching agent
  const runJobAgent = useCallback(async () => {
    setLoading(true);
    try {
      const result = await jobMatchingAgent(userProfile);
      setAgentResults(result);
      setActiveAgent('jobs');
    } catch (error) {
      console.error('Error running job agent:', error);
    }
    setLoading(false);
  }, [userProfile]);

  // Run peer connection agent
  const runPeerAgent = useCallback(async () => {
    setLoading(true);
    try {
      const result = await peerConnectionAgent(userProfile);
      setAgentResults(result);
      setActiveAgent('peers');
    } catch (error) {
      console.error('Error running peer agent:', error);
    }
    setLoading(false);
  }, [userProfile]);

  // Run interview prep agent
  const runInterviewAgent = useCallback(async () => {
    setLoading(true);
    try {
      const result = await interviewPrepAgent(userProfile, userProfile.targetRole);
      setAgentResults(result);
      setActiveAgent('interview');
    } catch (error) {
      console.error('Error running interview agent:', error);
    }
    setLoading(false);
  }, [userProfile]);

  // Handle RAG query
  const handleRAGQuery = useCallback(async () => {
    if (!ragQuery.trim()) return;
    setLoading(true);
    try {
      const result = await generateRAGResponse({ question: ragQuery });
      setAgentResults({
        type: 'rag',
        query: ragQuery,
        ...result
      });
      setActiveAgent('rag');
    } catch (error) {
      console.error('Error in RAG query:', error);
    }
    setLoading(false);
  }, [ragQuery]);

  // Handle resume parsing
  const handleResumeAnalysis = useCallback(() => {
    if (!resumeText.trim()) return;
    setLoading(true);
    try {
      const parsed = parseResume(resumeText);
      setAgentResults({
        type: 'resume',
        ...parsed
      });
      setActiveAgent('resume');
    } catch (error) {
      console.error('Error parsing resume:', error);
    }
    setLoading(false);
  }, [resumeText]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Brain className="w-8 h-8 text-blue-400" />
            AI-Powered Dashboard
          </h1>
          <p className="text-slate-400">Advanced AI Agents & RAG-based Learning</p>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* AI Agents */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-400" />
                AI Agents
              </h2>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={runCourseAgent}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 p-4 rounded text-sm font-semibold transition"
                >
                  📚 Course Recommendation
                </button>
                <button
                  onClick={runJobAgent}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 p-4 rounded text-sm font-semibold transition"
                >
                  💼 Job Matching
                </button>
                <button
                  onClick={runPeerAgent}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 p-4 rounded text-sm font-semibold transition"
                >
                  👥 Peer Connection
                </button>
                <button
                  onClick={runInterviewAgent}
                  disabled={loading}
                  className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 p-4 rounded text-sm font-semibold transition"
                >
                  🎯 Interview Prep
                </button>
              </div>
            </div>

            {/* RAG System */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-cyan-400" />
                RAG Knowledge Retrieval
              </h2>
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Ask about courses, skills, projects..."
                  value={ragQuery}
                  onChange={(e) => setRagQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleRAGQuery()}
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleRAGQuery}
                  disabled={loading || !ragQuery.trim()}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 p-2 rounded font-semibold transition"
                >
                  {loading ? 'Processing...' : 'Search Knowledge Base'}
                </button>
              </div>
            </div>

            {/* Resume Parser */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-pink-400" />
                Resume Parser (ML)
              </h2>
              
              <textarea
                placeholder="Paste your resume text here..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={4}
                className="w-full bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 focus:outline-none focus:border-pink-500 text-sm"
              />
              <button
                onClick={handleResumeAnalysis}
                disabled={loading || !resumeText.trim()}
                className="w-full mt-3 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 p-2 rounded font-semibold transition"
              >
                {loading ? 'Analyzing...' : 'Parse Resume'}
              </button>
            </div>
          </div>

          {/* User Profile */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Your Profile</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-400">Name</p>
                <p className="font-semibold">{userProfile.name}</p>
              </div>
              <div>
                <p className="text-slate-400">Target Role</p>
                <p className="font-semibold">{userProfile.targetRole}</p>
              </div>
              <div>
                <p className="text-slate-400">Current Skills</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {userProfile.currentSkills.map(skill => (
                    <span key={skill} className="bg-blue-600/30 px-2 py-1 rounded text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-slate-400">Experience</p>
                <p className="font-semibold">{userProfile.yearsOfExperience} years</p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Display */}
        {agentResults && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">
              {activeAgent === 'course' && '📚 Course Recommendation Results'}
              {activeAgent === 'jobs' && '💼 Job Matching Results'}
              {activeAgent === 'peers' && '👥 Peer Connection Results'}
              {activeAgent === 'interview' && '🎯 Interview Preparation Plan'}
              {activeAgent === 'rag' && '🔍 Knowledge Base Results'}
              {activeAgent === 'resume' && '📄 Resume Analysis Results'}
            </h2>
            
            <div className="bg-slate-700/50 rounded p-4 text-sm max-h-96 overflow-y-auto">
              {activeAgent === 'course' && agentResults.result && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-lg mb-2">Learning Plan</h3>
                    <pre className="whitespace-pre-wrap text-xs">{agentResults.result.learningPlan}</pre>
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">Milestones</h3>
                    {agentResults.result.milestones?.map((m: any) => (
                      <p key={m.week} className="text-xs">Week {m.week}: {m.milestone}</p>
                    ))}
                  </div>
                </div>
              )}
              
              {activeAgent === 'jobs' && agentResults.result && (
                <div>
                  <h3 className="font-bold mb-2">Top Job Matches</h3>
                  {agentResults.result.topMatches?.slice(0, 3).map((job: any) => (
                    <div key={job.id} className="mb-2 pb-2 border-b border-slate-600 text-xs">
                      <p className="font-semibold">{job.title} at {job.company}</p>
                      <p>Fit Score: {Math.round(job.fitScore)}%</p>
                    </div>
                  ))}
                </div>
              )}
              
              {activeAgent === 'peers' && agentResults.result && (
                <div>
                  <h3 className="font-bold mb-2">Suggested Connections</h3>
                  {agentResults.result.suggestedConnections?.map((peer: any) => (
                    <div key={peer.peerId} className="mb-2 pb-2 border-b border-slate-600 text-xs">
                      <p className="font-semibold">{peer.name}</p>
                      <p>Compatibility: {peer.compatibility}</p>
                      <p className="text-slate-300">{peer.suggestionReason}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {activeAgent === 'interview' && agentResults.result && (
                <div className="space-y-3">
                  <p><strong>Prep Duration:</strong> {agentResults.result.prepDuration}</p>
                  <p><strong>Success Probability:</strong> {(agentResults.result.successProbability * 100).toFixed(0)}%</p>
                  <div>
                    <h4 className="font-bold mb-1">Daily Schedule</h4>
                    <pre className="text-xs">{JSON.stringify(agentResults.result.dailySchedule, null, 2)}</pre>
                  </div>
                </div>
              )}
              
              {activeAgent === 'rag' && (
                <div className="space-y-3">
                  <p><strong>Query:</strong> {agentResults.query}</p>
                  <p><strong>Confidence:</strong> {(agentResults.confidence * 100).toFixed(0)}%</p>
                  <div>
                    <h4 className="font-bold mb-1">Answer</h4>
                    <p className="text-sm">{agentResults.answer}</p>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Sources</h4>
                    {agentResults.sources?.map((source: any) => (
                      <p key={source.id} className="text-xs">- {source.title}</p>
                    ))}
                  </div>
                </div>
              )}
              
              {activeAgent === 'resume' && (
                <div className="space-y-3 text-xs">
                  <p><strong>Name:</strong> {agentResults.name || 'Not detected'}</p>
                  <p><strong>Email:</strong> {agentResults.email || 'Not detected'}</p>
                  <div>
                    <p className="font-bold">Skills Detected:</p>
                    <p>{agentResults.skills?.join(', ') || 'None'}</p>
                  </div>
                  <div>
                    <p className="font-bold">Experience</p>
                    {agentResults.experience?.map((exp: any, i: number) => (
                      <p key={i}>{exp.company} - {exp.duration}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            <p className="mt-4">Processing with AI...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIEnhancedDashboard;
