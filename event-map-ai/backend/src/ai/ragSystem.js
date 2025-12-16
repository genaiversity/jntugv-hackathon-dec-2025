const natural = require('natural');
const TfIdf = natural.TfIdf;

class RAGSystem {
  constructor() {
    this.tfidf = new TfIdf();
    this.events = [];
    this.eventDocuments = [];
    this.stemmer = natural.PorterStemmer;
    this.tokenizer = new natural.WordTokenizer();
  }

  // Initialize the RAG system with events data
  initializeWithEvents(events) {
    this.events = events;
    this.eventDocuments = [];
    this.tfidf = new TfIdf();

    // Create searchable documents from events
    events.forEach((event, index) => {
      const document = this.createEventDocument(event);
      this.eventDocuments.push(document);
      this.tfidf.addDocument(document);
    });
  }

  // Create a searchable document from event data
  createEventDocument(event) {
    const fields = [
      event.title || '',
      event.description || '',
      event.location || '',
      event.category || '',
      event.tags ? event.tags.join(' ') : '',
      new Date(event.date).toLocaleDateString(),
      event.organizer || ''
    ];
    
    return fields.join(' ').toLowerCase();
  }

  // Search for relevant events using TF-IDF
  searchEvents(query, limit = 5) {
    if (!query || this.events.length === 0) {
      return [];
    }

    const processedQuery = query.toLowerCase();
    const results = [];

    // Calculate TF-IDF scores for the query
    this.tfidf.tfidfs(processedQuery, (i, measure) => {
      if (measure > 0) {
        results.push({
          event: this.events[i],
          score: measure,
          relevance: this.calculateRelevance(processedQuery, this.eventDocuments[i])
        });
      }
    });

    // Sort by combined score and return top results
    return results
      .sort((a, b) => (b.score + b.relevance) - (a.score + a.relevance))
      .slice(0, limit)
      .map(result => result.event);
  }

  // Calculate additional relevance based on keyword matching
  calculateRelevance(query, document) {
    const queryTokens = this.tokenizer.tokenize(query);
    const docTokens = this.tokenizer.tokenize(document);
    
    let matches = 0;
    queryTokens.forEach(token => {
      const stemmedToken = this.stemmer.stem(token);
      docTokens.forEach(docToken => {
        if (this.stemmer.stem(docToken) === stemmedToken) {
          matches++;
        }
      });
    });

    return matches / queryTokens.length;
  }

  // Generate AI response based on query and context
  generateResponse(query, relevantEvents) {
    const lowerQuery = query.toLowerCase();
    
    // Intent classification
    const intents = this.classifyIntent(lowerQuery);
    
    if (intents.includes('greeting')) {
      return this.generateGreetingResponse();
    }
    
    if (intents.includes('search') || intents.includes('find')) {
      return this.generateSearchResponse(relevantEvents, query);
    }
    
    if (intents.includes('when') || intents.includes('time')) {
      return this.generateTimeResponse(relevantEvents);
    }
    
    if (intents.includes('where') || intents.includes('location')) {
      return this.generateLocationResponse(relevantEvents);
    }
    
    if (intents.includes('price') || intents.includes('cost')) {
      return this.generatePriceResponse(relevantEvents);
    }
    
    if (intents.includes('recommend')) {
      return this.generateRecommendationResponse();
    }

    // Default response with context
    return this.generateDefaultResponse(query, relevantEvents);
  }

  // Classify user intent
  classifyIntent(query) {
    const intents = [];
    
    const intentPatterns = {
      greeting: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
      search: ['find', 'search', 'looking for', 'show me', 'list'],
      when: ['when', 'what time', 'date', 'schedule'],
      where: ['where', 'location', 'place', 'venue'],
      price: ['price', 'cost', 'ticket', 'fee', 'how much'],
      recommend: ['recommend', 'suggest', 'popular', 'best']
    };

    Object.keys(intentPatterns).forEach(intent => {
      if (intentPatterns[intent].some(pattern => query.includes(pattern))) {
        intents.push(intent);
      }
    });

    return intents;
  }

  // Response generators
  generateGreetingResponse() {
    const greetings = [
      "Hello! I'm your Event Assistant. How can I help you find the perfect event?",
      "Hi there! I can help you discover events, get details, and answer questions. What are you looking for?",
      "Hey! Ready to explore some amazing events? Ask me anything!"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  generateSearchResponse(events, query) {
    if (events.length === 0) {
      return `I couldn't find any events matching "${query}". Try searching with different keywords like location, category, or date.`;
    }

    const eventList = events.slice(0, 3).map(event => 
      `• **${event.title}** - ${event.location} (${new Date(event.date).toLocaleDateString()})\n  ${event.description?.substring(0, 100)}...`
    ).join('\n\n');

    return `I found ${events.length} event${events.length > 1 ? 's' : ''} matching your search:\n\n${eventList}\n\nWould you like more details about any of these events?`;
  }

  generateTimeResponse(events) {
    if (events.length === 0) {
      return "I need more specific information to help you with event timing. Try asking about a specific event or category.";
    }

    const event = events[0];
    const date = new Date(event.date).toLocaleDateString();
    const time = event.time || 'Time TBD';
    
    return `**${event.title}** is scheduled for ${date} at ${time}. Location: ${event.location}`;
  }

  generateLocationResponse(events) {
    if (events.length === 0) {
      return "I need more information to help you with event locations. Try asking about specific events or areas.";
    }

    const locations = [...new Set(events.map(e => e.location))];
    if (locations.length === 1) {
      return `The event is located at ${locations[0]}. Would you like directions or more details about the venue?`;
    } else {
      return `Events are happening at multiple locations: ${locations.join(', ')}. Which location interests you most?`;
    }
  }

  generatePriceResponse(events) {
    if (events.length === 0) {
      return "I need more specific information to help you with pricing. Try asking about a particular event.";
    }

    const event = events[0];
    if (event.price) {
      return `**${event.title}** costs $${event.price}. You can register through our platform for secure booking!`;
    } else {
      return `Pricing information for **${event.title}** is not currently available. Please contact the organizer for details.`;
    }
  }

  generateRecommendationResponse() {
    const popularEvents = this.events
      .sort((a, b) => (b.attendees || 0) - (a.attendees || 0))
      .slice(0, 3);

    if (popularEvents.length === 0) {
      return "I don't have any events to recommend right now. Check back later for new events!";
    }

    const recommendations = popularEvents.map(event => 
      `• **${event.title}** - ${event.category}\n  ${event.description?.substring(0, 80)}...`
    ).join('\n\n');

    return `Here are some popular events I'd recommend:\n\n${recommendations}`;
  }

  generateDefaultResponse(query, events) {
    if (events.length > 0) {
      const event = events[0];
      return `I found information about **${event.title}**. ${event.description?.substring(0, 100)}... Would you like to know more about this event or search for something else?`;
    }

    return `I understand you're asking about "${query}". I can help you with:

• Finding events by location, date, or category
• Getting event details like timing and pricing  
• Recommending popular events
• Answering questions about specific events

Try asking something like "Find music events this weekend" or "What events are near downtown?"`;
  }

  // Add semantic similarity for better matching
  calculateSemanticSimilarity(query, eventText) {
    // Simple word overlap similarity
    const queryWords = new Set(this.tokenizer.tokenize(query.toLowerCase()));
    const eventWords = new Set(this.tokenizer.tokenize(eventText.toLowerCase()));
    
    const intersection = new Set([...queryWords].filter(x => eventWords.has(x)));
    const union = new Set([...queryWords, ...eventWords]);
    
    return intersection.size / union.size;
  }
}

module.exports = RAGSystem;