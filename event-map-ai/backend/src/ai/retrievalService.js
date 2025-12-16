/**
 * RETRIEVAL SERVICE
 * Handles event data retrieval and context generation for AI
 */

const Event = require('../models/Event');
const chromaDB = require('./chromaDB');
const embeddingService = require('./embeddingService');

class RetrievalService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    try {
      console.log('Initializing Retrieval Service...');
      
      // Initialize ChromaDB and embeddings
      await chromaDB.initialize();
      
      // Index existing events
      await this.indexExistingEvents();
      
      this.initialized = true;
      console.log('✅ Retrieval Service initialized successfully');
    } catch (error) {
      console.error('❌ Retrieval Service initialization failed:', error);
      // Don't throw error - allow system to continue without retrieval
    }
  }

  async indexExistingEvents() {
    try {
      const events = await Event.find({ status: 'approved' }).lean();
      console.log(`Indexing ${events.length} events...`);
      
      for (const event of events) {
        await this.addEventToIndex(event);
      }
      
      console.log(`✅ Indexed ${events.length} events`);
    } catch (error) {
      console.error('Error indexing events:', error);
    }
  }

  async addEventToIndex(event) {
    try {
      if (!this.initialized) return;

      const eventText = this.createEventText(event);
      const embedding = await embeddingService.generateEmbedding(eventText);
      
      await chromaDB.addDocument(
        event._id.toString(),
        eventText,
        embedding,
        {
          title: event.title,
          category: event.category,
          location: event.location,
          date: event.date,
          organizer: event.organizer
        }
      );
    } catch (error) {
      console.error('Error adding event to index:', error);
    }
  }

  async getEventContextForQuery(query) {
    try {
      if (!this.initialized) {
        return this.getFallbackContext(query);
      }

      const queryEmbedding = await embeddingService.generateEmbedding(query);
      const similarEvents = await chromaDB.searchSimilar(queryEmbedding, 5);
      
      if (similarEvents.length === 0) {
        return this.getFallbackContext(query);
      }

      // Create context from similar events
      const context = similarEvents.map(event => {
        return `Event: ${event.metadata.title}\nCategory: ${event.metadata.category}\nLocation: ${event.metadata.location}\nDate: ${event.metadata.date}\nDescription: ${event.document.substring(0, 200)}...`;
      }).join('\n\n');

      return context;
    } catch (error) {
      console.error('Error getting event context:', error);
      return this.getFallbackContext(query);
    }
  }

  createEventText(event) {
    return [
      event.title,
      event.description,
      event.category,
      event.location,
      new Date(event.date).toLocaleDateString()
    ].filter(Boolean).join(' ');
  }

  getFallbackContext(query) {
    return `I can help you find events related to "${query}". I have access to various events including technology conferences, music festivals, workshops, and more. Please let me know what specific type of event you're looking for.`;
  }

  async removeEventFromIndex(eventId) {
    try {
      if (!this.initialized) return;
      await chromaDB.deleteDocument(eventId.toString());
    } catch (error) {
      console.error('Error removing event from index:', error);
    }
  }

  async updateEventInIndex(event) {
    try {
      await this.removeEventFromIndex(event._id);
      await this.addEventToIndex(event);
    } catch (error) {
      console.error('Error updating event in index:', error);
    }
  }
}

module.exports = new RetrievalService();