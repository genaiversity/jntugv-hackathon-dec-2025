/**
 * Unified AI Service
 * Provides intelligent responses using available AI services (Gemini only)
 */

const geminiService = require("./geminiService");

class AIService {
  constructor() {
    this.primaryService = null;
    this.fallbackService = null;
    
    // Use only Gemini AI (OpenAI disabled due to quota issues)
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
      this.primaryService = geminiService;
      this.fallbackService = null; // No fallback needed
      console.log('✅ AI Service: Using Gemini AI exclusively');
    } else {
      console.log('⚠️ AI Service: No Gemini API key configured, using intelligent fallback responses');
      console.log('💡 To enable full AI capabilities, set GEMINI_API_KEY in your .env file');
    }
  }

  async generateResponse(prompt, options = {}) {
    // If no services are configured, use enhanced static responses immediately
    if (!this.primaryService) {
      return this.getStaticFallback(prompt);
    }

    try {
      if (this.primaryService) {
        return await this.primaryService.generateResponse(prompt, options);
      }

      return this.getStaticFallback(prompt);
    } catch (error) {
      console.error("Primary AI service error:", error.message);

      console.log("🔄 Using enhanced static responses...");
      return this.getStaticFallback(prompt);
    }
  }

  async generateChatResponse(messages, options = {}) {
    try {
      if (this.primaryService) {
        return await this.primaryService.generateChatResponse(
          messages,
          options
        );
      }

      const lastMessage = messages[messages.length - 1]?.content || "";
      return this.getStaticFallback(lastMessage);
    } catch (error) {
      console.error("Error in AI chat service:", error);

      const lastMessage = messages[messages.length - 1]?.content || "";
      return this.getStaticFallback(lastMessage);
    }
  }

  async generateRAGResponse(query, context, options = {}) {
    try {
      if (this.primaryService && this.primaryService.generateRAGResponse) {
        return await this.primaryService.generateRAGResponse(
          query,
          context,
          options
        );
      }

      // Basic RAG fallback
      return this.generateBasicRAGResponse(query, context);
    } catch (error) {
      console.error("Error in AI RAG service:", error);
      return this.generateBasicRAGResponse(query, context);
    }
  }

  async classifyIntent(message) {
    try {
      if (
        this.primaryService &&
        this.primaryService.generateIntentClassification
      ) {
        return await this.primaryService.generateIntentClassification(message);
      }

      // Fallback intent classification
      return this.classifyIntentFallback(message);
    } catch (error) {
      console.error("Error classifying intent:", error);
      return this.classifyIntentFallback(message);
    }
  }

  async generateEventDescription(eventDetails) {
    try {
      if (this.primaryService && this.primaryService.generateEventDescription) {
        return await this.primaryService.generateEventDescription(eventDetails);
      }

      return this.generateBasicEventDescription(eventDetails);
    } catch (error) {
      console.error("Error generating event description:", error);
      return this.generateBasicEventDescription(eventDetails);
    }
  }

  // Enhanced fallback methods with more intelligent responses
  getStaticFallback(prompt) {
    // Extract user message from complex prompts
    const userMessageMatch = prompt.match(/User asked: "([^"]+)"/);
    const userMessage = userMessageMatch ? userMessageMatch[1] : prompt;
    const lowerPrompt = userMessage.toLowerCase();
    
    console.log(`🔄 Enhanced static fallback for: "${userMessage}"`);
    
    // Weekend/time-based queries (high priority)
    if (lowerPrompt.includes('weekend') || lowerPrompt.includes('this weekend')) {
      return "Looking for weekend events? Great idea! I can help you find activities happening Saturday and Sunday. Try searching for specific types like 'weekend tech events', 'weekend music shows', or 'weekend workshops'. You can also specify your location for better results!";
    }
    
    // Event creation help (high priority)
    if (lowerPrompt.includes('create') && (lowerPrompt.includes('event') || lowerPrompt.includes('description'))) {
      return "I'd love to help you create an amazing event! Here are some key tips for great event descriptions:\n\n• Start with a compelling title that clearly states what it is\n• Include the main benefit attendees will get\n• Mention date, time, and location clearly\n• Add what makes your event unique\n• Include a clear call-to-action\n\nFor AI-powered description generation and advanced tools, consider creating an account! What type of event are you planning?";
    }
    
    // Help/capabilities queries (high priority)
    if (lowerPrompt.includes('help') || lowerPrompt.includes('what can you') || lowerPrompt.includes('what do you')) {
      return "I'm your AI Event Assistant! Here's how I can help you:\n\n🔍 **Find Events**: Search by type, location, date, or keywords\n📅 **Discover Activities**: Weekend events, popular shows, local meetups\n✍️ **Event Creation**: Tips and guidance for organizing events\n💡 **Get Recommendations**: Suggestions based on what's popular\n\n**For Guests**: Basic search and discovery\n**For Members**: Personalized recommendations, saved favorites, event creation tools\n\nWhat would you like to explore?";
    }
    
    // Recommendation requests (high priority)
    if (lowerPrompt.includes('recommend') || lowerPrompt.includes('suggest')) {
      return "I'd love to recommend events for you! While I can show you popular events as a guest, personalized recommendations work best when you're logged in so I can learn your preferences.\n\nFor now, I can help you search for specific types of events like:\n• Tech meetups and conferences\n• Music concerts and festivals\n• Art exhibitions and workshops\n• Business networking events\n\nWhat type of events interest you most?";
    }
    
    // Greeting responses
    if (
      lowerPrompt.includes("hello") ||
      lowerPrompt.includes("hi") ||
      lowerPrompt.includes("hey")
    ) {
      return "Hello! 👋 I'm your AI Event Assistant powered by intelligent agents. I can help you discover events, get personalized recommendations, and answer questions about events. What would you like to explore today?";
    }

    // Search-related queries
    if (
      lowerPrompt.includes("find") ||
      lowerPrompt.includes("search") ||
      lowerPrompt.includes("show")
    ) {
      if (lowerPrompt.includes("tech")) {
        return "I can help you find technology events! I'll search for tech meetups, conferences, workshops, and networking events. You can specify things like 'AI events', 'coding bootcamps', or 'startup meetups' for more targeted results.";
      }
      if (lowerPrompt.includes("music")) {
        return "Looking for music events? I can help you discover concerts, festivals, open mic nights, and music workshops. Tell me your preferred genre or if you're looking for live performances vs. learning opportunities.";
      }
      if (
        lowerPrompt.includes("weekend") ||
        lowerPrompt.includes("this weekend")
      ) {
        return "Great! I can help you find weekend events. I'll look for activities happening Saturday and Sunday. Are you interested in any particular type of event - social, educational, entertainment, or networking?";
      }
      return "I can help you find events! Try being specific about what you're looking for - like 'tech meetups', 'art workshops', 'business networking', or 'weekend activities'. I can also filter by location, date, or price range.";
    }

    // Recommendation queries
    if (lowerPrompt.includes("recommend") || lowerPrompt.includes("suggest")) {
      return "I'd love to give you personalized recommendations! Based on your interests and location, I can suggest events that match your preferences. For the best recommendations, log in to your account so I can learn your preferences, or tell me what types of activities you enjoy.";
    }

    // Event creation queries
    if (
      lowerPrompt.includes("create") ||
      lowerPrompt.includes("organize") ||
      lowerPrompt.includes("plan")
    ) {
      return "Exciting! I can help you create amazing events. I can assist with writing compelling descriptions, choosing the right categories, optimizing for better visibility, and even predicting attendance. What type of event are you planning?";
    }

    // Location-based queries
    if (lowerPrompt.includes("near me") || lowerPrompt.includes("nearby")) {
      return "I can help you find events near your location! I'll use your location to show relevant local events. You can also specify a city or area if you're planning to travel for an event.";
    }

    // Time-based queries
    if (lowerPrompt.includes("today") || lowerPrompt.includes("tonight")) {
      return "Looking for something happening today? I'll search for events with same-day availability. Keep in mind that popular events might be sold out, but there are often last-minute opportunities!";
    }

    // Price-related queries
    if (lowerPrompt.includes("free") || lowerPrompt.includes("cheap")) {
      return "Budget-friendly events are great! I can help you find free events, low-cost workshops, and community gatherings. Many networking events, meetups, and educational sessions are free or very affordable.";
    }

    // General help
    if (
      lowerPrompt.includes("help") ||
      lowerPrompt.includes("what can you do")
    ) {
      return "I'm a multi-agent AI assistant specialized in events! Here's what I can do:\n\n🔍 Find events by category, location, date, or price\n💡 Provide personalized recommendations\n📝 Help organizers create compelling event descriptions\n📊 Analyze event performance and predict attendance\n🛡️ Ensure event safety and quality\n\nWhat would you like to start with?";
    }

    return "I'm here to help you with all things events! Whether you're looking to attend events, organize them, or just explore what's happening in your area, I've got you covered. What would you like to do today?";
  }

  classifyIntentFallback(message) {
    const lowerMessage = message.toLowerCase();

    if (
      lowerMessage.includes("find") ||
      lowerMessage.includes("search") ||
      lowerMessage.includes("show") ||
      lowerMessage.includes("look")
    ) {
      return "search";
    }

    if (
      lowerMessage.includes("recommend") ||
      lowerMessage.includes("suggest") ||
      lowerMessage.includes("advice")
    ) {
      return "recommend";
    }

    if (
      lowerMessage.includes("create") ||
      lowerMessage.includes("organize") ||
      lowerMessage.includes("make") ||
      lowerMessage.includes("plan")
    ) {
      return "create";
    }

    if (
      lowerMessage.includes("moderate") ||
      lowerMessage.includes("admin") ||
      lowerMessage.includes("flag") ||
      lowerMessage.includes("review")
    ) {
      return "moderate";
    }

    if (
      lowerMessage.includes("analyze") ||
      lowerMessage.includes("analytics") ||
      lowerMessage.includes("stats") ||
      lowerMessage.includes("report")
    ) {
      return "analyze";
    }

    return "general";
  }

  generateBasicRAGResponse(query, context) {
    if (!context || context.trim().length === 0) {
      const lowerQuery = query.toLowerCase();

      if (lowerQuery.includes("tech") || lowerQuery.includes("technology")) {
        return "I don't see any tech events in our current database, but new events are added regularly! Try checking back later or consider creating your own tech meetup - I can help you with that!";
      }

      if (lowerQuery.includes("music")) {
        return "No music events found right now, but the music scene is always evolving! You might want to check local venues or consider organizing a music event yourself.";
      }

      return "I don't have specific events matching your search right now, but our event database is constantly updated. Try broadening your search terms or check back later for new events!";
    }

    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes("recommend") || lowerQuery.includes("suggest")) {
      return `Great! I found some events that might interest you based on your search. Here are the highlights:

${this.formatContextForUser(context)}

These events were selected based on relevance to your interests. Would you like more details about any of them?`;
    }

    if (lowerQuery.includes("find") || lowerQuery.includes("search")) {
      return `Perfect! I found several events matching your search criteria:

${this.formatContextForUser(context)}

Would you like me to provide more details about any of these events or help you narrow down the options?`;
    }

    return `Here's what I found for you:\n\n${this.formatContextForUser(
      context
    )}\n\nLet me know if you need more information about any of these events or want to refine your search!`;
  }

  formatContextForUser(context) {
    // Try to extract event information and format it nicely
    const lines = context.split("\n").filter((line) => line.trim());
    const formattedLines = lines.slice(0, 3).map((line) => {
      // Clean up the line and make it more readable
      return line.replace(/^\d+\.\s*/, "• ").trim();
    });

    return formattedLines.join("\n");
  }

  generateBasicEventDescription(eventDetails) {
    const type = eventDetails.type || "event";
    const topic = eventDetails.topic || "exciting activities";

    return `Join us for an engaging ${type} focused on ${topic}. This event brings together people who share similar interests for networking, learning, and fun. Don't miss this opportunity to connect with like-minded individuals and discover something new!`;
  }

  // Health check
  getServiceStatus() {
    return {
      primaryService: this.primaryService ? "available" : "not_configured",
      geminiConfigured: !!(
        process.env.GEMINI_API_KEY &&
        process.env.GEMINI_API_KEY !== "your_gemini_api_key_here"
      ),
    };
  }
}

module.exports = new AIService();
