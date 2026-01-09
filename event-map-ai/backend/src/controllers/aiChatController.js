const RAGSystem = require('../ai/ragSystem');
const Event = require('../models/Event'); // Assuming you have an Event model

class AIChatController {
  constructor() {
    this.ragSystem = new RAGSystem();
    this.initializeRAG();
  }

  // Initialize RAG system with current events
  async initializeRAG() {
    try {
      // Fetch events from database
      const events = await Event.find({}).lean();
      this.ragSystem.initializeWithEvents(events);
      console.log(`RAG system initialized with ${events.length} events`);
    } catch (error) {
      console.error('Error initializing RAG system:', error);
      // Initialize with empty array if database is not available
      this.ragSystem.initializeWithEvents([]);
    }
  }

  // Handle chat messages
  async handleChatMessage(req, res) {
    try {
      const { message, sessionId } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Message is required and must be a string'
        });
      }

      // Search for relevant events
      const relevantEvents = this.ragSystem.searchEvents(message, 5);

      // Generate AI response
      const response = this.ragSystem.generateResponse(message, relevantEvents);

      // Log the interaction (optional)
      console.log(`Chat Query: ${message}`);
      console.log(`Found ${relevantEvents.length} relevant events`);

      res.json({
        success: true,
        response: response,
        relevantEvents: relevantEvents.slice(0, 3), // Return top 3 for frontend
        timestamp: new Date().toISOString(),
        sessionId: sessionId || 'anonymous'
      });

    } catch (error) {
      console.error('Error handling chat message:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        response: "I'm sorry, I'm having trouble processing your request right now. Please try again later."
      });
    }
  }

  // Get event suggestions based on user preferences
  async getEventSuggestions(req, res) {
    try {
      const { category, location, dateRange, priceRange } = req.query;

      let query = {};

      if (category) query.category = new RegExp(category, 'i');
      if (location) query.location = new RegExp(location, 'i');
      if (dateRange) {
        const [startDate, endDate] = dateRange.split(',');
        query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }
      if (priceRange) {
        const [minPrice, maxPrice] = priceRange.split(',').map(Number);
        query.price = { $gte: minPrice, $lte: maxPrice };
      }

      const events = await Event.find(query).limit(10).lean();

      res.json({
        success: true,
        suggestions: events,
        count: events.length
      });

    } catch (error) {
      console.error('Error getting event suggestions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get event suggestions'
      });
    }
  }

  // Update RAG system when new events are added
  async updateRAGSystem() {
    try {
      await this.initializeRAG();
      return true;
    } catch (error) {
      console.error('Error updating RAG system:', error);
      return false;
    }
  }

  // Get chat analytics (optional)
  async getChatAnalytics(req, res) {
    try {
      // This could be expanded to track popular queries, user satisfaction, etc.
      res.json({
        success: true,
        analytics: {
          totalEvents: this.ragSystem.events.length,
          systemStatus: 'operational',
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error getting chat analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get analytics'
      });
    }
  }

  // Generate event description based on Q&A
  async generateEventDescription(req, res) {
    try {
      const { title, type, audience, highlights } = req.body;

      if (!title || !type) {
        return res.status(400).json({
          success: false,
          error: 'Title and event type are required'
        });
      }

      const prompt = `
        Create a compelling and professional event description for an event with the following details:
        
        Event Title: ${title}
        Event Type: ${type}
        Target Audience: ${audience || 'General public'}
        Key Highlights: ${highlights || 'Not specified'}
        
        The description should be engaging, informative, and encourage people to attend. 
        Structure it with a catchy opening, detailed body, and a call to action.
        Keep it under 300 words.
      `;

      // We can reuse the ragSystem's geminiService or import it directly if needed.
      // Since AIChatController doesn't directly expose geminiService but RAGSystem does (or we can import it), 
      // let's assume we can access it via a new import or just import it here.
      // To keep it clean, I'll import GeminiService at the top of the file in the next step or assume it's available.
      // Actually, looking at the code, I should import geminiService directly since it is a singleton.

      const geminiService = require('../ai/geminiService');
      const description = await geminiService.generateResponse(prompt);

      res.json({
        success: true,
        description: description
      });

    } catch (error) {
      console.error('Error generating event description:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate description'
      });
    }
  }
}

module.exports = new AIChatController();