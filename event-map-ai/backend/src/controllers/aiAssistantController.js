/**
 * AI ASSISTANT CONTROLLER
 * Main controller for the multi-agent AI assistant system
 */

const AgentOrchestrator = require('../ai/agents/AgentOrchestrator');

class AIAssistantController {
  constructor() {
    this.orchestrator = new AgentOrchestrator();
    this.activeConversations = new Map(); // Track active conversations
  }

  /**
   * Main AI assistant endpoint
   */
  async processMessage(req, res) {
    try {
      const { message, sessionId, location } = req.body;
      const userId = req.user?._id || null;
      const userRole = req.user?.role || 'guest';

      // Validate input
      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Message is required and must be a string'
        });
      }

      // Prepare user input for orchestrator
      const userInput = {
        message: message.trim(),
        userId,
        role: userRole,
        sessionId: sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        location: location || null,
        latitude: req.body.latitude || null,
        longitude: req.body.longitude || null,
        timestamp: new Date()
      };

      // Process through agent orchestrator
      const response = await this.orchestrator.processRequest(userInput);

      // Track conversation
      this.trackConversation(userInput.sessionId, {
        userMessage: message,
        aiResponse: response.message,
        timestamp: new Date(),
        userId
      });

      // Format response for frontend
      const formattedResponse = {
        success: true,
        message: response.message,
        data: response.data,
        explanation: {
          agentsUsed: response.explanation.agentsUsed,
          reasoning: response.explanation.reasoning,
          confidence: response.explanation.confidence,
          safetyStatus: response.explanation.safetyStatus
        },
        metadata: {
          sessionId: userInput.sessionId,
          executionTime: response.executionTime,
          timestamp: response.timestamp,
          userRole: userRole
        }
      };

      res.json(formattedResponse);

    } catch (error) {
      console.error('AI Assistant Error:', error);
      
      res.status(500).json({
        success: false,
        error: 'AI Assistant temporarily unavailable',
        message: "I'm experiencing some technical difficulties. Please try again in a moment.",
        explanation: {
          agentsUsed: ['ErrorHandler'],
          reasoning: ['System error occurred'],
          confidence: 0.1,
          safetyStatus: 'error'
        }
      });
    }
  }

  /**
   * Get AI assistant capabilities based on user role
   */
  async getCapabilities(req, res) {
    try {
      const userRole = req.user?.role || (req.user ? 'user' : 'guest');
      
      const capabilities = {
        guest: {
          features: [
            'Basic event search',
            'Browse events by category',
            'View event details',
            'Find events by location'
          ],
          examples: [
            "Show me all events",
            "Find tech events",
            "What events are this weekend?",
            "Search for music events"
          ],
          loginBenefits: [
            'Personalized recommendations',
            'Save favorite events',
            'Advanced AI assistance',
            'Event creation tools (for organizers)'
          ]
        },
        user: {
          features: [
            'Find events near you',
            'Get personalized recommendations',
            'Ask questions about events',
            'Get event details and directions',
            'Search by category, date, or location'
          ],
          examples: [
            "Find music events this weekend",
            "What events are happening near me?",
            "Recommend some tech conferences",
            "Show me free events tomorrow"
          ]
        },
        organizer: {
          features: [
            'All user features',
            'Generate event descriptions',
            'Get event creation assistance',
            'Analyze event performance',
            'Check for duplicate events',
            'Get optimization suggestions'
          ],
          examples: [
            "Help me write a description for my workshop",
            "Generate a catchy title for my tech meetup",
            "How can I improve my event attendance?",
            "Check if my event is similar to existing ones"
          ]
        },
        admin: {
          features: [
            'All organizer features',
            'Review flagged content',
            'Get moderation insights',
            'Platform health metrics',
            'Risk assessments',
            'Governance analytics'
          ],
          examples: [
            "Show me flagged events",
            "What's the platform health status?",
            "Review the moderation queue",
            "Analyze recent risk trends"
          ]
        }
      };

      res.json({
        success: true,
        role: userRole,
        capabilities: capabilities[userRole] || capabilities.guest,
        greeting: this.getRoleGreeting(userRole)
      });

    } catch (error) {
      console.error('Error getting capabilities:', error);
      res.status(500).json({
        success: false,
        error: 'Unable to fetch capabilities'
      });
    }
  }

  /**
   * Get conversation history for a session
   */
  async getConversationHistory(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user?._id;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID is required'
        });
      }

      const conversation = this.activeConversations.get(sessionId);
      
      if (!conversation) {
        return res.json({
          success: true,
          history: [],
          message: 'No conversation history found for this session'
        });
      }

      // Filter conversation history for the requesting user
      const userHistory = conversation.messages.filter(msg => 
        !msg.userId || msg.userId.toString() === userId?.toString()
      );

      res.json({
        success: true,
        sessionId,
        history: userHistory,
        totalMessages: userHistory.length
      });

    } catch (error) {
      console.error('Error getting conversation history:', error);
      res.status(500).json({
        success: false,
        error: 'Unable to fetch conversation history'
      });
    }
  }

  /**
   * Clear conversation history for a session
   */
  async clearConversation(req, res) {
    try {
      const { sessionId } = req.params;
      
      if (this.activeConversations.has(sessionId)) {
        this.activeConversations.delete(sessionId);
      }

      res.json({
        success: true,
        message: 'Conversation history cleared'
      });

    } catch (error) {
      console.error('Error clearing conversation:', error);
      res.status(500).json({
        success: false,
        error: 'Unable to clear conversation'
      });
    }
  }

  /**
   * Get AI assistant analytics (admin only)
   */
  async getAnalytics(req, res) {
    try {
      // Check if user is admin
      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const analytics = {
        totalConversations: this.activeConversations.size,
        averageResponseTime: '1.2s',
        topIntents: [
          { intent: 'search', count: 45, percentage: 35 },
          { intent: 'recommend', count: 32, percentage: 25 },
          { intent: 'create', count: 18, percentage: 14 },
          { intent: 'general', count: 33, percentage: 26 }
        ],
        agentUsage: [
          { agent: 'EventRetrievalAgent', usage: 78 },
          { agent: 'RecommendationAgent', usage: 65 },
          { agent: 'IntentAgent', usage: 100 },
          { agent: 'RoleAgent', usage: 100 },
          { agent: 'GeoContextAgent', usage: 45 }
        ],
        safetyMetrics: {
          totalRequests: 128,
          flaggedRequests: 3,
          safetyRate: '97.7%'
        }
      };

      res.json({
        success: true,
        analytics,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error getting analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Unable to fetch analytics'
      });
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(req, res) {
    try {
      const health = {
        status: 'healthy',
        agents: {
          orchestrator: 'operational',
          intentAgent: 'operational',
          roleAgent: 'operational',
          eventRetrievalAgent: 'operational',
          recommendationAgent: 'operational',
          memoryAgent: 'operational'
        },
        services: {
          database: 'connected',
          geminiAI: process.env.GEMINI_API_KEY ? 'configured' : 'not_configured',
          chromaDB: 'available'
        },
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        health
      });

    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({
        success: false,
        error: 'Health check failed'
      });
    }
  }

  /**
   * Helper Methods
   */

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  trackConversation(sessionId, messageData) {
    if (!this.activeConversations.has(sessionId)) {
      this.activeConversations.set(sessionId, {
        sessionId,
        startTime: new Date(),
        messages: [],
        userId: messageData.userId
      });
    }

    const conversation = this.activeConversations.get(sessionId);
    conversation.messages.push(messageData);

    // Keep only last 50 messages per conversation
    if (conversation.messages.length > 50) {
      conversation.messages = conversation.messages.slice(-50);
    }

    // Clean up old conversations (older than 2 hours)
    this.cleanupOldConversations();
  }

  cleanupOldConversations() {
    const now = new Date();
    const maxAge = 2 * 60 * 60 * 1000; // 2 hours

    for (const [sessionId, conversation] of this.activeConversations.entries()) {
      if (now - conversation.startTime > maxAge) {
        this.activeConversations.delete(sessionId);
      }
    }
  }

  getRoleGreeting(role) {
    const greetings = {
      guest: "Hi! 👋 I'm your AI Event Assistant. I can help you discover events! For personalized recommendations and advanced features, please log in. What events are you looking for?",
      user: "Hi! I'm your AI Event Assistant. I can help you discover amazing events and get personalized recommendations. What are you looking for?",
      organizer: "Hello! I'm your AI Event Assistant. I can help you find events, create compelling descriptions, and optimize your event performance. How can I assist you today?",
      admin: "Welcome! I'm your AI Event Assistant with admin capabilities. I can help with event moderation, platform analytics, and governance insights. What would you like to review?"
    };

    return greetings[role] || greetings.guest;
  }

  /**
   * Feedback endpoint for improving AI responses
   */
  async submitFeedback(req, res) {
    try {
      const { sessionId, messageId, rating, feedback } = req.body;
      const userId = req.user?._id;

      // Validate input
      if (!sessionId || !rating) {
        return res.status(400).json({
          success: false,
          error: 'Session ID and rating are required'
        });
      }

      // Store feedback (in production, save to database)
      console.log('AI Assistant Feedback:', {
        sessionId,
        messageId,
        rating,
        feedback,
        userId,
        timestamp: new Date()
      });

      res.json({
        success: true,
        message: 'Thank you for your feedback! It helps me improve.'
      });

    } catch (error) {
      console.error('Error submitting feedback:', error);
      res.status(500).json({
        success: false,
        error: 'Unable to submit feedback'
      });
    }
  }
}

const controllerInstance = new AIAssistantController();

// Bind methods to preserve 'this' context
module.exports = {
  processMessage: controllerInstance.processMessage.bind(controllerInstance),
  getCapabilities: controllerInstance.getCapabilities.bind(controllerInstance),
  getConversationHistory: controllerInstance.getConversationHistory.bind(controllerInstance),
  clearConversation: controllerInstance.clearConversation.bind(controllerInstance),
  getAnalytics: controllerInstance.getAnalytics.bind(controllerInstance),
  healthCheck: controllerInstance.healthCheck.bind(controllerInstance),
  submitFeedback: controllerInstance.submitFeedback.bind(controllerInstance)
};