/**
 * Supply Chain Matching Algorithm for AgroBuddy
 * 
 * This algorithm matches farmers' products with optimal buyers/traders
 * based on multiple factors:
 * - Product demand match
 * - Geographic proximity
 * - Price compatibility
 * - Buyer reliability/rating
 * - Quantity requirements
 * 
 * Algorithm: Multi-Factor Weighted Scoring
 * Time Complexity: O(n * m) where n = products, m = buyers
 */

// Product Categories for matching
const PRODUCT_CATEGORIES = {
  // Vegetables
  'tomato': ['vegetables', 'fresh produce', 'perishables'],
  'potato': ['vegetables', 'fresh produce', 'staples'],
  'onion': ['vegetables', 'fresh produce', 'staples'],
  'carrot': ['vegetables', 'fresh produce'],
  'cabbage': ['vegetables', 'fresh produce', 'leafy'],
  'spinach': ['vegetables', 'leafy', 'perishables'],
  'brinjal': ['vegetables', 'fresh produce'],
  'cauliflower': ['vegetables', 'fresh produce'],
  'capsicum': ['vegetables', 'fresh produce'],
  'beans': ['vegetables', 'fresh produce', 'legumes'],
  
  // Fruits
  'apple': ['fruits', 'fresh produce'],
  'banana': ['fruits', 'fresh produce', 'tropical'],
  'mango': ['fruits', 'fresh produce', 'seasonal', 'tropical'],
  'orange': ['fruits', 'fresh produce', 'citrus'],
  'grapes': ['fruits', 'fresh produce'],
  'papaya': ['fruits', 'tropical'],
  'watermelon': ['fruits', 'seasonal'],
  
  // Grains & Cereals
  'rice': ['grains', 'cereals', 'staples'],
  'wheat': ['grains', 'cereals', 'staples'],
  'maize': ['grains', 'cereals', 'fodder'],
  'barley': ['grains', 'cereals'],
  'millets': ['grains', 'cereals', 'nutritious'],
  
  // Pulses
  'dal': ['pulses', 'legumes', 'protein'],
  'chickpea': ['pulses', 'legumes', 'protein'],
  'lentils': ['pulses', 'legumes', 'protein'],
  'moong': ['pulses', 'legumes'],
  
  // Cash Crops
  'cotton': ['cash crops', 'fiber', 'industrial'],
  'sugarcane': ['cash crops', 'sugar', 'industrial'],
  'jute': ['cash crops', 'fiber', 'industrial'],
  'tea': ['cash crops', 'beverages', 'plantation'],
  'coffee': ['cash crops', 'beverages', 'plantation'],
  
  // Spices
  'turmeric': ['spices', 'medicinal'],
  'ginger': ['spices', 'medicinal'],
  'chilli': ['spices', 'condiments'],
  'garlic': ['spices', 'condiments'],
  'coriander': ['spices', 'herbs'],
  
  // Dairy & Animal Products
  'milk': ['dairy', 'perishables', 'animal products'],
  'eggs': ['poultry', 'animal products'],
  'honey': ['apiculture', 'natural products'],
};

// Weight factors for scoring - different for B2B vs B2C
const WEIGHT_FACTORS = {
  // B2B (Traders/Wholesalers) - Focus on business metrics
  B2B: {
    DEMAND_MATCH: 0.30,      // 30% - Product-category match
    DISTANCE: 0.20,          // 20% - Less critical for bulk business
    PRICE_COMPATIBILITY: 0.25, // 25% - Very important for profit margins
    BUYER_RELIABILITY: 0.15, // 15% - Business reputation matters
    QUANTITY_MATCH: 0.10,    // 10% - Can usually adjust quantities
  },
  // B2C (Direct Customers) - Focus on consumer preferences
  B2C: {
    DEMAND_MATCH: 0.25,      // 25% - What they want to buy
    DISTANCE: 0.35,          // 35% - Customers prefer local/fresh
    PRICE_COMPATIBILITY: 0.20, // 20% - Price sensitive but not primary
    BUYER_RELIABILITY: 0.10, // 10% - Less critical for individuals
    QUANTITY_MATCH: 0.05,    // 5% - Flexible on quantities
    CUSTOMER_PREFERENCES: 0.05, // 5% - Organic, freshness preferences
  },
};

/**
 * Main Supply Chain Matching Algorithm Class
 */
class SupplyChainMatcher {
  
  /**
   * Find optimal buyers/traders for a farmer's product
   * @param {Object} farmerProduct - The product being sold
   * @param {Array} availableBuyers - List of potential buyers
   * @param {Object} farmerLocation - Farmer's location {lat, lon}
   * @returns {Array} Sorted list of matched buyers with scores
   */
  static findOptimalBuyers(farmerProduct, availableBuyers, farmerLocation) {
    if (!farmerProduct || !availableBuyers || availableBuyers.length === 0) {
      return [];
    }

    const matchedBuyers = availableBuyers.map(buyer => {
      // Determine scoring weights based on buyer category
      const weights = buyer.buyerCategory === 'B2C' ? WEIGHT_FACTORS.B2C : WEIGHT_FACTORS.B2B;
      
      // Calculate individual factor scores
      const demandScore = this.calculateDemandMatch(farmerProduct, buyer);
      const distanceKm = this.calculateDistance(farmerLocation, buyer.location);
      const distanceScore = this.getDistanceScore(distanceKm, buyer.buyerCategory);
      const priceScore = this.calculatePriceCompatibility(
        farmerProduct.price, 
        buyer.budgetRange,
        buyer.buyerCategory
      );
      const reliabilityScore = this.calculateReliabilityScore(buyer);
      const quantityScore = this.calculateQuantityMatch(
        farmerProduct.quantity, 
        buyer.requiredQuantity,
        buyer.buyerCategory
      );
      
      // Customer preferences score (only for B2C)
      const customerPrefScore = buyer.buyerCategory === 'B2C' ? 
        this.calculateCustomerPreferenceScore(farmerProduct, buyer) : 0;

      // Calculate weighted total score
      let totalScore = 
        (demandScore * weights.DEMAND_MATCH) +
        (distanceScore * weights.DISTANCE) +
        (priceScore * weights.PRICE_COMPATIBILITY) +
        (reliabilityScore * weights.BUYER_RELIABILITY) +
        (quantityScore * weights.QUANTITY_MATCH);
      
      // Add customer preference bonus for B2C
      if (buyer.buyerCategory === 'B2C') {
        totalScore += (customerPrefScore * weights.CUSTOMER_PREFERENCES);
      }

      // Calculate logistics details
      const deliveryTime = this.estimateDeliveryTime(distanceKm, buyer.buyerCategory);
      const transportCost = this.calculateTransportCost(
        distanceKm, 
        parseFloat(farmerProduct.quantity),
        buyer.buyerCategory
      );
      const estimatedProfit = this.calculateEstimatedProfit(
        farmerProduct.price,
        farmerProduct.quantity,
        transportCost
      );

      return {
        ...buyer,
        matchScore: Math.round(totalScore * 100) / 100,
        matchPercentage: Math.round(totalScore * 100),
        scoreBreakdown: {
          demandMatch: Math.round(demandScore * 100),
          distance: Math.round(distanceScore * 100),
          priceCompatibility: Math.round(priceScore * 100),
          reliability: Math.round(reliabilityScore * 100),
          quantityMatch: Math.round(quantityScore * 100),
          customerPreferences: buyer.buyerCategory === 'B2C' ? Math.round(customerPrefScore * 100) : null,
        },
        logistics: {
          distanceKm: Math.round(distanceKm),
          estimatedDeliveryTime: deliveryTime,
          transportCost: transportCost,
          estimatedProfit: estimatedProfit,
        },
        matchReason: this.generateMatchReason(demandScore, distanceScore, priceScore, buyer.buyerCategory),
      };
    });

    // Filter out low matches (below 25%) and sort by score
    return matchedBuyers
      .filter(buyer => buyer.matchScore > 0.25)
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Calculate how well the product matches buyer's demand
   */
  static calculateDemandMatch(product, buyer) {
    if (!buyer.requirements || !buyer.requirements.categories) {
      return 0.5; // Default neutral score
    }

    const productName = product.product_name || product.productName || '';
    const productLower = productName.toLowerCase();
    
    // Get product categories
    let productCategories = [];
    for (const [key, categories] of Object.entries(PRODUCT_CATEGORIES)) {
      if (productLower.includes(key)) {
        productCategories = [...productCategories, ...categories];
        break;
      }
    }
    
    // If no specific match, use generic categories
    if (productCategories.length === 0) {
      productCategories = ['agricultural products', 'fresh produce'];
    }

    const buyerCategories = buyer.requirements.categories || [];
    
    // Calculate Jaccard similarity
    const intersection = productCategories.filter(cat => 
      buyerCategories.some(bCat => 
        bCat.toLowerCase().includes(cat.toLowerCase()) ||
        cat.toLowerCase().includes(bCat.toLowerCase())
      )
    );
    
    const union = [...new Set([...productCategories, ...buyerCategories])];
    
    if (union.length === 0) return 0.5;
    
    // Base similarity score
    let score = intersection.length / union.length;
    
    // Bonus for exact product name match in buyer's wanted list
    if (buyer.requirements.wantedProducts) {
      const wantedMatch = buyer.requirements.wantedProducts.some(wp =>
        productLower.includes(wp.toLowerCase()) ||
        wp.toLowerCase().includes(productLower)
      );
      if (wantedMatch) {
        score = Math.min(1.0, score + 0.3);
      }
    }
    
    return score;
  }

  /**
   * Calculate distance between two locations using Haversine formula
   */
  static calculateDistance(location1, location2) {
    if (!location1 || !location2) {
      return 100; // Default 100km if location unknown
    }

    const R = 6371; // Earth's radius in kilometers
    
    const lat1 = location1.lat || location1.latitude || 0;
    const lon1 = location1.lon || location1.longitude || 0;
    const lat2 = location2.lat || location2.latitude || 0;
    const lon2 = location2.lon || location2.longitude || 0;

    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  static toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Convert distance to a score (closer = higher score)
   * B2C customers prioritize proximity more than B2B
   */
  static getDistanceScore(distanceKm, buyerCategory = 'B2B') {
    if (buyerCategory === 'B2C') {
      // B2C customers heavily prefer local/nearby farmers
      if (distanceKm <= 5) return 1.0;        // Very local: Best
      if (distanceKm <= 15) return 0.9;       // Local area
      if (distanceKm <= 30) return 0.75;      // Same city
      if (distanceKm <= 50) return 0.6;       // Nearby city
      if (distanceKm <= 100) return 0.4;      // Regional
      return 0.2;                             // Too far for consumers
    } else {
      // B2B can handle longer distances for bulk business
      if (distanceKm <= 10) return 1.0;       // Local: Best
      if (distanceKm <= 25) return 0.9;       // Very near
      if (distanceKm <= 50) return 0.8;       // Near
      if (distanceKm <= 100) return 0.65;     // Regional
      if (distanceKm <= 200) return 0.5;      // State-level
      if (distanceKm <= 500) return 0.35;     // Inter-state
      if (distanceKm <= 1000) return 0.2;     // Long distance
      return 0.1;                             // Very far
    }
  }

  /**
   * Check if farmer's price fits buyer's budget
   * B2C customers may be more price-sensitive for premium products
   */
  static calculatePriceCompatibility(farmerPrice, buyerBudget, buyerCategory = 'B2B') {
    if (!buyerBudget) return 0.5;
    
    const price = parseFloat(farmerPrice) || 0;
    const minBudget = parseFloat(buyerBudget.min) || 0;
    const maxBudget = parseFloat(buyerBudget.max) || Infinity;

    // Perfect match: price within budget
    if (price >= minBudget && price <= maxBudget) {
      // For B2C, give better scores for mid-range pricing (quality perception)
      if (buyerCategory === 'B2C') {
        const budgetRange = maxBudget - minBudget;
        const positionInRange = (price - minBudget) / budgetRange;
        
        // Sweet spot for consumers is 40-70% of their budget range
        if (positionInRange >= 0.4 && positionInRange <= 0.7) {
          return 0.95; // Premium perception
        } else if (positionInRange >= 0.2 && positionInRange <= 0.9) {
          return 0.85; // Good value
        } else {
          return 0.75; // Acceptable
        }
      } else {
        // B2B prefers lower prices for better margins
        const budgetRange = maxBudget - minBudget;
        const positionInRange = (price - minBudget) / budgetRange;
        return 0.8 + (0.2 * (1 - positionInRange)); // 0.8 to 1.0
      }
    }

    // Price adjustments for out-of-range pricing
    if (price < minBudget) {
      const priceDiff = minBudget - price;
      const percentBelow = priceDiff / minBudget;
      
      if (buyerCategory === 'B2C') {
        // Consumers might be suspicious of too-low prices
        return Math.max(0.2, 0.6 - percentBelow);
      } else {
        // B2B might still be interested in low prices
        return Math.max(0.3, 0.7 - percentBelow);
      }
    }

    if (price > maxBudget) {
      const priceDiff = price - maxBudget;
      const percentAbove = priceDiff / maxBudget;
      
      if (buyerCategory === 'B2C') {
        // Consumers are more price-sensitive
        return Math.max(0.05, 0.5 - (percentAbove * 1.5));
      } else {
        // B2B might pay more for quality/reliability
        return Math.max(0.1, 0.6 - percentAbove);
      }
    }

    return 0.5;
  }

  /**
   * Calculate buyer reliability based on ratings and history
   */
  static calculateReliabilityScore(buyer) {
    let score = 0.5; // Base score

    // Rating (0-5 scale)
    if (buyer.rating) {
      score = buyer.rating / 5.0;
    }

    // Bonus for verified buyers
    if (buyer.isVerified) {
      score = Math.min(1.0, score + 0.1);
    }

    // Consider transaction history
    if (buyer.completedTransactions) {
      if (buyer.completedTransactions >= 100) score = Math.min(1.0, score + 0.15);
      else if (buyer.completedTransactions >= 50) score = Math.min(1.0, score + 0.1);
      else if (buyer.completedTransactions >= 20) score = Math.min(1.0, score + 0.05);
    }

    // Consider payment history
    if (buyer.paymentReliability) {
      score = (score + buyer.paymentReliability) / 2;
    }

    return score;
  }

  /**
   * Calculate customer preference score for B2C buyers
   * Considers organic preferences, freshness requirements, etc.
   */
  static calculateCustomerPreferenceScore(product, buyer) {
    if (!buyer.preferences) return 0.5; // Neutral score if no preferences
    
    let score = 0.5;
    let factors = 0;
    
    // Organic preference
    if (buyer.preferences.organic !== undefined) {
      factors++;
      const productName = (product.product_name || product.productName || '').toLowerCase();
      const isOrganic = productName.includes('organic') || 
                       product.description?.toLowerCase().includes('organic');
      
      if (buyer.preferences.organic) {
        // Customer wants organic
        score += isOrganic ? 0.3 : -0.1;
      } else {
        // Customer doesn't mind non-organic
        score += isOrganic ? 0.1 : 0.2; // Slight bonus for organic anyway
      }
    }
    
    // Freshness requirement
    if (buyer.preferences.freshness) {
      factors++;
      const freshnessLevel = buyer.preferences.freshness;
      
      // Assume local farmers provide fresher produce
      switch (freshnessLevel) {
        case 'very-high':
          score += 0.25; // Local farmers have advantage
          break;
        case 'high':
          score += 0.2;
          break;
        case 'medium':
          score += 0.1;
          break;
        default:
          score += 0.05;
      }
    }
    
    // Delivery preference
    if (buyer.preferences.delivery) {
      factors++;
      const deliveryPref = buyer.preferences.delivery;
      
      switch (deliveryPref) {
        case 'same-day':
          score += 0.15; // Farmers can often provide same-day
          break;
        case 'next-day':
          score += 0.1;
          break;
        case 'weekly':
          score += 0.05;
          break;
        default:
          score += 0.05;
      }
    }
    
    // Normalize score based on number of factors considered
    if (factors === 0) return 0.5;
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Check if farmer can fulfill buyer's quantity needs
   * B2C customers are more flexible on quantities
   */
  static calculateQuantityMatch(availableQty, requiredQty, buyerCategory = 'B2B') {
    const available = parseFloat(availableQty) || 0;
    const required = parseFloat(requiredQty) || 0;

    if (required === 0) return 1.0; // Buyer accepts any quantity

    if (buyerCategory === 'B2C') {
      // B2C customers are very flexible on quantities
      if (available >= required) {
        return 1.0; // Can fulfill completely
      }
      
      // For B2C, even partial fulfillment is often acceptable
      const fulfillmentRatio = available / required;
      
      if (fulfillmentRatio >= 0.3) {
        // Even 30% fulfillment might work for consumers
        return 0.7 + (0.3 * fulfillmentRatio);
      } else {
        // Too little might not be worth the transaction cost
        return fulfillmentRatio * 0.5;
      }
    } else {
      // B2B logic (original)
      if (available >= required) {
        // Can fully fulfill - perfect score
        // Slight bonus if not too much excess (indicates good planning)
        const excess = available / required;
        if (excess <= 1.5) return 1.0;
        if (excess <= 2) return 0.95;
        return 0.9; // Large excess might indicate storage issues
      }

      // Partial fulfillment for B2B
      const fulfillmentRatio = available / required;
      
      // B2B needs higher fulfillment ratios
      if (fulfillmentRatio >= 0.8) return 0.9;
      if (fulfillmentRatio >= 0.6) return 0.75;
      if (fulfillmentRatio >= 0.4) return 0.6;
      return fulfillmentRatio * 0.5;
    }
  }

  /**
   * Estimate delivery time based on distance and buyer type
   */
  static estimateDeliveryTime(distanceKm, buyerCategory = 'B2B') {
    if (buyerCategory === 'B2C') {
      // B2C customers expect faster, more convenient delivery
      if (distanceKm <= 10) return 'Same day';
      if (distanceKm <= 25) return 'Next day';
      if (distanceKm <= 50) return '2 days';
      return '3-5 days';
    } else {
      // B2B delivery (original logic)
      if (distanceKm <= 25) {
        const hours = Math.ceil(distanceKm / 25);
        return `${hours} hour${hours > 1 ? 's' : ''}`;
      }
      if (distanceKm <= 100) {
        const hours = Math.ceil(distanceKm / 40);
        return `${hours} hours`;
      }
      if (distanceKm <= 300) {
        return '1 day';
      }
      if (distanceKm <= 500) {
        return '1-2 days';
      }
      if (distanceKm <= 1000) {
        return '2-3 days';
      }
      return '3-5 days';
    }
  }

  /**
   * Calculate transport cost based on distance, quantity, and buyer type
   */
  static calculateTransportCost(distanceKm, quantityKg, buyerCategory = 'B2B') {
    if (buyerCategory === 'B2C') {
      // B2C: Small quantities, convenience delivery, higher per-kg cost
      const baseRatePerKgPer10Km = 5; // Higher rate for small deliveries
      let cost = (distanceKm / 10) * quantityKg * baseRatePerKgPer10Km;
      
      // Minimum delivery charge for B2C
      const minimumCharge = 100;
      cost = Math.max(cost, minimumCharge);
      
      // Small quantity surcharge
      if (quantityKg < 5) {
        cost *= 1.5; // 50% surcharge for very small orders
      } else if (quantityKg < 20) {
        cost *= 1.2; // 20% surcharge for small orders
      }
      
      // Same-day delivery premium
      if (distanceKm <= 10) {
        cost *= 1.3; // Premium for same-day local delivery
      }
      
      return Math.round(cost);
    } else {
      // B2B: Bulk quantities, standard logistics (original logic)
      const baseRatePerKgPer10Km = 2;
      let cost = (distanceKm / 10) * quantityKg * baseRatePerKgPer10Km;
      
      const minimumCharge = 200;
      cost = Math.max(cost, minimumCharge);
      
      // Bulk discounts
      if (quantityKg >= 1000) {
        cost *= 0.7; // 30% discount for bulk
      } else if (quantityKg >= 500) {
        cost *= 0.85; // 15% discount
      }
      
      // Distance surcharge for long distances
      if (distanceKm > 500) {
        cost *= 1.2; // 20% surcharge
      }
      
      return Math.round(cost);
    }
  }

  /**
   * Calculate estimated profit for farmer
   */
  static calculateEstimatedProfit(price, quantity, transportCost) {
    const totalRevenue = parseFloat(price) * parseFloat(quantity);
    const profit = totalRevenue - transportCost;
    return Math.round(profit);
  }

  /**
   * Generate human-readable match reason
   */
  static generateMatchReason(demandScore, distanceScore, priceScore) {
    const reasons = [];
    
    if (demandScore >= 0.8) {
      reasons.push('High demand for your product');
    } else if (demandScore >= 0.6) {
      reasons.push('Good product match');
    }
    
    if (distanceScore >= 0.8) {
      reasons.push('Very close location');
    } else if (distanceScore >= 0.6) {
      reasons.push('Reasonable distance');
    }
    
    if (priceScore >= 0.8) {
      reasons.push('Price fits buyer budget');
    } else if (priceScore >= 0.6) {
      reasons.push('Competitive pricing');
    }
    
    if (reasons.length === 0) {
      reasons.push('Potential business opportunity');
    }
    
    return reasons.join(' • ');
  }

  /**
   * Group matches by category for better UX
   */
  static groupMatchesByQuality(matches) {
    return {
      excellent: matches.filter(m => m.matchScore >= 0.8),
      good: matches.filter(m => m.matchScore >= 0.6 && m.matchScore < 0.8),
      fair: matches.filter(m => m.matchScore >= 0.4 && m.matchScore < 0.6),
      possible: matches.filter(m => m.matchScore < 0.4),
    };
  }

  /**
   * Find best matches for multiple products (batch processing)
   */
  static findMatchesForMultipleProducts(products, buyers, farmerLocation) {
    return products.map(product => ({
      product,
      matches: this.findOptimalBuyers(product, buyers, farmerLocation),
    }));
  }

  /**
   * Get top N buyers across all criteria
   */
  static getTopBuyers(farmerProduct, availableBuyers, farmerLocation, topN = 5) {
    const allMatches = this.findOptimalBuyers(farmerProduct, availableBuyers, farmerLocation);
    return allMatches.slice(0, topN);
  }
}

export default SupplyChainMatcher;
export { PRODUCT_CATEGORIES, WEIGHT_FACTORS };
