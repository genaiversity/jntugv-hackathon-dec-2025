// Enhanced AI event classification service
// Uses Gemini API for more sophisticated classification
const geminiService = require('./geminiService');

class EventClassifier {
  // Enhanced function to classify events into categories
  async classifyEvent(title, description) {
    try {
      // First try Gemini API for classification
      const prompt = `
        Classify the following event into one of these categories:
        music, sports, workshop, exhibition, college fest, religious, promotion, other
        
        Title: ${title}
        Description: ${description}
        
        Respond with only the category name in lowercase.
      `;
      
      const response = await geminiService.generateResponse(prompt);
      
      // Validate response
      const validCategories = ['music', 'sports', 'workshop', 'exhibition', 'college fest', 'religious', 'promotion', 'other'];
      const category = response.trim().toLowerCase();
      
      if (validCategories.includes(category)) {
        return category;
      } else {
        // Fallback to keyword-based classification
        return this.keywordBasedClassification(title, description);
      }
    } catch (error) {
      console.error('Gemini classification failed, falling back to keyword-based:', error);
      // Fallback to keyword-based classification
      return this.keywordBasedClassification(title, description);
    }
  }
  
  // Fallback keyword-based classification
  keywordBasedClassification(title, description) {
    const text = (title + ' ' + description).toLowerCase();
    
    // Enhanced keyword-based classification with weights
    const categories = {
      music: {
        keywords: ['music', 'concert', 'band', 'dj', 'festival', 'gig', 'live', 'song', 'album', 'performance', 'orchestra', 'symphony'],
        weight: 1.0
      },
      sports: {
        keywords: ['sport', 'football', 'basketball', 'soccer', 'tennis', 'match', 'game', 'tournament', 'league', 'championship', 'race', 'marathon'],
        weight: 1.0
      },
      workshop: {
        keywords: ['workshop', 'training', 'course', 'tutorial', 'seminar', 'class', 'lesson', 'bootcamp', 'webinar', 'certification'],
        weight: 1.0
      },
      exhibition: {
        keywords: ['exhibition', 'art', 'gallery', 'museum', 'show', 'display', 'painting', 'sculpture', 'photography', 'installation'],
        weight: 1.0
      },
      'college fest': {
        keywords: ['college', 'university', 'fest', 'campus', 'student', 'graduation', 'alumni', 'orientation'],
        weight: 1.0
      },
      religious: {
        keywords: ['church', 'temple', 'mosque', 'prayer', 'worship', 'bible', 'quran', 'god', 'faith', 'spiritual'],
        weight: 1.0
      },
      promotion: {
        keywords: ['sale', 'discount', 'offer', 'deal', 'promotion', 'marketing', 'advertisement', 'launch', 'product'],
        weight: 1.0
      }
    };
    
    let bestCategory = 'other';
    let maxScore = 0;
    
    // Calculate scores for each category
    for (const [category, data] of Object.entries(categories)) {
      let score = 0;
      
      // Count keyword matches
      for (const keyword of data.keywords) {
        const regex = new RegExp('\\b' + keyword + '\\b', 'gi');
        const matches = (text.match(regex) || []).length;
        score += matches * data.weight;
      }
      
      // Bonus for title matches
      const titleText = title.toLowerCase();
      for (const keyword of data.keywords) {
        const regex = new RegExp('\\b' + keyword + '\\b', 'gi');
        const matches = (titleText.match(regex) || []).length;
        score += matches * data.weight * 1.5; // Higher weight for title
      }
      
      if (score > maxScore) {
        maxScore = score;
        bestCategory = category;
      }
    }
    
    // Minimum threshold for classification
    return maxScore >= 0.5 ? bestCategory : 'other';
  }
  
  // Get confidence score for classification
  getClassificationConfidence(title, description, category) {
    const text = (title + ' ' + description).toLowerCase();
    
    const categoryKeywords = {
      music: ['music', 'concert', 'band', 'dj', 'festival', 'gig', 'live', 'song', 'album'],
      sports: ['sport', 'football', 'basketball', 'soccer', 'tennis', 'match', 'game', 'tournament'],
      workshop: ['workshop', 'training', 'course', 'tutorial', 'seminar', 'class'],
      exhibition: ['exhibition', 'art', 'gallery', 'museum', 'show', 'display'],
      'college fest': ['college', 'university', 'fest', 'campus', 'student'],
      religious: ['church', 'temple', 'mosque', 'prayer', 'worship', 'god'],
      promotion: ['sale', 'discount', 'offer', 'deal', 'promotion', 'marketing']
    };
    
    if (!categoryKeywords[category]) return 0;
    
    let matches = 0;
    for (const keyword of categoryKeywords[category]) {
      const regex = new RegExp('\\b' + keyword + '\\b', 'gi');
      matches += (text.match(regex) || []).length;
    }
    
    // Normalize score (0-1 range)
    return Math.min(matches / 5, 1.0);
  }
}

module.exports = new EventClassifier();