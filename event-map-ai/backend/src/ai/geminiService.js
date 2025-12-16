const axios = require('axios');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  }

  async generateResponse(prompt) {
    try {
      if (!this.apiKey) {
        console.log('GEMINI_API_KEY not configured, returning default response');
        return 'I am an AI assistant for an event discovery platform. I help users find and learn about events based on their interests and location.';
      }

      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Extract the response text
      const candidates = response.data.candidates;
      if (candidates && candidates.length > 0 && candidates[0].content) {
        const parts = candidates[0].content.parts;
        if (parts && parts.length > 0) {
          return parts[0].text;
        }
      }

      throw new Error('No valid response from Gemini API');
    } catch (error) {
      console.error('Error generating response from Gemini:', error.response?.data || error.message);
      // Return a default response instead of throwing error
      return 'I am an AI assistant for an event discovery platform. I help users find and learn about events based on their interests and location.';
    }
  }

  async generateChatResponse(messages) {
    try {
      if (!this.apiKey) {
        console.log('GEMINI_API_KEY not configured, returning default response');
        return 'I am an AI assistant for an event discovery platform. I help users find and learn about events based on their interests and location.';
      }

      // Format messages for Gemini API
      const contents = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{
          text: msg.content
        }]
      }));

      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        {
          contents: contents
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Extract the response text
      const candidates = response.data.candidates;
      if (candidates && candidates.length > 0 && candidates[0].content) {
        const parts = candidates[0].content.parts;
        if (parts && parts.length > 0) {
          return parts[0].text;
        }
      }

      throw new Error('No valid response from Gemini API');
    } catch (error) {
      console.error('Error generating chat response from Gemini:', error.response?.data || error.message);
      // Return a default response instead of throwing error
      return 'I am an AI assistant for an event discovery platform. I help users find and learn about events based on their interests and location.';
    }
  }

  async generateRAGResponse(query, context) {
    try {
      // Create a prompt that combines the user query with retrieved context
      const prompt = `
        You are an AI assistant for an event discovery platform. Use the provided context to answer the user's question accurately.
        
        Context:
        ${context}
        
        User Question:
        ${query}
        
        Please provide a helpful and accurate response based on the context provided. If the context doesn't contain relevant information, politely say so.
      `.trim();

      return await this.generateResponse(prompt);
    } catch (error) {
      console.error('Error generating RAG response from Gemini:', error);
      throw error;
    }
  }
}

module.exports = new GeminiService();