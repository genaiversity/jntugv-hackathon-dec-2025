/**
 * MEMORY AGENT
 * Manages user context, preferences, and conversation history
 */

const User = require('../../models/User');

class MemoryAgent {
  constructor() {
    this.shortTermMemory = new Map(); // In-memory storage for current session
    this.memoryRetentionDays = 30; // How long to keep user interaction history
    this.maxInteractionsPerUser = 100; // Limit stored interactions per user
    
    this.defaultPreferences = {
      categories: [],
      locations: [],
      timePreferences: [],
      priceRange: { min: 0, max: 1000 },
      notificationSettings: {
        email: true,
        push: false,
        frequency: 'weekly'
      }
    };
  }

  /**
   * Get user context including preferences and history
   */
  async getUserContext(userId) {
    try {
      if (!userId) {
        return this.getAnonymousContext();
      }

      // Check short-term memory first
      const sessionKey = `session_${userId}`;
      if (this.shortTermMemory.has(sessionKey)) {
        const sessionData = this.shortTermMemory.get(sessionKey);
        // Merge with persistent data
        const persistentData = await this.getPersistentUserData(userId);
        return this.mergeContextData(sessionData, persistentData);
      }

      // Load from database
      const userContext = await this.loadUserContext(userId);
      
      // Initialize short-term memory for this session
      this.shortTermMemory.set(sessionKey, {
        userId,
        sessionStart: new Date(),
        currentConversation: [],
        temporaryPreferences: {}
      });

      return userContext;

    } catch (error) {
      console.error('Error getting user context:', error);
      return this.getDefaultContext(userId);
    }
  }

  /**
   * Update user context with new interaction data
   */
  async updateUserContext(userId, interactionData) {
    try {
      if (!userId) return; // Skip for anonymous users

      // Update short-term memory
      await this.updateShortTermMemory(userId, interactionData);
      
      // Update persistent storage
      await this.updatePersistentMemory(userId, interactionData);
      
      // Learn from interaction to update preferences
      await this.learnFromInteraction(userId, interactionData);

    } catch (error) {
      console.error('Error updating user context:', error);
    }
  }

  /**
   * Load user context from database
   */
  async loadUserContext(userId) {
    try {
      const user = await User.findById(userId).lean();
      if (!user) {
        return this.getDefaultContext(userId);
      }

      // Extract user preferences and history
      const context = {
        userId,
        preferences: this.extractUserPreferences(user),
        history: this.extractUserHistory(user),
        profile: {
          name: user.name,
          email: user.email,
          role: user.role,
          joinDate: user.createdAt
        },
        lastActive: new Date(),
        conversationContext: []
      };

      return context;

    } catch (error) {
      console.error('Error loading user context:', error);
      return this.getDefaultContext(userId);
    }
  }

  /**
   * Extract user preferences from user document
   */
  extractUserPreferences(user) {
    // If user has explicit preferences stored
    if (user.preferences) {
      return {
        ...this.defaultPreferences,
        ...user.preferences
      };
    }

    // Infer preferences from user activity (if available)
    const inferredPreferences = this.inferPreferencesFromActivity(user);
    
    return {
      ...this.defaultPreferences,
      ...inferredPreferences
    };
  }

  /**
   * Extract user interaction history
   */
  extractUserHistory(user) {
    // In a full implementation, this would come from a separate interactions collection
    // For now, return empty array - this would be populated from user's event interactions
    return user.interactionHistory || [];
  }

  /**
   * Infer preferences from user activity
   */
  inferPreferencesFromActivity(user) {
    const preferences = {};
    
    // This would analyze user's past event registrations, searches, etc.
    // For now, return empty preferences
    
    return preferences;
  }

  /**
   * Update short-term memory for current session
   */
  async updateShortTermMemory(userId, interactionData) {
    const sessionKey = `session_${userId}`;
    const sessionData = this.shortTermMemory.get(sessionKey) || {
      userId,
      sessionStart: new Date(),
      currentConversation: [],
      temporaryPreferences: {}
    };

    // Add to conversation history
    sessionData.currentConversation.push({
      timestamp: new Date(),
      query: interactionData.query,
      intent: interactionData.intent,
      response: interactionData.response
    });

    // Keep only last 10 interactions in short-term memory
    if (sessionData.currentConversation.length > 10) {
      sessionData.currentConversation = sessionData.currentConversation.slice(-10);
    }

    // Update temporary preferences based on current session
    this.updateTemporaryPreferences(sessionData, interactionData);

    this.shortTermMemory.set(sessionKey, sessionData);
  }

  /**
   * Update persistent memory in database
   */
  async updatePersistentMemory(userId, interactionData) {
    try {
      // Create interaction record
      const interaction = {
        timestamp: new Date(),
        query: interactionData.query,
        intent: interactionData.intent?.category,
        response: interactionData.response,
        satisfaction: null // Could be updated later with user feedback
      };

      // Update user document with new interaction
      await User.findByIdAndUpdate(userId, {
        $push: {
          interactionHistory: {
            $each: [interaction],
            $slice: -this.maxInteractionsPerUser // Keep only last N interactions
          }
        },
        $set: {
          lastActive: new Date()
        }
      });

    } catch (error) {
      console.error('Error updating persistent memory:', error);
    }
  }

  /**
   * Learn from user interaction to update preferences
   */
  async learnFromInteraction(userId, interactionData) {
    try {
      const learningUpdates = {};

      // Learn from search queries
      if (interactionData.intent?.category === 'search') {
        const extractedCategories = this.extractCategoriesFromQuery(interactionData.query);
        if (extractedCategories.length > 0) {
          learningUpdates['preferences.categories'] = extractedCategories;
        }

        const extractedLocations = this.extractLocationsFromQuery(interactionData.query);
        if (extractedLocations.length > 0) {
          learningUpdates['preferences.locations'] = extractedLocations;
        }
      }

      // Learn from recommendation interactions
      if (interactionData.intent?.category === 'recommend') {
        // Track what types of recommendations the user engages with
        learningUpdates.lastRecommendationRequest = new Date();
      }

      // Apply learning updates
      if (Object.keys(learningUpdates).length > 0) {
        await User.findByIdAndUpdate(userId, {
          $addToSet: learningUpdates
        });
      }

    } catch (error) {
      console.error('Error learning from interaction:', error);
    }
  }

  /**
   * Update temporary preferences based on current session
   */
  updateTemporaryPreferences(sessionData, interactionData) {
    // Extract preferences from current interaction
    if (interactionData.intent?.filters) {
      const filters = interactionData.intent.filters;
      
      if (filters.categories) {
        sessionData.temporaryPreferences.categories = [
          ...(sessionData.temporaryPreferences.categories || []),
          ...filters.categories
        ];
      }
      
      if (filters.location) {
        sessionData.temporaryPreferences.locations = [
          ...(sessionData.temporaryPreferences.locations || []),
          ...filters.location
        ];
      }
    }
  }

  /**
   * Extract categories from user query
   */
  extractCategoriesFromQuery(query) {
    const categories = [];
    const lowerQuery = query.toLowerCase();
    
    const categoryKeywords = {
      'technology': ['tech', 'ai', 'software', 'coding', 'programming', 'digital'],
      'music': ['music', 'concert', 'band', 'singer', 'performance'],
      'sports': ['sports', 'game', 'match', 'tournament', 'fitness'],
      'food': ['food', 'restaurant', 'cooking', 'culinary', 'dining'],
      'art': ['art', 'gallery', 'exhibition', 'painting', 'sculpture'],
      'business': ['business', 'networking', 'professional', 'career']
    };

    Object.keys(categoryKeywords).forEach(category => {
      if (categoryKeywords[category].some(keyword => lowerQuery.includes(keyword))) {
        categories.push(category);
      }
    });

    return categories;
  }

  /**
   * Extract locations from user query
   */
  extractLocationsFromQuery(query) {
    const locations = [];
    const lowerQuery = query.toLowerCase();
    
    // Simple location extraction - in production, use more sophisticated NLP
    const locationPatterns = [
      /in ([a-zA-Z\s]+)/g,
      /near ([a-zA-Z\s]+)/g,
      /at ([a-zA-Z\s]+)/g
    ];

    locationPatterns.forEach(pattern => {
      const matches = query.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const location = match.replace(/^(in|near|at)\s+/i, '').trim();
          if (location.length > 2) {
            locations.push(location);
          }
        });
      }
    });

    return locations;
  }

  /**
   * Get context for anonymous users
   */
  getAnonymousContext() {
    return {
      userId: null,
      preferences: this.defaultPreferences,
      history: [],
      profile: null,
      lastActive: new Date(),
      conversationContext: [],
      isAnonymous: true
    };
  }

  /**
   * Get default context when user data is unavailable
   */
  getDefaultContext(userId) {
    return {
      userId,
      preferences: this.defaultPreferences,
      history: [],
      profile: null,
      lastActive: new Date(),
      conversationContext: []
    };
  }

  /**
   * Get persistent user data from database
   */
  async getPersistentUserData(userId) {
    try {
      const user = await User.findById(userId).lean();
      return {
        preferences: this.extractUserPreferences(user),
        history: this.extractUserHistory(user),
        profile: user ? {
          name: user.name,
          email: user.email,
          role: user.role,
          joinDate: user.createdAt
        } : null
      };
    } catch (error) {
      console.error('Error getting persistent user data:', error);
      return {
        preferences: this.defaultPreferences,
        history: [],
        profile: null
      };
    }
  }

  /**
   * Merge session data with persistent data
   */
  mergeContextData(sessionData, persistentData) {
    return {
      userId: sessionData.userId,
      preferences: {
        ...persistentData.preferences,
        ...sessionData.temporaryPreferences
      },
      history: persistentData.history,
      profile: persistentData.profile,
      lastActive: new Date(),
      conversationContext: sessionData.currentConversation,
      sessionStart: sessionData.sessionStart
    };
  }

  /**
   * Clear old session data (cleanup method)
   */
  cleanupOldSessions() {
    const now = new Date();
    const maxAge = 2 * 60 * 60 * 1000; // 2 hours

    for (const [key, sessionData] of this.shortTermMemory.entries()) {
      if (now - sessionData.sessionStart > maxAge) {
        this.shortTermMemory.delete(key);
      }
    }
  }

  /**
   * Get conversation context for maintaining chat continuity
   */
  getConversationContext(userId) {
    if (!userId) return [];

    const sessionKey = `session_${userId}`;
    const sessionData = this.shortTermMemory.get(sessionKey);
    
    return sessionData ? sessionData.currentConversation : [];
  }

  /**
   * Update user preferences explicitly (when user provides feedback)
   */
  async updateUserPreferences(userId, newPreferences) {
    try {
      await User.findByIdAndUpdate(userId, {
        $set: {
          preferences: {
            ...this.defaultPreferences,
            ...newPreferences
          },
          preferencesUpdated: new Date()
        }
      });

      // Update short-term memory as well
      const sessionKey = `session_${userId}`;
      const sessionData = this.shortTermMemory.get(sessionKey);
      if (sessionData) {
        sessionData.temporaryPreferences = {
          ...sessionData.temporaryPreferences,
          ...newPreferences
        };
        this.shortTermMemory.set(sessionKey, sessionData);
      }

    } catch (error) {
      console.error('Error updating user preferences:', error);
    }
  }

  /**
   * Get user learning insights (for analytics)
   */
  async getUserLearningInsights(userId) {
    try {
      const user = await User.findById(userId).lean();
      if (!user || !user.interactionHistory) {
        return { totalInteractions: 0, topCategories: [], learningTrends: [] };
      }

      const interactions = user.interactionHistory;
      const categoryCount = {};
      
      interactions.forEach(interaction => {
        if (interaction.intent) {
          categoryCount[interaction.intent] = (categoryCount[interaction.intent] || 0) + 1;
        }
      });

      const topCategories = Object.entries(categoryCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([category, count]) => ({ category, count }));

      return {
        totalInteractions: interactions.length,
        topCategories,
        learningTrends: this.analyzeLearningTrends(interactions)
      };

    } catch (error) {
      console.error('Error getting user learning insights:', error);
      return { totalInteractions: 0, topCategories: [], learningTrends: [] };
    }
  }

  /**
   * Analyze learning trends from user interactions
   */
  analyzeLearningTrends(interactions) {
    // Simple trend analysis - in production, use more sophisticated analytics
    const recentInteractions = interactions.slice(-20);
    const trends = [];

    if (recentInteractions.length > 10) {
      const recentIntents = recentInteractions.map(i => i.intent);
      const mostCommonIntent = this.getMostCommon(recentIntents);
      
      if (mostCommonIntent) {
        trends.push(`Frequently asks about ${mostCommonIntent}`);
      }
    }

    return trends;
  }

  /**
   * Get most common element in array
   */
  getMostCommon(arr) {
    const counts = {};
    arr.forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
    });

    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }
}

module.exports = MemoryAgent;