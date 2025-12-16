/**
 * MULTI-AGENT AI ASSISTANT ORCHESTRATOR
 * Coordinates all 10 AI agents for intelligent event management
 */

const IntentAgent = require('./IntentAgent');
const RoleAgent = require('./RoleAgent');
const EventRetrievalAgent = require('./EventRetrievalAgent');
const GeoContextAgent = require('./GeoContextAgent');
const RecommendationAgent = require('./RecommendationAgent');
const OrganizerAssistantAgent = require('./OrganizerAssistantAgent');
const SafetyModerationAgent = require('./SafetyModerationAgent');
const AdminGovernanceAgent = require('./AdminGovernanceAgent');
const MemoryAgent = require('./MemoryAgent');
const aiService = require('../aiService');

class AgentOrchestrator {
  constructor() {
    // Initialize all agents
    this.intentAgent = new IntentAgent();
    this.roleAgent = new RoleAgent();
    this.eventRetrievalAgent = new EventRetrievalAgent();
    this.geoContextAgent = new GeoContextAgent();
    this.recommendationAgent = new RecommendationAgent();
    this.organizerAssistantAgent = new OrganizerAssistantAgent();
    this.safetyModerationAgent = new SafetyModerationAgent();
    this.adminGovernanceAgent = new AdminGovernanceAgent();
    this.memoryAgent = new MemoryAgent();

    this.executionLog = [];
  }

  /**
   * Main orchestration method - processes user requests through multi-agent pipeline
   */
  async processRequest(userInput) {
    const startTime = Date.now();
    this.executionLog = [];
    
    try {
      // STEP 1: Intent Understanding
      const intentResult = await this.intentAgent.analyzeIntent(userInput.message);
      this.logExecution('IntentAgent', intentResult);

      // STEP 2: Role Awareness
      const roleContext = await this.roleAgent.determineRole(userInput.userId, userInput.role);
      this.logExecution('RoleAgent', roleContext);

      // STEP 3: Memory Retrieval (get user context)
      const userMemory = await this.memoryAgent.getUserContext(userInput.userId);
      this.logExecution('MemoryAgent', { action: 'retrieve', context: userMemory });

      // STEP 4: Route to appropriate agent workflow based on intent and role
      let response;
      
      // Handle guest users with limited functionality
      if (roleContext.role === 'guest') {
        response = await this.handleGuestWorkflow(userInput, intentResult, roleContext);
      } else if (intentResult.category === 'search' || intentResult.category === 'find') {
        response = await this.handleSearchWorkflow(userInput, intentResult, roleContext, userMemory);
      } else if (intentResult.category === 'create' && roleContext.canCreateEvents) {
        response = await this.handleCreateWorkflow(userInput, intentResult, roleContext);
      } else if (intentResult.category === 'moderate' && roleContext.isAdmin) {
        response = await this.handleModerationWorkflow(userInput, intentResult, roleContext);
      } else if (intentResult.category === 'recommend') {
        response = await this.handleRecommendationWorkflow(userInput, intentResult, roleContext, userMemory);
      } else if (intentResult.category === 'analyze' && roleContext.canAnalyze) {
        response = await this.handleAnalysisWorkflow(userInput, intentResult, roleContext);
      } else {
        response = await this.handleGeneralWorkflow(userInput, intentResult, roleContext);
      }

      // STEP 5: Update user memory
      await this.memoryAgent.updateUserContext(userInput.userId, {
        query: userInput.message,
        intent: intentResult,
        response: response.message,
        timestamp: new Date()
      });

      // STEP 6: Final response assembly
      const finalResponse = {
        message: response.message,
        data: response.data || {},
        explanation: {
          agentsUsed: this.executionLog.map(log => log.agent),
          reasoning: response.reasoning || [],
          confidence: response.confidence || 0.8,
          safetyStatus: response.safetyStatus || 'safe'
        },
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };

      return finalResponse;

    } catch (error) {
      console.error('Agent Orchestrator Error:', error);
      return {
        message: "I'm experiencing some technical difficulties. Please try again in a moment.",
        data: {},
        explanation: {
          agentsUsed: ['ErrorHandler'],
          reasoning: ['System error occurred'],
          confidence: 0.1,
          safetyStatus: 'error'
        },
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * SEARCH WORKFLOW - Find events based on user query
   */
  async handleSearchWorkflow(userInput, intentResult, roleContext, userMemory) {
    // Geo-context analysis
    const geoContext = await this.geoContextAgent.analyzeLocation(userInput);
    this.logExecution('GeoContextAgent', geoContext);

    // Event retrieval with filters
    const events = await this.eventRetrievalAgent.searchEvents({
      query: userInput.message,
      location: geoContext.coordinates,
      radius: geoContext.radius,
      filters: intentResult.filters,
      userPreferences: userMemory.preferences
    });
    this.logExecution('EventRetrievalAgent', { found: events.length });

    // Safety check on results
    const safetyCheck = await this.safetyModerationAgent.validateResults(events);
    this.logExecution('SafetyModerationAgent', safetyCheck);

    // Personalized recommendations
    const recommendations = await this.recommendationAgent.rankEvents(events, {
      userHistory: userMemory.history,
      preferences: userMemory.preferences,
      location: geoContext.coordinates
    });
    this.logExecution('RecommendationAgent', { ranked: recommendations.length });

    // Generate intelligent response using AI
    const aiResponse = await this.generateIntelligentResponse(
      userInput.message,
      recommendations,
      geoContext,
      'search'
    );

    return {
      message: aiResponse,
      data: {
        events: recommendations.slice(0, 5),
        totalFound: events.length,
        location: geoContext.locationName
      },
      reasoning: recommendations.slice(0, 3).map(event => event.explanation),
      confidence: 0.9,
      safetyStatus: safetyCheck.status
    };
  }

  /**
   * CREATE WORKFLOW - Help organizers create events
   */
  async handleCreateWorkflow(userInput, intentResult, roleContext) {
    const assistance = await this.organizerAssistantAgent.generateEventContent(userInput.message);
    this.logExecution('OrganizerAssistantAgent', assistance);

    // Safety moderation on generated content
    const moderationResult = await this.safetyModerationAgent.moderateContent(assistance.content);
    this.logExecution('SafetyModerationAgent', moderationResult);

    return {
      message: assistance.response,
      data: {
        suggestions: assistance.suggestions,
        generatedContent: assistance.content
      },
      reasoning: assistance.reasoning,
      confidence: assistance.confidence,
      safetyStatus: moderationResult.status
    };
  }

  /**
   * MODERATION WORKFLOW - Admin governance and review
   */
  async handleModerationWorkflow(userInput, intentResult, roleContext) {
    const governance = await this.adminGovernanceAgent.analyzeRequest(userInput.message);
    this.logExecution('AdminGovernanceAgent', governance);

    return {
      message: governance.response,
      data: governance.data,
      reasoning: governance.reasoning,
      confidence: governance.confidence,
      safetyStatus: 'admin_action'
    };
  }

  /**
   * RECOMMENDATION WORKFLOW - Personalized suggestions
   */
  async handleRecommendationWorkflow(userInput, intentResult, roleContext, userMemory) {
    // Get user's location context
    const geoContext = await this.geoContextAgent.analyzeLocation(userInput);
    this.logExecution('GeoContextAgent', geoContext);

    // Fetch relevant events
    const events = await this.eventRetrievalAgent.getRecommendationCandidates({
      location: geoContext.coordinates,
      radius: geoContext.radius || 25,
      userPreferences: userMemory.preferences
    });
    this.logExecution('EventRetrievalAgent', { candidates: events.length });

    // Generate personalized recommendations
    const recommendations = await this.recommendationAgent.generatePersonalizedRecommendations(events, {
      userHistory: userMemory.history,
      preferences: userMemory.preferences,
      location: geoContext.coordinates,
      currentContext: intentResult.context
    });
    this.logExecution('RecommendationAgent', { recommendations: recommendations.length });

    // Generate intelligent recommendation response
    const aiResponse = await this.generateIntelligentResponse(
      userInput.message,
      recommendations,
      geoContext,
      'recommendation'
    );

    return {
      message: aiResponse,
      data: {
        recommendations: recommendations.slice(0, 5),
        reasoning: recommendations.map(r => r.explanation)
      },
      reasoning: recommendations.slice(0, 3).map(r => r.explanation),
      confidence: 0.85,
      safetyStatus: 'safe'
    };
  }

  /**
   * ANALYSIS WORKFLOW - Data insights for organizers/admins
   */
  async handleAnalysisWorkflow(userInput, intentResult, roleContext) {
    let analysisResult;

    if (roleContext.isAdmin) {
      analysisResult = await this.adminGovernanceAgent.generateInsights(userInput.message);
      this.logExecution('AdminGovernanceAgent', analysisResult);
    } else if (roleContext.canCreateEvents) {
      analysisResult = await this.organizerAssistantAgent.generateAnalytics(userInput.message);
      this.logExecution('OrganizerAssistantAgent', analysisResult);
    }

    return {
      message: analysisResult.response,
      data: analysisResult.data,
      reasoning: analysisResult.reasoning,
      confidence: analysisResult.confidence,
      safetyStatus: 'safe'
    };
  }

  /**
   * ENHANCED GUEST WORKFLOW - Accurate responses for non-authenticated users
   */
  async handleGuestWorkflow(userInput, intentResult, roleContext) {
    try {
      // For guest users, provide comprehensive event search functionality
      if (intentResult.category === 'search' || intentResult.category === 'find') {
        // Enhanced geo-context analysis
        const geoContext = await this.geoContextAgent.analyzeLocation(userInput);
        this.logExecution('GeoContextAgent', geoContext);

        // Comprehensive event retrieval with better filtering
        const events = await this.eventRetrievalAgent.searchEvents({
          query: userInput.message,
          location: geoContext.coordinates,
          radius: geoContext.radius || 50, // Wider search for guests
          filters: intentResult.filters,
          userPreferences: null,
          includeAll: true // Include all relevant events for guests
        });
        this.logExecution('EventRetrievalAgent', { found: events.length });

        // Safety check on results
        const safetyCheck = await this.safetyModerationAgent.validateResults(events);
        this.logExecution('SafetyModerationAgent', safetyCheck);

        // Smart ranking for guests (by relevance, date, popularity)
        const smartRanking = events.slice(0, 8).map((event, index) => ({
          ...event,
          explanation: this.generateGuestEventExplanation(event, userInput.message, index)
        }));

        // Generate contextual AI response
        const contextualPrompt = this.buildGuestSearchPrompt(userInput.message, smartRanking, geoContext);
        const aiResponse = await aiService.generateResponse(contextualPrompt, { maxTokens: 400 });

        return {
          message: aiResponse,
          data: {
            events: smartRanking.slice(0, 5),
            totalFound: events.length,
            location: geoContext.locationName,
            searchTips: this.getGuestSearchTips(userInput.message),
            loginPrompt: "Log in for personalized recommendations and to save favorites!"
          },
          reasoning: ['Enhanced guest search with AI assistance', 'Contextual event matching'],
          confidence: 0.85,
          safetyStatus: safetyCheck.status
        };
      } else if (intentResult.category === 'recommend') {
        // Provide general recommendations for guests
        const popularEvents = await this.eventRetrievalAgent.getPopularEvents({ limit: 5 });
        this.logExecution('EventRetrievalAgent', { popularEvents: popularEvents.length });

        const recommendationPrompt = this.buildGuestRecommendationPrompt(userInput.message, popularEvents);
        const aiResponse = await aiService.generateResponse(recommendationPrompt, { maxTokens: 350 });

        return {
          message: aiResponse,
          data: {
            popularEvents: popularEvents,
            loginPrompt: true,
            guestCapabilities: ['Browse popular events', 'Search by category', 'View event details']
          },
          reasoning: ['Guest recommendations based on popular events', 'Encouraging login for personalization'],
          confidence: 0.8,
          safetyStatus: 'safe'
        };
      } else if (intentResult.category === 'create') {
        // Help guests with event creation guidance
        const creationPrompt = this.buildGuestCreationPrompt(userInput.message);
        const aiResponse = await aiService.generateResponse(creationPrompt, { maxTokens: 300 });

        return {
          message: aiResponse,
          data: {
            creationTips: [
              'Choose a clear, descriptive title',
              'Include date, time, and location',
              'Explain what attendees will gain',
              'Add contact information'
            ],
            loginPrompt: "Log in to access our event creation tools and AI-powered description generator!"
          },
          reasoning: ['Guest event creation guidance', 'Promoting organizer features'],
          confidence: 0.9,
          safetyStatus: 'safe'
        };
      } else {
        // Enhanced general conversation for guests
        const generalPrompt = this.buildGuestGeneralPrompt(userInput.message);
        const aiResponse = await aiService.generateResponse(generalPrompt, { maxTokens: 300 });

        return {
          message: aiResponse,
          data: {
            guestCapabilities: [
              'Search for events by keyword or category',
              'Find events by location and date',
              'Browse popular and trending events',
              'Get event creation guidance',
              'Ask questions about events'
            ],
            loginBenefits: [
              'Personalized AI recommendations',
              'Save and track favorite events',
              'Create and manage your own events',
              'Advanced search and filtering',
              'AI-powered event descriptions'
            ]
          },
          reasoning: ['Enhanced guest interaction with contextual AI', 'Comprehensive feature overview'],
          confidence: 0.85,
          safetyStatus: 'safe'
        };
      }
    } catch (error) {
      console.error('Guest workflow error:', error);
      
      // Provide helpful fallback even on errors
      const fallbackMessage = this.getIntelligentGuestFallback(userInput.message);
      
      return {
        message: fallbackMessage,
        data: {
          error: false, // Don't show as error to user
          helpfulTips: [
            'Try searching for specific event types like "tech events" or "music concerts"',
            'Include location in your search like "events in downtown"',
            'Ask about popular events or upcoming activities'
          ],
          loginPrompt: true
        },
        reasoning: ['Intelligent fallback for guest user'],
        confidence: 0.6,
        safetyStatus: 'safe'
      };
    }
  }

  /**
   * GENERAL WORKFLOW - Default conversation handling
   */
  async handleGeneralWorkflow(userInput, intentResult, roleContext) {
    // Generate intelligent conversational response
    const aiResponse = await this.generateIntelligentResponse(
      userInput.message,
      null,
      null,
      'general',
      roleContext
    );

    return {
      message: aiResponse,
      data: {
        capabilities: this.getRoleCapabilities(roleContext)
      },
      reasoning: ['General conversation with AI assistance'],
      confidence: 0.7,
      safetyStatus: 'safe'
    };
  }

  /**
   * Generate intelligent responses using AI service
   */
  async generateIntelligentResponse(userMessage, data, geoContext, responseType, roleContext = null) {
    try {
      let context = '';
      let prompt = '';

      switch (responseType) {
        case 'search':
        case 'guest_search':
          // If no events found, use direct fallback for better responses
          if (!data || data.length === 0) {
            return aiService.getStaticFallback(userMessage);
          }
          
          context = this.formatEventsForAI(data);
          prompt = `
            User asked: "${userMessage}"
            
            I found ${data?.length || 0} events${geoContext?.locationName ? ` near ${geoContext.locationName}` : ''}:
            ${context}
            
            Please provide a helpful, conversational response that:
            - Summarizes what was found
            - Highlights the most relevant events
            - Explains why these events match their request
            - Encourages engagement
            ${responseType === 'guest_search' ? '- Mentions that logging in provides personalized recommendations' : ''}
            
            Keep it friendly and concise.
          `;
          break;

        case 'recommendation':
          context = this.formatEventsForAI(data);
          prompt = `
            User asked: "${userMessage}"
            
            Based on their preferences and location, I recommend these events:
            ${context}
            
            Please provide a personalized recommendation response that:
            - Explains why these events are good matches
            - Highlights unique aspects of the top recommendations
            - Shows understanding of their preferences
            - Encourages them to explore the events
            
            Be enthusiastic and helpful.
          `;
          break;

        case 'general':
          const roleInfo = roleContext ? `User role: ${roleContext.role || 'user'}` : '';
          prompt = `
            User said: "${userMessage}"
            ${roleInfo}
            
            You are an AI assistant for an event discovery platform. Respond naturally and helpfully to this message.
            
            You can help with:
            - Finding events
            - Getting recommendations
            - Creating events (for organizers)
            - Platform management (for admins)
            
            Be conversational, friendly, and offer specific help based on what they might need.
          `;
          break;

        default:
          prompt = `
            User message: "${userMessage}"
            
            Respond as a helpful AI assistant for an event platform. Be friendly and offer assistance.
          `;
      }

      const response = await aiService.generateResponse(prompt, { maxTokens: 300 });
      return response;

    } catch (error) {
      console.error('Error generating intelligent response:', error);
      // Use AI service's enhanced fallback instead of basic fallback
      return aiService.getStaticFallback(userMessage);
    }
  }

  formatEventsForAI(events) {
    if (!events || events.length === 0) {
      return 'No events found.';
    }

    return events.slice(0, 5).map((event, index) => {
      return `${index + 1}. ${event.title || event.name || 'Event'}
         - ${event.description ? event.description.substring(0, 100) + '...' : 'No description'}
         - Location: ${event.location || 'TBD'}
         - Date: ${event.date ? new Date(event.date).toLocaleDateString() : 'TBD'}
         ${event.explanation ? `- Why recommended: ${event.explanation}` : ''}`;
    }).join('\n\n');
  }

  getFallbackResponse(userMessage, responseType, data) {
    switch (responseType) {
      case 'search':
      case 'guest_search':
        if (data && data.length > 0) {
          return `I found ${data.length} event${data.length > 1 ? 's' : ''} for you! The top result is "${data[0].title || data[0].name}". ${responseType === 'guest_search' ? 'Log in for personalized recommendations!' : 'Would you like more details?'}`;
        }
        return "I couldn't find any events matching your search. Try different keywords or check back later for new events!";
      
      case 'recommendation':
        if (data && data.length > 0) {
          return `I recommend "${data[0].title || data[0].name}" - it looks like a great match for your interests! Would you like to see more recommendations?`;
        }
        return "I'd love to recommend events for you! Try searching for some events first so I can learn your preferences.";
      
      case 'general':
        return "Hello! I'm your AI Event Assistant. I can help you find events, get recommendations, and answer questions. What would you like to do?";
      
      default:
        return "I'm here to help you with events! What would you like to know?";
    }
  }

  /**
   * Helper Methods
   */
  logExecution(agent, result) {
    this.executionLog.push({
      agent,
      timestamp: new Date().toISOString(),
      result: typeof result === 'object' ? JSON.stringify(result).substring(0, 200) : result
    });
  }

  formatSearchResponse(events, geoContext) {
    if (events.length === 0) {
      return `I couldn't find any events matching your search${geoContext.locationName ? ` near ${geoContext.locationName}` : ''}. Try adjusting your search terms or expanding your location radius.`;
    }

    const topEvent = events[0];
    const locationText = geoContext.locationName ? ` near ${geoContext.locationName}` : '';
    
    return `I found ${events.length} event${events.length > 1 ? 's' : ''}${locationText}! Here's what I recommend:\n\n**${topEvent.title}**\n${topEvent.description.substring(0, 100)}...\n\n${topEvent.explanation}`;
  }

  formatRecommendationResponse(recommendations) {
    if (recommendations.length === 0) {
      return "I don't have enough information about your preferences yet. Try searching for some events first, and I'll learn what you like!";
    }

    const topRec = recommendations[0];
    return `Based on your interests, I highly recommend **${topRec.title}**!\n\n${topRec.explanation}\n\nWould you like to see more recommendations or get details about this event?`;
  }

  formatGuestSearchResponse(events, geoContext) {
    if (events.length === 0) {
      return `I couldn't find any events matching your search${geoContext.locationName ? ` near ${geoContext.locationName}` : ''}. Try different keywords or log in for personalized suggestions!`;
    }

    const topEvent = events[0];
    const locationText = geoContext.locationName ? ` near ${geoContext.locationName}` : '';
    
    return `I found ${events.length} event${events.length > 1 ? 's' : ''}${locationText}! Here's what I found:\n\n**${topEvent.title}**\n${topEvent.description ? topEvent.description.substring(0, 100) + '...' : 'Event details available'}\n\nLog in for personalized recommendations and to save your favorites!`;
  }

  getRoleCapabilities(roleContext) {
    const capabilities = ['Find events', 'Get recommendations', 'Ask questions'];
    
    if (roleContext.canCreateEvents) {
      capabilities.push('Create events', 'Generate descriptions', 'Get analytics');
    }
    
    if (roleContext.isAdmin) {
      capabilities.push('Review flagged content', 'View moderation insights', 'Manage platform');
    }
    
    return capabilities;
  }

  /**
   * Enhanced Guest Helper Methods
   */
  generateGuestEventExplanation(event, query, index) {
    const lowerQuery = query.toLowerCase();
    const lowerTitle = event.title?.toLowerCase() || '';
    const lowerDescription = event.description?.toLowerCase() || '';
    
    if (lowerQuery.includes('tech') && (lowerTitle.includes('tech') || lowerDescription.includes('tech'))) {
      return 'Matches your tech interest - great for networking and learning';
    }
    if (lowerQuery.includes('music') && (lowerTitle.includes('music') || lowerDescription.includes('music'))) {
      return 'Perfect music event - enjoy live performances and discover new artists';
    }
    if (lowerQuery.includes('weekend') && this.isWeekendEvent(event.date)) {
      return 'Happening this weekend - perfect timing for your schedule';
    }
    if (lowerQuery.includes('free') && event.price === 0) {
      return 'Free event - great value and open to everyone';
    }
    
    return index === 0 ? 'Top match for your search' : 'Relevant event matching your criteria';
  }

  buildGuestSearchPrompt(userMessage, events, geoContext) {
    const eventsList = events.slice(0, 3).map(event => 
      `• ${event.title} - ${event.location} on ${new Date(event.date).toLocaleDateString()}`
    ).join('\n');

    return `You are an AI assistant for an event discovery platform. A guest user (not logged in) asked: "${userMessage}"

I found ${events.length} events${geoContext?.locationName ? ` near ${geoContext.locationName}` : ''}:
${eventsList}

Provide a helpful, enthusiastic response that:
- Acknowledges their search and shows the best matches
- Explains why these events are relevant
- Encourages them to explore more or log in for personalized features
- Keeps a friendly, welcoming tone
- Mentions they can search for more specific types if needed

Be conversational and helpful, not robotic.`;
  }

  buildGuestRecommendationPrompt(userMessage, popularEvents) {
    const eventsList = popularEvents.slice(0, 3).map(event => 
      `• ${event.title} - ${event.description?.substring(0, 50)}...`
    ).join('\n');

    return `You are an AI assistant for an event discovery platform. A guest user asked: "${userMessage}"

Here are some popular events happening soon:
${eventsList}

Provide a friendly response that:
- Shows enthusiasm about helping them discover events
- Highlights the popular events briefly
- Explains that logging in would give them personalized recommendations
- Suggests they can also search for specific types of events
- Keeps an encouraging, helpful tone

Make it conversational and inviting.`;
  }

  buildGuestCreationPrompt(userMessage) {
    return `You are an AI assistant for an event discovery platform. A guest user asked about creating events: "${userMessage}"

Provide helpful guidance that:
- Shows enthusiasm for their event creation interest
- Gives 3-4 practical tips for creating great events
- Mentions that logging in gives access to AI-powered tools
- Encourages them to sign up to use the full event creation features
- Keeps a supportive, encouraging tone

Be helpful and motivating.`;
  }

  buildGuestGeneralPrompt(userMessage) {
    return `You are an AI assistant for an event discovery platform. A guest user said: "${userMessage}"

Provide a warm, helpful response that:
- Welcomes them to the platform
- Explains what you can help them with (finding events, getting info, etc.)
- Mentions the benefits of creating an account
- Asks what they're interested in or how you can help
- Keeps a friendly, conversational tone

Be welcoming and guide them toward using the platform.`;
  }

  getGuestSearchTips(query) {
    const tips = [];
    const lowerQuery = query.toLowerCase();
    
    if (!lowerQuery.includes('tech') && !lowerQuery.includes('music') && !lowerQuery.includes('art')) {
      tips.push('Try searching by category: "tech events", "music concerts", "art exhibitions"');
    }
    
    if (!lowerQuery.includes('weekend') && !lowerQuery.includes('today') && !lowerQuery.includes('tomorrow')) {
      tips.push('Add time filters: "this weekend", "next week", "today"');
    }
    
    if (!lowerQuery.includes('near') && !lowerQuery.includes('in ')) {
      tips.push('Include location: "events near me", "events in downtown"');
    }
    
    tips.push('Log in for personalized recommendations based on your interests');
    
    return tips.slice(0, 3);
  }

  getIntelligentGuestFallback(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('help') || lowerMessage.includes('what')) {
      return "I'm here to help you discover amazing events! I can search for events by type, location, or date. Try asking me things like 'find tech events this weekend' or 'show me music concerts near me'. For personalized recommendations and advanced features, consider creating an account!";
    }
    
    if (lowerMessage.includes('event') && lowerMessage.includes('create')) {
      return "I'd love to help you create an event! While I can give you some general tips as a guest, our full event creation tools with AI-powered descriptions are available when you log in. Would you like some basic event planning advice to get started?";
    }
    
    return "I'm your AI event assistant! I can help you find events, get information about activities in your area, and answer questions about our platform. What kind of events are you interested in? Try being specific like 'tech meetups' or 'weekend activities'!";
  }

  isWeekendEvent(dateString) {
    if (!dateString) return false;
    const date = new Date(dateString);
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }
}

module.exports = AgentOrchestrator;