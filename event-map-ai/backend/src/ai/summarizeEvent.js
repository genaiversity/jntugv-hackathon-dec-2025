// Enhanced AI summarization service
// Uses Gemini API for more sophisticated summarization
const geminiService = require('./geminiService');

class EventSummarizer {
  // Enhanced function to generate event summaries
  async summarizeEvent(title, description) {
    try {
      // First try Gemini API for summarization
      const prompt = `
        Summarize the following event information:
        
        Title: ${title}
        Description: ${description}
        
        Provide:
        1. A short title (max 5 words)
        2. A concise summary (max 20 words)
        3. Key highlights (3 bullet points)
        4. Relevant tags (5 tags)
        
        Respond with a JSON object with the exact structure:
        {
          "shortTitle": "string",
          "summary": "string",
          "highlights": ["string", "string", "string"],
          "tags": ["string", "string", "string", "string", "string"]
        }
      `;
      
      const response = await geminiService.generateResponse(prompt);
      
      // Try to parse the response as JSON
      try {
        const result = JSON.parse(response);
        
        // Validate the structure
        if (typeof result.shortTitle === 'string' &&
            typeof result.summary === 'string' &&
            Array.isArray(result.highlights) &&
            Array.isArray(result.tags)) {
          return {
            shortTitle: result.shortTitle,
            summary: result.summary,
            highlights: result.highlights.slice(0, 3),
            tags: result.tags.slice(0, 5),
            metadata: {
              originalTitleLength: title.split(' ').length,
              originalDescriptionLength: description.split(' ').length,
              summaryCompressionRatio: result.summary.split(' ').length / description.split(' ').length
            }
          };
        }
      } catch (parseError) {
        console.error('Failed to parse Gemini summarization response:', parseError);
      }
      
      // Fallback to rule-based summarization
      return this.ruleBasedSummarization(title, description);
    } catch (error) {
      console.error('Gemini summarization failed, falling back to rule-based:', error);
      // Fallback to rule-based summarization
      return this.ruleBasedSummarization(title, description);
    }
  }
  
  // Fallback rule-based summarization
  ruleBasedSummarization(title, description) {
    // Generate short title (max 5 words)
    const shortTitle = this.generateShortTitle(title);
    
    // Generate summary (max 20 words)
    const summary = this.generateSummary(description);
    
    // Extract key highlights
    const highlights = this.extractHighlights(description);
    
    // Generate tags
    const tags = this.extractTags(title, description);
    
    return {
      shortTitle: shortTitle,
      summary: summary,
      highlights: highlights,
      tags: tags,
      metadata: {
        originalTitleLength: title.split(' ').length,
        originalDescriptionLength: description.split(' ').length,
        summaryCompressionRatio: summary.split(' ').length / description.split(' ').length
      }
    };
  }
  
  // Generate short title (max 5 words)
  generateShortTitle(title) {
    const words = title.split(' ');
    if (words.length <= 5) {
      return title;
    }
    
    // Try to preserve important words (verbs, nouns)
    const importantWords = this.extractImportantWords(title);
    if (importantWords.length >= 3 && importantWords.length <= 5) {
      return importantWords.join(' ');
    }
    
    // Fallback to first 5 words
    return words.slice(0, 5).join(' ') + '...';
  }
  
  // Generate summary (max 20 words)
  generateSummary(description) {
    const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length === 0) {
      return '';
    }
    
    // Start with the first sentence
    let summary = sentences[0].trim();
    
    // Add key points from subsequent sentences if needed
    let wordCount = summary.split(' ').length;
    
    for (let i = 1; i < sentences.length && wordCount < 20; i++) {
      const sentence = sentences[i].trim();
      const sentenceWords = sentence.split(' ').length;
      
      if (wordCount + sentenceWords <= 25) { // Allow slight overrun
        summary += '. ' + sentence;
        wordCount += sentenceWords + 1; // +1 for period
      } else {
        break;
      }
    }
    
    // Trim to exactly 20 words if needed
    const summaryWords = summary.split(' ');
    if (summaryWords.length > 20) {
      return summaryWords.slice(0, 20).join(' ') + '...';
    }
    
    return summary;
  }
  
  // Extract key highlights
  extractHighlights(description) {
    const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const highlights = [];
    
    // Extract first few sentences as highlights
    for (let i = 0; i < Math.min(3, sentences.length); i++) {
      const sentence = sentences[i].trim();
      if (sentence.length > 0) {
        // Capitalize first letter and ensure punctuation
        let formattedSentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
        if (!/[.!?]$/.test(formattedSentence)) {
          formattedSentence += '.';
        }
        highlights.push(formattedSentence);
      }
    }
    
    return highlights;
  }
  
  // Extract tags from title and description
  extractTags(title, description) {
    const text = (title + ' ' + description).toLowerCase();
    const commonWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'a', 'an']);
    
    // Extract potential tags (non-common words)
    const words = text.match(/\b\w+\b/g) || [];
    const wordFreq = {};
    
    for (const word of words) {
      if (word.length > 3 && !commonWords.has(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    }
    
    // Sort by frequency and return top 5
    const sortedWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
    
    return sortedWords;
  }
  
  // Extract important words (simplified POS tagging)
  extractImportantWords(title) {
    const words = title.split(' ');
    const importantWords = [];
    
    // Simple heuristic: keep nouns and verbs (words that are capitalized or longer)
    for (const word of words) {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 3) {
        importantWords.push(cleanWord);
      }
    }
    
    return importantWords.slice(0, 5);
  }
  
  // Get readability score
  getReadabilityScore(description) {
    const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = description.split(/\s+/).filter(w => w.length > 0);
    
    if (sentences.length === 0 || words.length === 0) {
      return 0;
    }
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = this.estimateSyllables(words) / words.length;
    
    // Simplified Flesch-Kincaid grade level
    const gradeLevel = (0.39 * avgWordsPerSentence) + (11.8 * avgSyllablesPerWord) - 15.59;
    
    return Math.max(0, Math.min(1, gradeLevel / 20)); // Normalize to 0-1
  }
  
  // Estimate syllables (very rough approximation)
  estimateSyllables(words) {
    let totalSyllables = 0;
    for (const word of words) {
      // Very rough estimation: count vowel groups
      const vowels = word.match(/[aeiouy]+/gi);
      totalSyllables += vowels ? vowels.length : 1;
    }
    return totalSyllables;
  }
}

module.exports = new EventSummarizer();