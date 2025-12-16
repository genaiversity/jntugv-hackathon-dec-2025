/**
 * AI ASSISTANT API SERVICE
 * Frontend service for communicating with the multi-agent AI assistant
 */

const API_BASE_URL = '/api/ai-assistant';

class AIAssistantService {
  constructor() {
    this.sessionId = null;
  }

  /**
   * Get authentication headers
   */
  getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  /**
   * Send message to AI assistant
   */
  async sendMessage(message, options = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          message,
          sessionId: this.sessionId || options.sessionId,
          location: options.location,
          latitude: options.latitude,
          longitude: options.longitude
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'AI Assistant request failed');
      }

      // Store session ID for future requests
      if (data.metadata?.sessionId) {
        this.sessionId = data.metadata.sessionId;
      }

      return data;
    } catch (error) {
      console.error('AI Assistant API Error:', error);
      throw error;
    }
  }

  /**
   * Get AI assistant capabilities
   */
  async getCapabilities() {
    try {
      const response = await fetch(`${API_BASE_URL}/capabilities`, {
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch capabilities');
      }

      return data;
    } catch (error) {
      console.error('Error fetching capabilities:', error);
      throw error;
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(sessionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/conversation/${sessionId}`, {
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch conversation history');
      }

      return data;
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      throw error;
    }
  }

  /**
   * Clear conversation history
   */
  async clearConversation(sessionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/conversation/${sessionId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to clear conversation');
      }

      return data;
    } catch (error) {
      console.error('Error clearing conversation:', error);
      throw error;
    }
  }

  /**
   * Submit feedback for AI response
   */
  async submitFeedback(sessionId, messageId, rating, feedback) {
    try {
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          sessionId,
          messageId,
          rating,
          feedback
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      return data;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  /**
   * Get AI assistant analytics (admin only)
   */
  async getAnalytics() {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics`, {
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch analytics');
      }

      return data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }

  /**
   * Check AI assistant health
   */
  async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Health check failed');
      }

      return data;
    } catch (error) {
      console.error('Error checking health:', error);
      throw error;
    }
  }

  /**
   * Get user's current location
   */
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
          resolve(null); // Don't reject, just return null
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Generate a new session ID
   */
  generateSessionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `session_${timestamp}_${random}`;
  }

  /**
   * Reset session (for new conversations)
   */
  resetSession() {
    this.sessionId = null;
  }

  /**
   * Get current session ID
   */
  getSessionId() {
    return this.sessionId;
  }

  /**
   * Set session ID
   */
  setSessionId(sessionId) {
    this.sessionId = sessionId;
  }
}

// Export singleton instance
export default new AIAssistantService();