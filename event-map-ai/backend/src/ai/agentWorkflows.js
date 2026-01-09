const Event = require('../models/Event');
const retrievalService = require('./retrievalService');
const embeddingService = require('./embeddingService');

class AgentWorkflows {
  constructor() {
    this.retrievalService = retrievalService;
    this.embeddingService = embeddingService;
  }

  // Agent for event search and ranking
  async searchAndRankEvents(query, userLocation = null, limit = 10) {
    try {
      // Get relevant events based on query
      const relevantEvents = await this.retrievalService.searchRelevantEvents(query, limit * 2);
      
      // If user location is provided, rank by proximity
      if (userLocation) {
        relevantEvents.forEach(event => {
          // Skip events without location metadata
          if (!event.metadata.locationCoords) return;
          
          const distance = this.calculateDistance(
            userLocation.latitude, userLocation.longitude,
            parseFloat(event.metadata.locationCoords.coordinates[1]), parseFloat(event.metadata.locationCoords.coordinates[0])
          );
          event.distance = distance;
        });
        
        // Sort by distance and then by relevance
        relevantEvents.sort((a, b) => {
          // Primary sort by distance
          if (a.distance !== b.distance) {
            return a.distance - b.distance;
          }
          // Secondary sort by relevance (distance score)
          return a.distance - b.distance;
        });
      }
      
      // Return top events
      return relevantEvents.slice(0, limit);
    } catch (error) {
      console.error('Error in search and rank agent:', error);
      throw error;
    }
  }

  // Agent for duplicate detection
  async detectDuplicates(newEvent) {
    try {
      // Generate embedding for new event
      const newEventEmbedding = await this.embeddingService.generateEventEmbedding(newEvent);
      
      // Search for similar events
      const similarEvents = await this.retrievalService.searchRelevantEvents(
        `${newEvent.title} ${newEvent.description}`, 10
      );
      
      // Filter for high similarity duplicates
      const duplicates = similarEvents.filter(event => {
        // Skip events without required metadata
        if (!event.metadata.title || !event.metadata.description) return false;
        
        // Calculate similarity based on metadata match
        const titleMatch = this.calculateTextSimilarity(
          newEvent.title.toLowerCase(), 
          event.metadata.title.toLowerCase()
        );
        
        const descriptionMatch = this.calculateTextSimilarity(
          newEvent.description.toLowerCase(), 
          event.metadata.description.toLowerCase()
        );
        
        // Combined similarity score
        const similarityScore = (titleMatch * 0.6 + descriptionMatch * 0.4);
        
        return similarityScore > 0.8; // Threshold for duplicate detection
      });
      
      return {
        isDuplicate: duplicates.length > 0,
        duplicates: duplicates,
        confidence: duplicates.length > 0 ? this.calculateConfidence(duplicates[0]) : 0
      };
    } catch (error) {
      console.error('Error in duplicate detection agent:', error);
      throw error;
    }
  }

  // Agent for content moderation
  async moderateContent(eventData) {
    try {
      const { title, description } = eventData;
      const text = `${title} ${description}`.toLowerCase();
      
      // Define moderation categories and keywords
      const moderationCategories = {
        nsfw: ['porn', 'sex', 'xxx', 'adult', 'nude', 'naked', 'erotic'],
        hate_speech: ['hate', 'racist', 'discriminat', 'violence', 'threat'],
        spam: ['click here', 'buy now', 'limited time', 'act fast', 'free money'],
        fake: ['fake event', 'not real', 'scam', 'fraud']
      };
      
      const flags = [];
      let riskScore = 0;
      
      // Check each category
      for (const [category, keywords] of Object.entries(moderationCategories)) {
        const matches = keywords.filter(keyword => text.includes(keyword)).length;
        if (matches > 0) {
          flags.push({
            category: category,
            matches: matches,
            severity: matches > 2 ? 'high' : matches > 1 ? 'medium' : 'low'
          });
          
          // Add to risk score
          riskScore += matches * (category === 'nsfw' || category === 'hate_speech' ? 0.3 : 0.1);
        }
      }
      
      // Cap risk score at 1.0
      riskScore = Math.min(riskScore, 1.0);
      
      return {
        isFlagged: riskScore > 0.5,
        riskScore: parseFloat(riskScore.toFixed(2)),
        flags: flags
      };
    } catch (error) {
      console.error('Error in content moderation agent:', error);
      throw error;
    }
  }

  // Agent for event recommendations
  async recommendEvents(userId, limit = 5) {
    try {
      // In a more sophisticated implementation, this would consider:
      // - User's past attended events
      // - User's preferences
      // - Current location
      // - Time of day/week
      
      // For now, we'll return recently approved events
      const recentEvents = await Event.find({ status: 'approved' })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('organizer', 'name');
      
      return recentEvents;
    } catch (error) {
      console.error('Error in recommendation agent:', error);
      throw error;
    }
  }

  // Helper method to calculate distance between two points
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; // Distance in km
  }

  // Helper method to convert degrees to radians
  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  // Helper method to calculate text similarity
  calculateTextSimilarity(str1, str2) {
    // Simple Jaccard similarity
    const set1 = new Set(str1.split(/\s+/));
    const set2 = new Set(str2.split(/\s+/));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
  }

  // Helper method to calculate confidence
  calculateConfidence(event) {
    // Use distance if available, otherwise return 0.5 as default
    if (event.distance !== undefined) {
      // Inverse of distance as confidence measure
      return Math.max(0, 1 - event.distance);
    }
    return 0.5;
  }
}

module.exports = new AgentWorkflows();