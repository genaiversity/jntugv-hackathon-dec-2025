/**
 * RECOMMENDATION AGENT
 * Provides intelligent, personalized event recommendations with explanations
 */

const geminiService = require('../geminiService');

class RecommendationAgent {
  constructor() {
    this.weightings = {
      categoryMatch: 0.3,
      locationProximity: 0.25,
      timePreference: 0.2,
      behaviorHistory: 0.15,
      popularity: 0.1
    };

    this.categoryAffinities = {
      'technology': ['business', 'education', 'workshop'],
      'music': ['art', 'entertainment', 'festival'],
      'sports': ['fitness', 'outdoor', 'competition'],
      'food': ['culture', 'social', 'festival'],
      'art': ['culture', 'workshop', 'exhibition'],
      'business': ['technology', 'networking', 'education']
    };
  }

  /**
   * Rank events based on user preferences and context
   */
  async rankEvents(events, userContext) {
    if (!events.length) return [];

    const rankedEvents = await Promise.all(
      events.map(event => this.scoreEvent(event, userContext))
    );

    // Sort by total score descending
    return rankedEvents
      .sort((a, b) => b.totalScore - a.totalScore)
      .map(event => ({
        ...event,
        explanation: this.generateExplanation(event, userContext)
      }));
  }

  /**
   * Generate personalized recommendations
   */
  async generatePersonalizedRecommendations(events, userContext) {
    if (!events.length) return [];

    // First, rank all events
    const rankedEvents = await this.rankEvents(events, userContext);

    // Apply diversity to avoid recommending too many similar events
    const diverseRecommendations = this.applyDiversityFilter(rankedEvents);

    // Generate AI-enhanced explanations for top recommendations
    const enhancedRecommendations = await Promise.all(
      diverseRecommendations.slice(0, 10).map(async event => {
        const aiExplanation = await this.generateAIExplanation(event, userContext);
        return {
          ...event,
          aiExplanation,
          recommendationReason: this.getRecommendationReason(event, userContext)
        };
      })
    );

    return enhancedRecommendations;
  }

  /**
   * Score individual event based on user context
   */
  async scoreEvent(event, userContext) {
    const scores = {
      categoryMatch: this.calculateCategoryScore(event, userContext),
      locationProximity: this.calculateLocationScore(event, userContext),
      timePreference: this.calculateTimeScore(event, userContext),
      behaviorHistory: this.calculateBehaviorScore(event, userContext),
      popularity: this.calculatePopularityScore(event)
    };

    // Calculate weighted total score
    const totalScore = Object.keys(scores).reduce((total, key) => {
      return total + (scores[key] * this.weightings[key]);
    }, 0);

    return {
      ...event,
      scores,
      totalScore,
      normalizedScore: Math.min(totalScore, 1.0)
    };
  }

  /**
   * Calculate category match score
   */
  calculateCategoryScore(event, userContext) {
    const { preferences = {}, history = [] } = userContext;
    
    // Direct category preference match
    if (preferences.categories && preferences.categories.includes(event.category)) {
      return 1.0;
    }

    // Category affinity match
    if (preferences.categories) {
      for (const prefCategory of preferences.categories) {
        const affinities = this.categoryAffinities[prefCategory.toLowerCase()] || [];
        if (affinities.includes(event.category.toLowerCase())) {
          return 0.7;
        }
      }
    }

    // Historical category preference
    const historicalCategories = history
      .filter(h => h.action === 'attended' || h.action === 'interested')
      .map(h => h.category)
      .filter(Boolean);

    if (historicalCategories.includes(event.category)) {
      return 0.8;
    }

    return 0.1; // Base score for no match
  }

  /**
   * Calculate location proximity score
   */
  calculateLocationScore(event, userContext) {
    const { location } = userContext;
    
    if (!location || !event.locationCoords) return 0.5;

    // Calculate distance (assuming location is [longitude, latitude])
    const distance = this.calculateDistance(location, event.locationCoords.coordinates);
    
    // Score based on distance (closer = higher score)
    if (distance <= 5) return 1.0;
    if (distance <= 15) return 0.8;
    if (distance <= 30) return 0.6;
    if (distance <= 50) return 0.4;
    return 0.2;
  }

  /**
   * Calculate time preference score
   */
  calculateTimeScore(event, userContext) {
    const { preferences = {} } = userContext;
    
    if (!preferences.timePreferences) return 0.5;

    const eventDate = new Date(event.date);
    const eventHour = eventDate.getHours();
    const eventDay = eventDate.getDay(); // 0 = Sunday, 6 = Saturday

    let score = 0.5; // Base score

    // Time of day preferences
    if (preferences.timePreferences.includes('morning') && eventHour < 12) score += 0.3;
    if (preferences.timePreferences.includes('afternoon') && eventHour >= 12 && eventHour < 18) score += 0.3;
    if (preferences.timePreferences.includes('evening') && eventHour >= 18) score += 0.3;

    // Day of week preferences
    if (preferences.timePreferences.includes('weekday') && eventDay >= 1 && eventDay <= 5) score += 0.2;
    if (preferences.timePreferences.includes('weekend') && (eventDay === 0 || eventDay === 6)) score += 0.2;

    return Math.min(score, 1.0);
  }

  /**
   * Calculate behavior history score
   */
  calculateBehaviorScore(event, userContext) {
    const { history = [] } = userContext;
    
    if (!history.length) return 0.5;

    let score = 0.5;

    // Check for similar events in history
    const similarEvents = history.filter(h => 
      h.category === event.category || 
      h.location === event.location ||
      (h.organizer && event.organizer && h.organizer === event.organizer._id)
    );

    // Positive interactions boost score
    const positiveInteractions = similarEvents.filter(h => 
      h.action === 'attended' || h.action === 'interested' || h.rating >= 4
    );

    // Negative interactions reduce score
    const negativeInteractions = similarEvents.filter(h => 
      h.action === 'skipped' || h.rating <= 2
    );

    score += (positiveInteractions.length * 0.2);
    score -= (negativeInteractions.length * 0.3);

    return Math.max(0.1, Math.min(score, 1.0));
  }

  /**
   * Calculate popularity score
   */
  calculatePopularityScore(event) {
    const attendeeCount = event.attendees ? event.attendees.length : 0;
    
    // Normalize based on typical event sizes
    if (attendeeCount >= 100) return 1.0;
    if (attendeeCount >= 50) return 0.8;
    if (attendeeCount >= 20) return 0.6;
    if (attendeeCount >= 5) return 0.4;
    return 0.2;
  }

  /**
   * Apply diversity filter to avoid too many similar recommendations
   */
  applyDiversityFilter(rankedEvents) {
    const diverse = [];
    const categoryCounts = {};
    const locationCounts = {};
    const maxPerCategory = 2;
    const maxPerLocation = 3;

    for (const event of rankedEvents) {
      const category = event.category;
      const location = event.location;

      const categoryCount = categoryCounts[category] || 0;
      const locationCount = locationCounts[location] || 0;

      // Apply diversity rules
      if (categoryCount < maxPerCategory && locationCount < maxPerLocation) {
        diverse.push(event);
        categoryCounts[category] = categoryCount + 1;
        locationCounts[location] = locationCount + 1;
      } else if (diverse.length < 5) {
        // Still add if we don't have enough recommendations
        diverse.push(event);
      }

      if (diverse.length >= 15) break; // Limit total recommendations
    }

    return diverse;
  }

  /**
   * Generate human-readable explanation for recommendation
   */
  generateExplanation(event, userContext) {
    const reasons = [];
    const { scores } = event;

    // Category match explanation
    if (scores.categoryMatch > 0.7) {
      reasons.push(`Matches your interest in ${event.category.toLowerCase()} events`);
    }

    // Location explanation
    if (scores.locationProximity > 0.6) {
      reasons.push('Conveniently located near you');
    } else if (scores.locationProximity > 0.3) {
      reasons.push('Within reasonable distance');
    }

    // Time explanation
    if (scores.timePreference > 0.7) {
      reasons.push('Scheduled at your preferred time');
    }

    // Behavior explanation
    if (scores.behaviorHistory > 0.7) {
      reasons.push('Similar to events you\'ve enjoyed before');
    }

    // Popularity explanation
    if (scores.popularity > 0.8) {
      reasons.push('Highly popular with other attendees');
    }

    // Confidence indicator
    const confidence = event.normalizedScore;
    let confidenceText = '';
    if (confidence > 0.8) confidenceText = 'Highly recommended';
    else if (confidence > 0.6) confidenceText = 'Good match';
    else if (confidence > 0.4) confidenceText = 'Might interest you';
    else confidenceText = 'Worth considering';

    return {
      reasons,
      confidence: confidenceText,
      score: Math.round(confidence * 100)
    };
  }

  /**
   * Generate AI-enhanced explanation using Gemini
   */
  async generateAIExplanation(event, userContext) {
    try {
      const prompt = `
        Generate a personalized, engaging explanation for why this event is recommended to the user:
        
        Event: ${event.title}
        Category: ${event.category}
        Description: ${event.description.substring(0, 200)}...
        
        User Context:
        - Preferred categories: ${userContext.preferences?.categories?.join(', ') || 'Not specified'}
        - Location: ${userContext.location ? 'Provided' : 'Not specified'}
        - Previous interests: ${userContext.history?.slice(0, 3).map(h => h.category).join(', ') || 'None'}
        
        Recommendation Score: ${Math.round(event.normalizedScore * 100)}%
        
        Write a compelling, personal recommendation in 1-2 sentences that explains why this user would enjoy this event.
        Be specific and enthusiastic, but not overly promotional.
      `;

      const aiResponse = await geminiService.generateResponse(prompt);
      return aiResponse || this.getFallbackExplanation(event);

    } catch (error) {
      console.error('AI explanation generation failed:', error);
      return this.getFallbackExplanation(event);
    }
  }

  /**
   * Get fallback explanation when AI fails
   */
  getFallbackExplanation(event) {
    return `This ${event.category.toLowerCase()} event looks like a great match for your interests! ${event.title} offers an exciting opportunity to ${event.category === 'workshop' ? 'learn something new' : 'have a great time'}.`;
  }

  /**
   * Get specific recommendation reason
   */
  getRecommendationReason(event, userContext) {
    const { scores } = event;
    
    // Find the highest scoring factor
    const maxScore = Math.max(...Object.values(scores));
    const topFactor = Object.keys(scores).find(key => scores[key] === maxScore);

    const reasonMap = {
      categoryMatch: 'Perfect category match',
      locationProximity: 'Great location',
      timePreference: 'Ideal timing',
      behaviorHistory: 'Based on your history',
      popularity: 'Trending event'
    };

    return reasonMap[topFactor] || 'Good overall match';
  }

  /**
   * Calculate distance between two coordinates
   */
  calculateDistance(coord1, coord2) {
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;

    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
}

module.exports = RecommendationAgent;