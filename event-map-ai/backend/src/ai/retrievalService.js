const chromaDB = require('./chromaDB');
const embeddingService = require('./embeddingService');
const Event = require('../models/Event');

class RetrievalService {
  constructor() {
    this.chromaDB = chromaDB;
    this.embeddingService = embeddingService;
  }

  async initialize() {
    try {
      await this.chromaDB.initializeCollection();
      console.log('Retrieval service initialized');
    } catch (error) {
      console.error('Error initializing retrieval service:', error);
      throw error;
    }
  }

  async searchRelevantEvents(query, limit = 5) {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.embeddingService.generateQueryEmbedding(query);
      
      // Search for similar events in ChromaDB
      const results = await this.chromaDB.searchSimilarEvents(queryEmbedding, limit);
      
      // Process and return results
      // Handle case where results might be empty
      if (!results.ids || !results.ids[0] || results.ids[0].length === 0) {
        return [];
      }
      
      const relevantEvents = results.ids[0].map((id, index) => ({
        id: id,
        document: results.documents[0][index],
        metadata: results.metadatas[0][index],
        distance: results.distances[0][index]
      }));
      
      return relevantEvents;
    } catch (error) {
      console.error('Error searching relevant events:', error);
      throw error;
    }
  }

  async addEventToIndex(event) {
    try {
      // Generate embedding for the event
      const embedding = await this.embeddingService.generateEventEmbedding(event);
      
      // Add event embedding to ChromaDB
      await this.chromaDB.addEventEmbedding(event._id.toString(), {
        title: event.title,
        description: event.description,
        category: event.category,
        location: event.location,
        locationCoords: event.locationCoords,
        date: event.date
      }, embedding);
      
      console.log(`Event ${event._id} added to retrieval index`);
    } catch (error) {
      console.error('Error adding event to retrieval index:', error);
      throw error;
    }
  }

  async updateEventInIndex(event) {
    try {
      // Generate embedding for the event
      const embedding = await this.embeddingService.generateEventEmbedding(event);
      
      // Update event embedding in ChromaDB
      await this.chromaDB.updateEventEmbedding(event._id.toString(), {
        title: event.title,
        description: event.description,
        category: event.category,
        location: event.location,
        locationCoords: event.locationCoords,
        date: event.date
      }, embedding);
      
      console.log(`Event ${event._id} updated in retrieval index`);
    } catch (error) {
      console.error('Error updating event in retrieval index:', error);
      throw error;
    }
  }

  async removeEventFromIndex(eventId) {
    try {
      // Remove event embedding from ChromaDB
      await this.chromaDB.deleteEventEmbedding(eventId);
      
      console.log(`Event ${eventId} removed from retrieval index`);
    } catch (error) {
      console.error('Error removing event from retrieval index:', error);
      throw error;
    }
  }

  async getEventContextForQuery(query, limit = 3) {
    try {
      // Search for relevant events
      const relevantEvents = await this.searchRelevantEvents(query, limit);
      
      // Format context for LLM
      const context = relevantEvents.map(event => {
        return `
        Event: ${event.metadata.title}
        Description: ${event.metadata.description}
        Category: ${event.metadata.category}
        Location: ${event.metadata.location}
        Date: ${event.metadata.date}
        Relevance Score: ${1 - (event.distance || 0)}
        `.trim();
      }).join('\n\n');
      
      return context;
    } catch (error) {
      console.error('Error getting event context for query:', error);
      throw error;
    }
  }
}

module.exports = new RetrievalService();