// utils/proximityScoring.js
// Proximity scoring utility functions for apartment amenities

// Cache for proximity scores (1 hour cache)
const proximityScoreCache = new Map();

// Fetch nearby count for a specific category
export const fetchNearbyCount = async (category, lat, lng, radius = 1000) => {
  const query = buildOverpassQuery(category, lat, lng, radius);
  
  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: query,
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();
    return data.elements ? data.elements.length : 0;
  } catch (error) {
    console.error(`Error fetching ${category}:`, error);
    return 0;
  }
};

// Build Overpass API query for each category
export const buildOverpassQuery = (category, lat, lng, radius) => {
  const timeout = 15;
  switch(category) {
    case 'restaurant':
      return `[out:json][timeout:${timeout}];(node["amenity"~"^(restaurant|cafe|fast_food)$"](around:${radius},${lat},${lng});way["amenity"~"^(restaurant|cafe|fast_food)$"](around:${radius},${lat},${lng}););out count;`;
    case 'convenience':
      return `[out:json][timeout:${timeout}];(node["shop"~"^(convenience|supermarket)$"](around:${radius},${lat},${lng});way["shop"~"^(convenience|supermarket)$"](around:${radius},${lat},${lng}););out count;`;
    case 'school':
      return `[out:json][timeout:${timeout}];(node["amenity"~"^(school|university|kindergarten)$"](around:${radius},${lat},${lng});way["amenity"~"^(school|university|kindergarten)$"](around:${radius},${lat},${lng}););out count;`;
    case 'health':
      return `[out:json][timeout:${timeout}];(node["amenity"~"^(hospital|clinic|doctors|dentist|pharmacy)$"](around:${radius},${lat},${lng});node["healthcare"](around:${radius},${lat},${lng});node["shop"="chemist"](around:${radius},${lat},${lng});way["amenity"~"^(hospital|clinic|doctors|dentist|pharmacy)$"](around:${radius},${lat},${lng});way["healthcare"](around:${radius},${lat},${lng}););out count;`;
    case 'transport':
      return `[out:json][timeout:${timeout}];(node["public_transport"](around:${radius},${lat},${lng});node["highway"="bus_stop"](around:${radius},${lat},${lng});node["amenity"="bus_station"](around:${radius},${lat},${lng});node["railway"="station"](around:${radius},${lat},${lng});way["public_transport"](around:${radius},${lat},${lng});way["amenity"="bus_station"](around:${radius},${lat},${lng}););out count;`;
    default:
      return buildOverpassQuery('restaurant', lat, lng, radius);
  }
};

// Calculate score for each category based on nearby count
export const calculateCategoryScore = (count, category) => {
  // Define scoring thresholds for each category
  const thresholds = {
    restaurant: { excellent: 15, good: 8, fair: 3 },
    convenience: { excellent: 8, good: 4, fair: 2 },
    school: { excellent: 5, good: 3, fair: 1 },
    health: { excellent: 8, good: 4, fair: 2 },
    transport: { excellent: 10, good: 5, fair: 2 }
  };

  const threshold = thresholds[category] || thresholds.restaurant;

  if (count >= threshold.excellent) return 100;
  if (count >= threshold.good) return 80;
  if (count >= threshold.fair) return 60;
  if (count > 0) return 40;
  return 0;
};

// Calculate basic proximity score for a single property
export const calculateProximityScore = async (property, radius = 1000) => {
  if (!property.latitude || !property.longitude) return 0;

  const categories = ['restaurant', 'convenience', 'school', 'health', 'transport'];
  let totalScore = 0;
  let categoryCount = 0;

  for (const category of categories) {
    try {
      const nearbyCount = await fetchNearbyCount(category, property.latitude, property.longitude, radius);
      const categoryScore = calculateCategoryScore(nearbyCount, category);
      totalScore += categoryScore;
      categoryCount++;
      // Add small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error fetching ${category} data:`, error);
    }
  }

  return categoryCount > 0 ? Math.round(totalScore / categoryCount) : 0;
};

// Calculate proximity score with caching
export const calculateProximityScoreWithCache = async (property, radius = 1000) => {
  if (!property.latitude || !property.longitude) return 0;

  const cacheKey = `${property.latitude}_${property.longitude}_${radius}`;
  
  // Check cache first
  if (proximityScoreCache.has(cacheKey)) {
    const cached = proximityScoreCache.get(cacheKey);
    // Cache for 1 hour
    if (Date.now() - cached.timestamp < 60 * 60 * 1000) {
      return cached.score;
    }
  }

  // Calculate new score
  const score = await calculateProximityScore(property, radius);
  
  // Cache the result
  proximityScoreCache.set(cacheKey, {
    score,
    timestamp: Date.now()
  });

  return score;
};

// Calculate detailed proximity score with breakdown
export const calculateDetailedProximityScore = async (property, radius = 1000) => {
  if (!property.latitude || !property.longitude) {
    return {
      overall: 0,
      breakdown: {},
      counts: {}
    };
  }

  const categories = ['restaurant', 'convenience', 'school', 'health', 'transport'];
  const breakdown = {};
  const counts = {};
  let totalScore = 0;
  let categoryCount = 0;

  for (const category of categories) {
    try {
      const nearbyCount = await fetchNearbyCount(category, property.latitude, property.longitude, radius);
      const categoryScore = calculateCategoryScore(nearbyCount, category);
      
      breakdown[category] = categoryScore;
      counts[category] = nearbyCount;
      totalScore += categoryScore;
      categoryCount++;
      
      // Add delay to respect API limits
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Error fetching ${category} data:`, error);
      breakdown[category] = 0;
      counts[category] = 0;
    }
  }

  return {
    overall: categoryCount > 0 ? Math.round(totalScore / categoryCount) : 0,
    breakdown,
    counts
  };
};

// Calculate weighted proximity score (different categories have different importance)
export const calculateWeightedProximityScore = async (property, radius = 1000) => {
  if (!property.latitude || !property.longitude) return 0;

  const categories = {
    transport: { weight: 0.25, name: 'ขนส่งสาธารณะ' },
    convenience: { weight: 0.20, name: 'ร้านสะดวกซื้อ' },
    restaurant: { weight: 0.20, name: 'ร้านอาหาร' },
    health: { weight: 0.20, name: 'สถานพยาบาล' },
    school: { weight: 0.15, name: 'สถานศึกษา' }
  };

  let weightedScore = 0;
  let totalWeight = 0;

  for (const [category, config] of Object.entries(categories)) {
    try {
      const nearbyCount = await fetchNearbyCount(category, property.latitude, property.longitude, radius);
      const categoryScore = calculateCategoryScore(nearbyCount, category);
      weightedScore += categoryScore * config.weight;
      totalWeight += config.weight;
      
      // Add delay to respect API limits
      await new Promise(resolve => setTimeout(resolve, 150));
    } catch (error) {
      console.error(`Error fetching ${category} data:`, error);
    }
  }

  return totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
};

// Batch calculation for multiple properties (more efficient)
export const calculateProximityScoresBatch = async (properties, radius = 1000, maxProperties = 20) => {
  const scores = {};
  const processedProperties = properties.slice(0, maxProperties); // Limit to avoid API overload
  
  for (let i = 0; i < processedProperties.length; i++) {
    const property = processedProperties[i];
    if (property.latitude && property.longitude) {
      try {
        scores[property.id] = await calculateProximityScoreWithCache(property, radius);
        console.log(`Calculated proximity score for property ${i + 1}/${processedProperties.length}: ${scores[property.id]}%`);
        
        // Add delay between properties to respect API limits
        if (i < processedProperties.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (error) {
        console.error(`Error calculating proximity score for property ${property.id}:`, error);
        scores[property.id] = 0;
      }
    } else {
      scores[property.id] = 0;
    }
  }
  
  return scores;
};

// Proximity Score Manager for progressive loading
export class ProximityScoreManager {
  constructor(maxConcurrent = 2, delayBetweenRequests = 300) {
    this.queue = [];
    this.processing = new Set();
    this.maxConcurrent = maxConcurrent;
    this.delay = delayBetweenRequests;
    this.cache = new Map();
    this.callbacks = new Map();
  }

  async calculateScore(property, callback) {
    const cacheKey = `${property.latitude}_${property.longitude}`;
    
    // Check cache first (1 hour cache)
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 60 * 60 * 1000) {
        callback(property.id, cached.score);
        return;
      }
    }

    // Add to queue
    this.queue.push({ property, callback });
    this.processQueue();
  }

  async processQueue() {
    if (this.processing.size >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const { property, callback } = this.queue.shift();
    const requestId = `${property.id}_${Date.now()}`;
    this.processing.add(requestId);

    try {
      console.log(`Processing proximity score for property: ${property.apartment_name || property.id}`);
      const score = await calculateProximityScore(property);
      const cacheKey = `${property.latitude}_${property.longitude}`;
      
      // Cache the result
      this.cache.set(cacheKey, {
        score,
        timestamp: Date.now()
      });

      callback(property.id, score);
      console.log(`Completed proximity score for ${property.apartment_name || property.id}: ${score}%`);
    } catch (error) {
      console.error(`Error calculating proximity score for ${property.id}:`, error);
      callback(property.id, 0);
    } finally {
      this.processing.delete(requestId);
      
      // Process next item after delay
      setTimeout(() => {
        this.processQueue();
      }, this.delay);
    }
  }

  // Get cache statistics
  getCacheStats() {
    const now = Date.now();
    const validEntries = Array.from(this.cache.values())
      .filter(entry => now - entry.timestamp < 60 * 60 * 1000);
    
    return {
      totalCached: this.cache.size,
      validCached: validEntries.length,
      queueLength: this.queue.length,
      processing: this.processing.size
    };
  }

  // Clear expired cache entries
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= 60 * 60 * 1000) {
        this.cache.delete(key);
      }
    }
  }
}

// Distance-based scoring helper
export const calculateDistanceScore = (elements, propertyLat, propertyLng) => {
  if (!elements || elements.length === 0) return 0;

  const distances = elements.map(element => {
    let elementLat, elementLng;
    
    if (element.type === 'node') {
      elementLat = element.lat;
      elementLng = element.lon;
    } else if (element.type === 'way' && element.geometry) {
      const coords = element.geometry;
      elementLat = coords.reduce((sum, coord) => sum + coord.lat, 0) / coords.length;
      elementLng = coords.reduce((sum, coord) => sum + coord.lon, 0) / coords.length;
    }
    
    if (elementLat && elementLng) {
      // Calculate distance using Haversine formula
      const R = 6371; // Earth's radius in km
      const dLat = (elementLat - propertyLat) * Math.PI / 180;
      const dLng = (elementLng - propertyLng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(propertyLat * Math.PI / 180) * Math.cos(elementLat * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c * 1000; // Distance in meters
    }
    return Infinity;
  }).filter(d => d < Infinity);

  if (distances.length === 0) return 0;

  // Score based on closest amenities (closer = better score)
  const closest = Math.min(...distances);
  const averageDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;

  if (closest <= 100) return 100; // Within 100m
  if (closest <= 300) return 90;  // Within 300m
  if (closest <= 500) return 80;  // Within 500m
  if (averageDistance <= 600) return 70; // Average within 600m
  if (averageDistance <= 800) return 60; // Average within 800m
  if (distances.length >= 3) return 50; // At least 3 places nearby
  return 30; // Few places, relatively far
};

// Filter properties by proximity scores
export const filterPropertiesWithProximity = (properties, filters, proximityScores = {}) => {
  return properties.filter(property => {
    // Proximity score filter
    if (filters.proximityScore && filters.proximityScore !== 'all') {
      const proximityScore = proximityScores[property.id] || 0;
      const [minScore, maxScore] = filters.proximityScore.split('-').map(Number);
      if (maxScore) {
        if (proximityScore < minScore || proximityScore > maxScore) return false;
      } else {
        if (proximityScore < minScore) return false;
      }
    }

    return true;
  });
};

// Get category display names (Thai)
export const getCategoryDisplayName = (category) => {
  const categoryNames = {
    restaurant: 'ร้านอาหาร',
    convenience: 'ร้านสะดวกซื้อ',
    school: 'สถานศึกษา',
    health: 'สถานพยาบาล',
    transport: 'ขนส่งสาธารณะ'
  };
  return categoryNames[category] || category;
};

// Get category icons
export const getCategoryIcon = (category) => {
  const categoryIcons = {
    restaurant: '🍽️',
    convenience: '🏪',
    school: '🎓',
    health: '🏥',
    transport: '🚌'
  };
  return categoryIcons[category] || '📍';
};

// Validate coordinates
export const isValidCoordinate = (lat, lng) => {
  return lat && lng && 
         !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng)) &&
         parseFloat(lat) >= -90 && parseFloat(lat) <= 90 &&
         parseFloat(lng) >= -180 && parseFloat(lng) <= 180;
};

// Error handling wrapper for API calls
export const withErrorHandling = async (fn, fallbackValue = 0) => {
  try {
    return await fn();
  } catch (error) {
    console.error('Proximity scoring error:', error);
    return fallbackValue;
  }
};

// Rate limiting helper
export class RateLimiter {
  constructor(maxRequests = 60, timeWindow = 60000) { // 60 requests per minute
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = [];
  }

  async throttle() {
    const now = Date.now();
    
    // Remove old requests outside the time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    // Check if we've exceeded the rate limit
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.timeWindow - (now - oldestRequest);
      console.log(`Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.throttle(); // Recursive call after waiting
    }
    
    // Add current request to the list
    this.requests.push(now);
  }
}

// Create a global rate limiter instance
export const globalRateLimiter = new RateLimiter(30, 60000); // Conservative: 30 requests per minute

// Export default configuration
export const DEFAULT_CONFIG = {
  radius: 1000, // 1km radius
  maxConcurrent: 2, // Max 2 concurrent requests
  requestDelay: 300, // 300ms between requests
  cacheTimeout: 60 * 60 * 1000, // 1 hour cache
  maxPropertiesPerBatch: 20, // Max properties to process in one batch
  rateLimitPerMinute: 30 // Max 30 API calls per minute
};