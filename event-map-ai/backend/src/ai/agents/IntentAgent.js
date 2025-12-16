/**
 * INTENT UNDERSTANDING AGENT
 * Analyzes user messages to understand what they want to do
 */

const aiService = require('../aiService');

class IntentAgent {
  constructor() {
    this.intentPatterns = {
      search: ['find', 'search', 'looking for', 'show me', 'list', 'what events', 'any events'],
      create: ['create', 'make', 'organize', 'plan', 'host', 'generate description', 'help me write'],
      recommend: ['recommend', 'suggest', 'what should', 'best events', 'popular', 'for me'],
      moderate: ['flagged', 'review', 'moderation', 'risky', 'spam', 'inappropriate'],
      analyze: ['analytics', 'insights', 'performance', 'statistics', 'how many', 'trends'],
      when: ['when', 'what time', 'schedule', 'date'],
      where: ['where', 'location', 'venue', 'place'],
      price: ['price', 'cost', 'ticket', 'fee', 'how much', 'free'],
      attend: ['attend', 'join', 'register', 'sign up', 'rsvp'],
      greeting: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'help']
    };

    this.filterPatterns = {
      category: ['music', 'tech', 'art', 'sports', 'food', 'business', 'education', 'workshop'],
      time: ['today', 'tomorrow', 'weekend', 'next week', 'this month'],
      location: ['near me', 'downtown', 'online', 'virtual'],
      price: ['free', 'cheap', 'expensive', 'under', 'over']
    };
  }

  async analyzeIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    // Primary intent classification
    const primaryIntent = this.classifyPrimaryIntent(lowerMessage);
    
    // Extract filters and parameters
    const filters = this.extractFilters(lowerMessage);
    
    // Extract entities (locations, dates, categories)
    const entities = await this.extractEntities(message);
    
    // Determine confidence based on pattern matches
    const confidence = this.calculateConfidence(lowerMessage, primaryIntent);

    // Use AI for complex intent analysis if confidence is low
    let enhancedIntent = null;
    if (confidence < 0.7) {
      enhancedIntent = await this.getAIIntentAnalysis(message);
    }

    return {
      category: primaryIntent,
      confidence,
      filters,
      entities,
      enhancedIntent,
      originalMessage: message,
      context: this.extractContext(lowerMessage)
    };
  }

  classifyPrimaryIntent(message) {
    const scores = {};
    
    // Calculate scores for each intent category
    Object.keys(this.intentPatterns).forEach(intent => {
      scores[intent] = this.intentPatterns[intent].reduce((score, pattern) => {
        if (message.includes(pattern)) {
          return score + 1;
        }
        return score;
      }, 0);
    });

    // Find the highest scoring intent
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) return 'general';

    return Object.keys(scores).find(intent => scores[intent] === maxScore);
  }

  extractFilters(message) {
    const filters = {};

    // Extract category filters
    const categories = this.filterPatterns.category.filter(cat => message.includes(cat));
    if (categories.length > 0) filters.categories = categories;

    // Extract time filters
    const timeFilters = this.filterPatterns.time.filter(time => message.includes(time));
    if (timeFilters.length > 0) filters.timeframe = timeFilters;

    // Extract location filters
    const locationFilters = this.filterPatterns.location.filter(loc => message.includes(loc));
    if (locationFilters.length > 0) filters.location = locationFilters;

    // Extract price filters
    const priceFilters = this.filterPatterns.price.filter(price => message.includes(price));
    if (priceFilters.length > 0) filters.price = priceFilters;

    return filters;
  }

  async extractEntities(message) {
    const entities = {
      locations: [],
      dates: [],
      categories: [],
      numbers: []
    };

    // Simple regex patterns for entity extraction
    const datePattern = /\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{1,2}-\d{1,2}-\d{4}\b/g;
    const numberPattern = /\b\d+\b/g;

    entities.dates = message.match(datePattern) || [];
    entities.numbers = message.match(numberPattern) || [];

    // Extract potential location names (capitalized words)
    const locationPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
    entities.locations = message.match(locationPattern) || [];

    return entities;
  }

  calculateConfidence(message, intent) {
    const patternMatches = this.intentPatterns[intent] ? 
      this.intentPatterns[intent].filter(pattern => message.includes(pattern)).length : 0;
    
    const totalPatterns = this.intentPatterns[intent] ? this.intentPatterns[intent].length : 1;
    
    // Base confidence on pattern matches
    let confidence = patternMatches / totalPatterns;
    
    // Boost confidence for exact matches
    if (patternMatches > 0) confidence = Math.min(confidence + 0.3, 1.0);
    
    // Reduce confidence for very short messages
    if (message.length < 10) confidence *= 0.8;
    
    return Math.round(confidence * 100) / 100;
  }

  async getAIIntentAnalysis(message) {
    try {
      const intent = await aiService.classifyIntent(message);
      
      // Get additional analysis with a more detailed prompt
      const prompt = `
        Analyze this user message for event-related intent: "${message}"
        
        Extract specific requirements like:
        - Location preferences
        - Event categories/types
        - Time preferences
        - Price preferences
        - Any other specific needs
        
        Provide a brief reasoning for the classification.
      `;

      const analysis = await aiService.generateResponse(prompt, { maxTokens: 200 });
      
      return {
        intent: intent,
        confidence: 0.8,
        requirements: this.extractRequirementsFromAnalysis(analysis),
        reasoning: analysis
      };
    } catch (error) {
      console.error('AI intent analysis failed:', error);
      return null;
    }
  }

  extractRequirementsFromAnalysis(analysis) {
    const requirements = [];
    const lowerAnalysis = analysis.toLowerCase();
    
    if (lowerAnalysis.includes('location') || lowerAnalysis.includes('near')) {
      requirements.push('location_specific');
    }
    if (lowerAnalysis.includes('time') || lowerAnalysis.includes('date')) {
      requirements.push('time_specific');
    }
    if (lowerAnalysis.includes('category') || lowerAnalysis.includes('type')) {
      requirements.push('category_specific');
    }
    if (lowerAnalysis.includes('price') || lowerAnalysis.includes('free') || lowerAnalysis.includes('cost')) {
      requirements.push('price_sensitive');
    }
    
    return requirements;
  }

  extractContext(message) {
    const context = {
      urgency: 'normal',
      specificity: 'general',
      sentiment: 'neutral'
    };

    // Detect urgency
    if (message.includes('urgent') || message.includes('asap') || message.includes('immediately')) {
      context.urgency = 'high';
    } else if (message.includes('when you can') || message.includes('no rush')) {
      context.urgency = 'low';
    }

    // Detect specificity
    if (message.includes('specific') || message.includes('exact') || message.includes('particular')) {
      context.specificity = 'high';
    }

    // Simple sentiment analysis
    const positiveWords = ['great', 'awesome', 'love', 'excited', 'amazing'];
    const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'disappointed'];
    
    const positiveCount = positiveWords.filter(word => message.includes(word)).length;
    const negativeCount = negativeWords.filter(word => message.includes(word)).length;
    
    if (positiveCount > negativeCount) context.sentiment = 'positive';
    else if (negativeCount > positiveCount) context.sentiment = 'negative';

    return context;
  }
}

module.exports = IntentAgent;