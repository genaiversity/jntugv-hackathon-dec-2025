/**
 * EVENT RETRIEVAL AGENT
 * Fetches relevant events from database using semantic search and filters
 */

const Event = require('../../models/Event');
const chromaDB = require('../chromaDB');
const embeddingService = require('../embeddingService');

class EventRetrievalAgent {
  constructor() {
    this.maxResults = 50;
    this.defaultRadius = 25; // km
  }

  /**
   * Main search method - combines semantic and traditional search
   */
  async searchEvents(searchParams) {
    const {
      query,
      location,
      radius = this.defaultRadius,
      filters = {},
      userPreferences = {},
      roleFilter = {}
    } = searchParams;

    try {
      // Step 1: Build base MongoDB query
      let mongoQuery = this.buildMongoQuery(filters, location, radius, roleFilter);

      // Step 2: Execute database search
      const dbEvents = await Event.find(mongoQuery)
        .populate('organizer', 'name email')
        .sort({ date: 1 })
        .limit(this.maxResults)
        .lean();

      // Step 3: If we have a text query, use semantic search
      let semanticResults = [];
      if (query && query.trim()) {
        semanticResults = await this.performSemanticSearch(query, dbEvents);
      }

      // Step 4: Combine and deduplicate results
      const combinedResults = this.combineResults(dbEvents, semanticResults, query);

      // Step 5: Apply user preference filtering
      const filteredResults = this.applyUserPreferences(combinedResults, userPreferences);

      return filteredResults;

    } catch (error) {
      console.error('Event retrieval error:', error);
      // Fallback to simple database search
      return await this.fallbackSearch(filters, location, radius, roleFilter);
    }
  }

  /**
   * Get events suitable for recommendations
   */
  async getRecommendationCandidates(params) {
    const {
      location,
      radius = this.defaultRadius,
      userPreferences = {},
      roleFilter = {}
    } = params;

    try {
      let query = { status: 'approved', ...roleFilter };

      // Add location filter if provided
      if (location && location.length === 2) {
        query.locationCoords = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: location
            },
            $maxDistance: radius * 1000
          }
        };
      }

      // Add date filter (future events only)
      query.date = { $gte: new Date() };

      // Add category preferences if available
      if (userPreferences.categories && userPreferences.categories.length > 0) {
        query.category = { $in: userPreferences.categories };
      }

      const events = await Event.find(query)
        .populate('organizer', 'name email')
        .sort({ date: 1, attendees: -1 }) // Sort by date, then popularity
        .limit(this.maxResults)
        .lean();

      return events;

    } catch (error) {
      console.error('Error getting recommendation candidates:', error);
      return [];
    }
  }

  /**
   * Build MongoDB query from filters
   */
  buildMongoQuery(filters, location, radius, roleFilter) {
    let query = { ...roleFilter };

    // Status filter (default to approved for regular users)
    if (!query.status && !query.$or) {
      query.status = 'approved';
    }

    // Location-based search
    if (location && location.length === 2) {
      query.locationCoords = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: location
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      };
    }

    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      query.category = { $in: filters.categories };
    }

    // Date filters
    if (filters.timeframe) {
      const dateFilter = this.buildDateFilter(filters.timeframe);
      if (dateFilter) query.date = dateFilter;
    }

    // Price filters (if price field exists)
    if (filters.price) {
      const priceFilter = this.buildPriceFilter(filters.price);
      if (priceFilter) query.price = priceFilter;
    }

    return query;
  }

  /**
   * Perform semantic search using embeddings
   */
  async performSemanticSearch(query, events) {
    try {
      // Generate embedding for the query
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      
      // Search in ChromaDB for similar events
      const similarEvents = await chromaDB.searchSimilar(queryEmbedding, 20);
      
      // Match ChromaDB results with MongoDB events
      const matchedEvents = [];
      for (const similar of similarEvents) {
        const event = events.find(e => e._id.toString() === similar.id);
        if (event) {
          matchedEvents.push({
            ...event,
            semanticScore: similar.score,
            semanticReason: `Semantic similarity: ${Math.round(similar.score * 100)}%`
          });
        }
      }

      return matchedEvents;

    } catch (error) {
      console.error('Semantic search error:', error);
      return [];
    }
  }

  /**
   * Combine database and semantic search results
   */
  combineResults(dbEvents, semanticEvents, query) {
    const eventMap = new Map();

    // Add database events
    dbEvents.forEach(event => {
      eventMap.set(event._id.toString(), {
        ...event,
        searchScore: this.calculateTextScore(event, query),
        source: 'database'
      });
    });

    // Merge semantic events (higher priority)
    semanticEvents.forEach(event => {
      const eventId = event._id.toString();
      if (eventMap.has(eventId)) {
        // Combine scores
        const existing = eventMap.get(eventId);
        eventMap.set(eventId, {
          ...existing,
          ...event,
          combinedScore: (existing.searchScore + event.semanticScore) / 2,
          source: 'combined'
        });
      } else {
        eventMap.set(eventId, {
          ...event,
          combinedScore: event.semanticScore,
          source: 'semantic'
        });
      }
    });

    // Convert back to array and sort by combined score
    return Array.from(eventMap.values())
      .sort((a, b) => (b.combinedScore || b.searchScore || 0) - (a.combinedScore || a.searchScore || 0));
  }

  /**
   * Calculate text-based relevance score
   */
  calculateTextScore(event, query) {
    if (!query) return 0;

    const queryLower = query.toLowerCase();
    const searchableText = [
      event.title || '',
      event.description || '',
      event.category || '',
      event.location || ''
    ].join(' ').toLowerCase();

    // Simple keyword matching score
    const queryWords = queryLower.split(' ').filter(word => word.length > 2);
    let score = 0;

    queryWords.forEach(word => {
      if (searchableText.includes(word)) {
        // Title matches get higher score
        if ((event.title || '').toLowerCase().includes(word)) score += 3;
        // Category matches get medium score
        else if ((event.category || '').toLowerCase().includes(word)) score += 2;
        // Other matches get base score
        else score += 1;
      }
    });

    return score / queryWords.length;
  }

  /**
   * Apply user preferences to filter/rank results
   */
  applyUserPreferences(events, preferences) {
    if (!preferences || Object.keys(preferences).length === 0) {
      return events;
    }

    return events.map(event => {
      let preferenceScore = 0;

      // Category preferences
      if (preferences.categories && preferences.categories.includes(event.category)) {
        preferenceScore += 2;
      }

      // Location preferences
      if (preferences.locations && preferences.locations.some(loc => 
        event.location.toLowerCase().includes(loc.toLowerCase()))) {
        preferenceScore += 1;
      }

      // Time preferences (if available)
      if (preferences.timePreferences) {
        const eventHour = new Date(event.date).getHours();
        if (preferences.timePreferences.includes('morning') && eventHour < 12) preferenceScore += 1;
        if (preferences.timePreferences.includes('evening') && eventHour >= 18) preferenceScore += 1;
      }

      return {
        ...event,
        preferenceScore,
        totalScore: (event.combinedScore || event.searchScore || 0) + preferenceScore
      };
    }).sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Build date filter from timeframe
   */
  buildDateFilter(timeframe) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (timeframe.includes('today')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return { $gte: today, $lt: tomorrow };
    }
    
    if (timeframe.includes('tomorrow')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);
      return { $gte: tomorrow, $lt: dayAfter };
    }
    
    if (timeframe.includes('weekend')) {
      const nextSaturday = new Date(today);
      const daysUntilSaturday = (6 - today.getDay()) % 7;
      nextSaturday.setDate(today.getDate() + daysUntilSaturday);
      const nextMonday = new Date(nextSaturday);
      nextMonday.setDate(nextSaturday.getDate() + 2);
      return { $gte: nextSaturday, $lt: nextMonday };
    }
    
    if (timeframe.includes('next week')) {
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      const weekAfter = new Date(nextWeek);
      weekAfter.setDate(nextWeek.getDate() + 7);
      return { $gte: nextWeek, $lt: weekAfter };
    }

    return null;
  }

  /**
   * Build price filter
   */
  buildPriceFilter(priceFilters) {
    if (priceFilters.includes('free')) {
      return { $lte: 0 };
    }
    
    // Add more price filter logic as needed
    return null;
  }

  /**
   * Fallback search when semantic search fails
   */
  async fallbackSearch(filters, location, radius, roleFilter) {
    try {
      const query = this.buildMongoQuery(filters, location, radius, roleFilter);
      
      return await Event.find(query)
        .populate('organizer', 'name email')
        .sort({ date: 1 })
        .limit(20)
        .lean();
        
    } catch (error) {
      console.error('Fallback search failed:', error);
      return [];
    }
  }
}

module.exports = EventRetrievalAgent;