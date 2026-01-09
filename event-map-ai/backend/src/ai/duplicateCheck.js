// Enhanced AI duplicate detection service
// Uses embeddings for more sophisticated comparison
const embeddingService = require('./embeddingService');

class DuplicateChecker {
  // Enhanced function to check for duplicate events
  async checkForDuplicates(newEvent, existingEvents) {
    try {
      // Generate embeddings for the new event
      const newEventText = `${newEvent.title} ${newEvent.description}`;
      const newEventEmbedding = await embeddingService.generateEmbedding(newEventText);
      
      const duplicates = [];
      
      for (const event of existingEvents) {
        // Generate embedding for existing event
        const existingEventText = `${event.title} ${event.description}`;
        const existingEventEmbedding = await embeddingService.generateEmbedding(existingEventText);
        
        // Calculate cosine similarity between embeddings
        const embeddingSimilarity = this.cosineSimilarity(newEventEmbedding, existingEventEmbedding);
        
        // Calculate text similarity as backup
        const titleSimilarity = this.calculateTextSimilarity(newEvent.title, event.title);
        const descriptionSimilarity = this.calculateTextSimilarity(newEvent.description, event.description);
        
        // Check if events are close in location (within 1km)
        const distance = this.calculateDistance(
          newEvent.latitude, newEvent.longitude,
          event.locationCoords.coordinates[1], event.locationCoords.coordinates[0]
        );
        
        // Check if events are close in time (within 2 hours)
        const timeDiff = Math.abs(new Date(newEvent.date) - new Date(event.date));
        const timeClose = timeDiff <= 2 * 60 * 60 * 1000; // 2 hours in milliseconds
        
        // Weighted similarity score (now with embedding similarity)
        const weightedScore = (
          embeddingSimilarity * 0.5 + // Higher weight for embedding similarity
          titleSimilarity * 0.2 + 
          descriptionSimilarity * 0.2 + 
          (1 - distance/10) * 0.05 + // Normalize distance to 10km
          (timeClose ? 0.05 : 0)
        );
        
        // If high similarity, mark as duplicate candidate
        if (weightedScore > 0.7) {
          duplicates.push({
            eventId: event._id,
            title: event.title,
            similarityScore: parseFloat(weightedScore.toFixed(3)),
            embeddingSimilarity: parseFloat(embeddingSimilarity.toFixed(3)),
            titleSimilarity: parseFloat(titleSimilarity.toFixed(3)),
            descriptionSimilarity: parseFloat(descriptionSimilarity.toFixed(3)),
            distance: parseFloat(distance.toFixed(2)),
            timeDifference: timeDiff
          });
        }
      }
      
      // Sort by similarity score (highest first)
      duplicates.sort((a, b) => b.similarityScore - a.similarityScore);
      
      return duplicates;
    } catch (error) {
      console.error('Embedding-based duplicate detection failed, falling back to text-based:', error);
      // Fallback to original text-based approach
      return this.textBasedDuplicateCheck(newEvent, existingEvents);
    }
  }
  
  // Fallback text-based duplicate check
  textBasedDuplicateCheck(newEvent, existingEvents) {
    const duplicates = [];
    
    for (const event of existingEvents) {
      // Calculate multiple similarity metrics
      const titleSimilarity = this.calculateTextSimilarity(newEvent.title, event.title);
      const descriptionSimilarity = this.calculateTextSimilarity(newEvent.description, event.description);
      
      // Check if events are close in location (within 1km)
      const distance = this.calculateDistance(
        newEvent.latitude, newEvent.longitude,
        event.locationCoords.coordinates[1], event.locationCoords.coordinates[0]
      );
      
      // Check if events are close in time (within 2 hours)
      const timeDiff = Math.abs(new Date(newEvent.date) - new Date(event.date));
      const timeClose = timeDiff <= 2 * 60 * 60 * 1000; // 2 hours in milliseconds
      
      // Weighted similarity score
      const weightedScore = (
        titleSimilarity * 0.4 + 
        descriptionSimilarity * 0.4 + 
        (1 - distance/10) * 0.1 + // Normalize distance to 10km
        (timeClose ? 0.1 : 0)
      );
      
      // If high similarity, mark as duplicate candidate
      if (weightedScore > 0.7) {
        duplicates.push({
          eventId: event._id,
          title: event.title,
          similarityScore: parseFloat(weightedScore.toFixed(3)),
          titleSimilarity: parseFloat(titleSimilarity.toFixed(3)),
          descriptionSimilarity: parseFloat(descriptionSimilarity.toFixed(3)),
          distance: parseFloat(distance.toFixed(2)),
          timeDifference: timeDiff
        });
      }
    }
    
    // Sort by similarity score (highest first)
    duplicates.sort((a, b) => b.similarityScore - a.similarityScore);
    
    return duplicates;
  }
  
  // Cosine similarity for embeddings
  cosineSimilarity(vec1, vec2) {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) return 0;
    
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      magnitude1 += vec1[i] * vec1[i];
      magnitude2 += vec2[i] * vec2[i];
    }
    
    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);
    
    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    
    return dotProduct / (magnitude1 * magnitude2);
  }
  
  // Enhanced text similarity using multiple techniques
  calculateTextSimilarity(str1, str2) {
    str1 = str1.toLowerCase().trim();
    str2 = str2.toLowerCase().trim();
    
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;
    
    // Jaccard similarity (word overlap)
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    const jaccard = intersection.size / union.size;
    
    // Cosine similarity (character n-grams)
    const cosine = this.cosineSimilarity(str1, str2);
    
    // Levenshtein distance (normalized)
    const levenshtein = this.normalizedLevenshtein(str1, str2);
    
    // Weighted combination
    return (jaccard * 0.4 + cosine * 0.4 + levenshtein * 0.2);
  }
  
  // Cosine similarity using character n-grams
  cosineSimilarity(str1, str2) {
    const n = 2; // Bigrams
    const getNgrams = (str) => {
      const ngrams = {};
      for (let i = 0; i <= str.length - n; i++) {
        const gram = str.substr(i, n);
        ngrams[gram] = (ngrams[gram] || 0) + 1;
      }
      return ngrams;
    };
    
    const ngrams1 = getNgrams(str1);
    const ngrams2 = getNgrams(str2);
    
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    
    const allKeys = new Set([...Object.keys(ngrams1), ...Object.keys(ngrams2)]);
    
    for (const key of allKeys) {
      const val1 = ngrams1[key] || 0;
      const val2 = ngrams2[key] || 0;
      dotProduct += val1 * val2;
      magnitude1 += val1 * val1;
      magnitude2 += val2 * val2;
    }
    
    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);
    
    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    
    return dotProduct / (magnitude1 * magnitude2);
  }
  
  // Normalized Levenshtein distance
  normalizedLevenshtein(str1, str2) {
    const matrix = Array(str2.length + 1).fill().map(() => Array(str1.length + 1).fill(0));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // insertion
          matrix[j - 1][i] + 1,     // deletion
          matrix[j - 1][i - 1] + cost // substitution
        );
      }
    }
    
    const distance = matrix[str2.length][str1.length];
    return 1 - (distance / Math.max(str1.length, str2.length));
  }
  
  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; // Distance in km
  }
  
  deg2rad(deg) {
    return deg * (Math.PI/180);
  }
}

module.exports = new DuplicateChecker();