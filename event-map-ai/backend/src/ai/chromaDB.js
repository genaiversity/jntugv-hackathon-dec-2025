const { ChromaClient } = require('chromadb');

class ChromaDB {
  constructor() {
    this.client = new ChromaClient({
      baseUrl: process.env.CHROMA_DB_URL || 'http://localhost:8001'
    });
    this.collectionName = 'events';
  }

  async initializeCollection() {
    try {
      // Check if collection exists
      const collections = await this.client.listCollections();
      const collectionExists = collections.some(collection => collection.name === this.collectionName);
      
      if (!collectionExists) {
        // Create collection with cosine similarity
        this.collection = await this.client.createCollection({
          name: this.collectionName,
          metadata: {
            description: 'Event embeddings for RAG',
            similarity_function: 'cosine'
          }
        });
      } else {
        // Get existing collection
        this.collection = await this.client.getCollection({ name: this.collectionName });
      }
      
      console.log(`ChromaDB collection '${this.collectionName}' initialized`);
      return this.collection;
    } catch (error) {
      console.error('Error initializing ChromaDB collection:', error.message);
      // Continue without ChromaDB if there's an error
      return null;
    }
  }

  async addEventEmbedding(eventId, eventData, embedding) {
    try {
      if (!this.collection) {
        await this.initializeCollection();
      }
      
      // If collection is still not available, skip
      if (!this.collection) {
        console.log('Skipping ChromaDB add - collection not available');
        return;
      }

      // Add event data and embedding to collection
      await this.collection.add({
        ids: [eventId],
        embeddings: [embedding],
        metadatas: [{
          title: eventData.title,
          description: eventData.description,
          category: eventData.category,
          location: eventData.location,
          locationCoords: eventData.locationCoords,
          date: eventData.date
        }],
        documents: [`${eventData.title} ${eventData.description}`]
      });

      console.log(`Added event ${eventId} to ChromaDB`);
    } catch (error) {
      console.error('Error adding event embedding to ChromaDB:', error.message);
      // Don't throw error, just log it
    }
  }

  async searchSimilarEvents(queryEmbedding, limit = 5) {
    try {
      if (!this.collection) {
        await this.initializeCollection();
      }
      
      // If collection is still not available, return empty results
      if (!this.collection) {
        console.log('Returning empty results - ChromaDB collection not available');
        return { ids: [[]], documents: [[]], metadatas: [[]], distances: [[]] };
      }

      // Search for similar events based on query embedding
      const results = await this.collection.query({
        query_embeddings: [queryEmbedding],
        n_results: limit,
        include: ['documents', 'metadatas', 'distances']
      });

      return results;
    } catch (error) {
      console.error('Error searching similar events in ChromaDB:', error.message);
      // Return empty results instead of throwing error
      return { ids: [[]], documents: [[]], metadatas: [[]], distances: [[]] };
    }
  }

  async updateEventEmbedding(eventId, eventData, embedding) {
    try {
      if (!this.collection) {
        await this.initializeCollection();
      }
      
      // If collection is still not available, skip
      if (!this.collection) {
        console.log('Skipping ChromaDB update - collection not available');
        return;
      }

      // Update event data and embedding in collection
      await this.collection.update({
        ids: [eventId],
        embeddings: [embedding],
        metadatas: [{
          title: eventData.title,
          description: eventData.description,
          category: eventData.category,
          location: eventData.location,
          locationCoords: eventData.locationCoords,
          date: eventData.date
        }],
        documents: [`${eventData.title} ${eventData.description}`]
      });

      console.log(`Updated event ${eventId} in ChromaDB`);
    } catch (error) {
      console.error('Error updating event embedding in ChromaDB:', error.message);
      // Don't throw error, just log it
    }
  }

  async deleteEventEmbedding(eventId) {
    try {
      if (!this.collection) {
        await this.initializeCollection();
      }
      
      // If collection is still not available, skip
      if (!this.collection) {
        console.log('Skipping ChromaDB delete - collection not available');
        return;
      }

      // Delete event from collection
      await this.collection.delete({ ids: [eventId] });

      console.log(`Deleted event ${eventId} from ChromaDB`);
    } catch (error) {
      console.error('Error deleting event embedding from ChromaDB:', error.message);
      // Don't throw error, just log it
    }
  }
}

module.exports = new ChromaDB();