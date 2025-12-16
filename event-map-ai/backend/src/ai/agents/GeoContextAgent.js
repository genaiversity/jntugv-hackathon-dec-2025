/**
 * GEO-CONTEXT AGENT
 * Handles location analysis, distance calculations, and geographic filtering
 */

class GeoContextAgent {
  constructor() {
    this.defaultRadius = 25; // km
    this.maxRadius = 100; // km
    
    // Common location aliases
    this.locationAliases = {
      'near me': 'user_location',
      'nearby': 'user_location',
      'around here': 'user_location',
      'downtown': 'city_center',
      'city center': 'city_center',
      'online': 'virtual',
      'virtual': 'virtual',
      'remote': 'virtual'
    };

    // Major cities coordinates (fallback)
    this.cityCoordinates = {
      'london': [-0.1278, 51.5074],
      'new york': [-74.0060, 40.7128],
      'san francisco': [-122.4194, 37.7749],
      'los angeles': [-118.2437, 34.0522],
      'chicago': [-87.6298, 41.8781],
      'toronto': [-79.3832, 43.6532],
      'paris': [2.3522, 48.8566],
      'berlin': [13.4050, 52.5200],
      'tokyo': [139.6917, 35.6895],
      'sydney': [151.2093, -33.8688]
    };
  }

  /**
   * Analyze location context from user input
   */
  async analyzeLocation(userInput) {
    const { message, location: providedLocation, latitude, longitude } = userInput;
    
    try {
      // Priority 1: Use provided coordinates
      if (latitude && longitude) {
        return await this.buildLocationContext(
          [parseFloat(longitude), parseFloat(latitude)],
          await this.reverseGeocode(longitude, latitude),
          this.extractRadius(message)
        );
      }

      // Priority 2: Use provided location string
      if (providedLocation) {
        const coords = await this.geocodeLocation(providedLocation);
        return await this.buildLocationContext(coords, providedLocation, this.extractRadius(message));
      }

      // Priority 3: Extract location from message
      const extractedLocation = this.extractLocationFromMessage(message);
      if (extractedLocation) {
        if (extractedLocation === 'virtual') {
          return this.buildVirtualLocationContext();
        }
        
        const coords = await this.geocodeLocation(extractedLocation);
        return await this.buildLocationContext(coords, extractedLocation, this.extractRadius(message));
      }

      // Priority 4: Default to no location filter
      return this.buildDefaultLocationContext();

    } catch (error) {
      console.error('Geo-context analysis error:', error);
      return this.buildDefaultLocationContext();
    }
  }

  /**
   * Extract location mentions from message text
   */
  extractLocationFromMessage(message) {
    const lowerMessage = message.toLowerCase();

    // Check for location aliases
    for (const [alias, location] of Object.entries(this.locationAliases)) {
      if (lowerMessage.includes(alias)) {
        return location;
      }
    }

    // Check for city names
    for (const city of Object.keys(this.cityCoordinates)) {
      if (lowerMessage.includes(city)) {
        return city;
      }
    }

    // Look for location indicators
    const locationIndicators = ['in ', 'at ', 'near ', 'around '];
    for (const indicator of locationIndicators) {
      const index = lowerMessage.indexOf(indicator);
      if (index !== -1) {
        const afterIndicator = message.substring(index + indicator.length);
        const words = afterIndicator.split(' ').slice(0, 3); // Take up to 3 words
        const potentialLocation = words.join(' ').replace(/[^\w\s]/g, '');
        if (potentialLocation.length > 2) {
          return potentialLocation;
        }
      }
    }

    return null;
  }

  /**
   * Extract radius/distance from message
   */
  extractRadius(message) {
    const lowerMessage = message.toLowerCase();
    
    // Look for distance patterns
    const distancePatterns = [
      /within (\d+)\s*(km|kilometers|miles|mi)/i,
      /(\d+)\s*(km|kilometers|miles|mi) radius/i,
      /(\d+)\s*(km|kilometers|miles|mi) away/i
    ];

    for (const pattern of distancePatterns) {
      const match = message.match(pattern);
      if (match) {
        let distance = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        
        // Convert miles to km
        if (unit.includes('mi')) {
          distance = Math.round(distance * 1.609);
        }
        
        return Math.min(distance, this.maxRadius);
      }
    }

    // Look for relative distance terms
    if (lowerMessage.includes('close') || lowerMessage.includes('nearby')) {
      return 10;
    }
    if (lowerMessage.includes('far') || lowerMessage.includes('anywhere')) {
      return 50;
    }

    return this.defaultRadius;
  }

  /**
   * Geocode location string to coordinates
   */
  async geocodeLocation(locationString) {
    const cleanLocation = locationString.toLowerCase().trim();

    // Check if it's a known city
    if (this.cityCoordinates[cleanLocation]) {
      return this.cityCoordinates[cleanLocation];
    }

    // For now, return null - in production, integrate with geocoding service
    // like Google Maps API, OpenStreetMap Nominatim, etc.
    console.log(`Geocoding not implemented for: ${locationString}`);
    return null;
  }

  /**
   * Reverse geocode coordinates to location name
   */
  async reverseGeocode(longitude, latitude) {
    // For now, return generic location - in production, use reverse geocoding service
    return `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
  }

  /**
   * Build location context object
   */
  async buildLocationContext(coordinates, locationName, radius) {
    return {
      hasLocation: !!coordinates,
      coordinates,
      locationName,
      radius,
      isVirtual: false,
      searchArea: coordinates ? this.calculateSearchArea(coordinates, radius) : null,
      distanceUnit: 'km'
    };
  }

  /**
   * Build virtual location context
   */
  buildVirtualLocationContext() {
    return {
      hasLocation: false,
      coordinates: null,
      locationName: 'Virtual/Online',
      radius: 0,
      isVirtual: true,
      searchArea: null,
      distanceUnit: 'km'
    };
  }

  /**
   * Build default location context (no location specified)
   */
  buildDefaultLocationContext() {
    return {
      hasLocation: false,
      coordinates: null,
      locationName: null,
      radius: this.defaultRadius,
      isVirtual: false,
      searchArea: null,
      distanceUnit: 'km'
    };
  }

  /**
   * Calculate search area bounds
   */
  calculateSearchArea(coordinates, radius) {
    const [longitude, latitude] = coordinates;
    const radiusInDegrees = radius / 111; // Rough conversion km to degrees

    return {
      center: coordinates,
      bounds: {
        north: latitude + radiusInDegrees,
        south: latitude - radiusInDegrees,
        east: longitude + radiusInDegrees,
        west: longitude - radiusInDegrees
      }
    };
  }

  /**
   * Calculate distance between two points
   */
  calculateDistance(coord1, coord2) {
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;

    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Filter events by distance
   */
  filterEventsByDistance(events, userLocation, maxDistance) {
    if (!userLocation || !events.length) return events;

    return events.filter(event => {
      if (!event.locationCoords || !event.locationCoords.coordinates) return true;
      
      const distance = this.calculateDistance(userLocation, event.locationCoords.coordinates);
      return distance <= maxDistance;
    }).map(event => ({
      ...event,
      distance: event.locationCoords ? 
        this.calculateDistance(userLocation, event.locationCoords.coordinates) : null
    }));
  }

  /**
   * Sort events by distance
   */
  sortEventsByDistance(events, userLocation) {
    if (!userLocation) return events;

    return events.sort((a, b) => {
      const distanceA = a.distance || 
        (a.locationCoords ? this.calculateDistance(userLocation, a.locationCoords.coordinates) : Infinity);
      const distanceB = b.distance || 
        (b.locationCoords ? this.calculateDistance(userLocation, b.locationCoords.coordinates) : Infinity);
      
      return distanceA - distanceB;
    });
  }

  /**
   * Get location-based insights
   */
  getLocationInsights(events, userLocation) {
    if (!events.length) return {};

    const insights = {
      totalEvents: events.length,
      averageDistance: 0,
      nearestEvent: null,
      farthestEvent: null,
      locationClusters: {}
    };

    if (userLocation) {
      const distances = events
        .filter(e => e.locationCoords)
        .map(e => this.calculateDistance(userLocation, e.locationCoords.coordinates));
      
      if (distances.length > 0) {
        insights.averageDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
        insights.nearestEvent = events.find(e => 
          e.locationCoords && 
          this.calculateDistance(userLocation, e.locationCoords.coordinates) === Math.min(...distances)
        );
        insights.farthestEvent = events.find(e => 
          e.locationCoords && 
          this.calculateDistance(userLocation, e.locationCoords.coordinates) === Math.max(...distances)
        );
      }
    }

    // Group events by location
    events.forEach(event => {
      const location = event.location || 'Unknown';
      insights.locationClusters[location] = (insights.locationClusters[location] || 0) + 1;
    });

    return insights;
  }
}

module.exports = GeoContextAgent;