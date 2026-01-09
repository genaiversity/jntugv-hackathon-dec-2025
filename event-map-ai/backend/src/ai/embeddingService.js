const axios = require('axios');

class EmbeddingService {
  constructor() {
    this.embeddingModel = process.env.EMBEDDING_MODEL || 'text-embedding-ada-002';
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent';
  }

  async generateEmbedding(text) {
    try {
      // For this implementation, we'll use Gemini API for embeddings
      // In a production environment, you might use different embedding models
      
      if (!this.geminiApiKey) {
        console.log('GEMINI_API_KEY not configured, using fallback embedding');
        return this.generateFallbackEmbedding(text);
      }

      const response = await axios.post(
        `${this.geminiApiUrl}?key=${this.geminiApiKey}`,
        {
          content: {
            parts: [{
              text: text
            }]
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Return the embedding vector
      return response.data.embedding.values;
    } catch (error) {
      console.error('Error generating embedding:', error.response?.data || error.message);
      
      // Fallback to a simple hash-based embedding for demonstration
      // In a real implementation, you would want to handle this more gracefully
      return this.generateFallbackEmbedding(text);
    }
  }

  // Fallback method to generate a simple embedding based on text hash
  generateFallbackEmbedding(text) {
    // Simple hash function to convert text to a numeric value
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Generate a fixed-size vector (768 dimensions) based on the hash
    const embedding = new Array(768).fill(0);
    for (let i = 0; i < 768; i++) {
      // Use the hash to generate pseudo-random values between -1 and 1
      const value = Math.sin(hash + i) * 0.5 + 0.5;
      embedding[i] = value * 2 - 1; // Scale to [-1, 1]
    }

    return embedding;
  }

  // Generate embedding for an event
  async generateEventEmbedding(event) {
    try {
      // Combine relevant event fields for embedding
      const eventText = `
        Title: ${event.title}
        Description: ${event.description}
        Category: ${event.category}
        Location: ${event.location}
        Date: ${event.date}
      `.trim();

      return await this.generateEmbedding(eventText);
    } catch (error) {
      console.error('Error generating event embedding:', error);
      throw error;
    }
  }

  // Generate embedding for a user query
  async generateQueryEmbedding(query) {
    try {
      return await this.generateEmbedding(query);
    } catch (error) {
      console.error('Error generating query embedding:', error);
      throw error;
    }
  }
}

module.exports = new EmbeddingService();