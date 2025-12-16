/**
 * AGENT WORKFLOWS
 * Legacy workflows for backward compatibility with existing routes
 */

const Event = require('../models/Event');
const User = require('../models/User');
const retrievalService = require('./retrievalService');
const duplicateChecker = require('./duplicateCheck');
const eventModerator = require('./moderateEvent');

class AgentWorkflows {
  constructor() {
    this.retrievalService = retrievalService;
  }

  async searchAndRankEvents(query, userLocation = null) {
    try {
      // Get events from database
      let events = await Event.find({ status: 'approved' })
        .populate('organizer', 'name email')
        .lean();

      // Apply location filter if provided
      if (userLocation) {
        events = events.filter(event => {
          if (!event.locationCoords) return true;
          
          const distance = this.calculateDistance(
            userLocation,
            {
              latitude: event.locationCoords.coordinates[1],
              longitude: event.locationCoords.coordinates[0]
            }
          );
          
          return distance <= 50; // 50km radius
        });
      }

      // Simple text-based ranking
      const rankedEvents = events.map(event => {
        const relevanceScore = this.calculateRelevanceScore(query, event);
        return {
          ...event,
          relevanceScore
        };
      }).sort((a, b) => b.relevanceScore - a.relevanceScore);

      return rankedEvents.slice(0, 10);
    } catch (error) {
      console.error('Search and rank error:', error);
      return [];
    }
  }

  async detectDuplicates(eventData) {
    try {
      const existingEvents = await Event.find({ status: { $in: ['approved', 'pending'] } }).lean();
      return await duplicateChecker.checkForDuplicates(eventData, existingEvents);
    } catch (error) {
      console.error('Duplicate detection error:', error);
      return { duplicates: [], isDuplicate: false };
    }
  }

  async moderateContent(eventData) {
    try {
      return await eventModerator.moderateEvent(eventData.title, eventData.description);
    } catch (error) {
      console.error('Content moderation error:', error);
      return { isFlagged: false, warnings: [], riskScore: 0 };
    }
  }

  async recommendEvents(userId, limit = 5) {
    try {
      const user = await User.findById(userId).lean();
      if (!user) return [];

      const events = await Event.find({ status: 'approved' })
        .populate('organizer', 'name email')
        .sort({ attendees: -1, createdAt: -1 }) // Sort by popularity and recency
        .limit(limit)
        .lean();

      return events.map(event => ({
        ...event,
        recommendationReason: 'Popular event'
      }));
    } catch (error) {
      console.error('Recommendation error:', error);
      return [];
    }
  }

  calculateDistance(location1, location2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(location2.latitude - location1.latitude);
    const dLon = this.toRadians(location2.longitude - location1.longitude);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(location1.latitude)) * Math.cos(this.toRadians(location2.latitude)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  calculateRelevanceScore(query, event) {
    const queryLower = query.toLowerCase();
    const searchableText = [
      event.title || '',
      event.description || '',
      event.category || '',
      event.location || ''
    ].join(' ').toLowerCase();

    const queryWords = queryLower.split(' ').filter(word => word.length > 2);
    let score = 0;

    queryWords.forEach(word => {
      if (searchableText.includes(word)) {
        if ((event.title || '').toLowerCase().includes(word)) score += 3;
        else if ((event.category || '').toLowerCase().includes(word)) score += 2;
        else score += 1;
      }
    });

    return score / queryWords.length;
  }
}

module.exports = new AgentWorkflows();