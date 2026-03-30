/**
 * React Hook for Supply Chain Matching Algorithm
 * 
 * Provides easy-to-use hooks for finding optimal buyers for farmer products
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SupplyChainMatcher from '../algorithms/SupplyChainMatcher';

// Sample traders/buyers data (in production, this comes from API)
// Includes both B2B (Traders) and B2C (Direct Customers)
const SAMPLE_TRADERS = [
  // B2B - Traders/Wholesalers
  {
    id: 't1',
    name: 'Rajesh Traders',
    businessType: 'Wholesaler',
    buyerCategory: 'B2B',
    location: { lat: 28.6139, lon: 77.2090 }, // Delhi
    rating: 4.5,
    isVerified: true,
    completedTransactions: 150,
    paymentReliability: 0.95,
    budgetRange: { min: 20, max: 100 },
    requirements: {
      categories: ['vegetables', 'fresh produce', 'staples'],
      wantedProducts: ['tomato', 'potato', 'onion', 'rice'],
    },
    requiredQuantity: 500,
    phone: '+91 98765 43210',
    image: null,
  },
  {
    id: 't2',
    name: 'Fresh Mart Suppliers',
    businessType: 'Retailer',
    buyerCategory: 'B2B',
    location: { lat: 28.7041, lon: 77.1025 }, // Near Delhi
    rating: 4.2,
    isVerified: true,
    completedTransactions: 80,
    paymentReliability: 0.9,
    budgetRange: { min: 30, max: 150 },
    requirements: {
      categories: ['vegetables', 'fruits', 'fresh produce'],
      wantedProducts: ['tomato', 'apple', 'banana', 'spinach'],
    },
    requiredQuantity: 200,
    phone: '+91 98765 43211',
    image: null,
  },
  {
    id: 't3',
    name: 'Kisan Mandi Cooperative',
    businessType: 'Cooperative',
    buyerCategory: 'B2B',
    location: { lat: 28.4595, lon: 77.0266 }, // Gurgaon
    rating: 4.8,
    isVerified: true,
    completedTransactions: 300,
    paymentReliability: 0.98,
    budgetRange: { min: 15, max: 80 },
    requirements: {
      categories: ['grains', 'cereals', 'pulses', 'vegetables'],
      wantedProducts: ['wheat', 'rice', 'dal', 'potato'],
    },
    requiredQuantity: 1000,
    phone: '+91 98765 43212',
    image: null,
  },
  {
    id: 't4',
    name: 'Organic Foods India',
    businessType: 'Exporter',
    buyerCategory: 'B2B',
    location: { lat: 19.0760, lon: 72.8777 }, // Mumbai
    rating: 4.6,
    isVerified: true,
    completedTransactions: 200,
    paymentReliability: 0.92,
    budgetRange: { min: 50, max: 200 },
    requirements: {
      categories: ['organic', 'vegetables', 'fruits', 'spices'],
      wantedProducts: ['turmeric', 'ginger', 'tomato', 'mango'],
    },
    requiredQuantity: 300,
    phone: '+91 98765 43213',
    image: null,
  },

  // B2C - Direct Customers (End Consumers)
  {
    id: 'c1',
    name: 'Priya Sharma',
    businessType: 'Home Consumer',
    buyerCategory: 'B2C',
    location: { lat: 28.6280, lon: 77.2200 }, // Very close to Delhi
    rating: 4.9,
    isVerified: true,
    completedTransactions: 25,
    paymentReliability: 0.98,
    budgetRange: { min: 40, max: 120 },
    requirements: {
      categories: ['vegetables', 'fresh produce', 'organic'],
      wantedProducts: ['tomato', 'onion', 'spinach', 'carrot'],
    },
    requiredQuantity: 5, // Small quantities for home use
    phone: '+91 98765 43220',
    image: null,
    preferences: {
      organic: true,
      freshness: 'high',
      delivery: 'same-day'
    }
  },
  {
    id: 'c2',
    name: 'Amit Kumar',
    businessType: 'Family Consumer',
    buyerCategory: 'B2C',
    location: { lat: 28.5355, lon: 77.3910 }, // Noida
    rating: 4.7,
    isVerified: true,
    completedTransactions: 40,
    paymentReliability: 0.96,
    budgetRange: { min: 35, max: 80 },
    requirements: {
      categories: ['vegetables', 'fruits', 'staples'],
      wantedProducts: ['potato', 'apple', 'banana', 'rice'],
    },
    requiredQuantity: 10,
    phone: '+91 98765 43221',
    image: null,
    preferences: {
      organic: false,
      freshness: 'medium',
      delivery: 'next-day'
    }
  },
  {
    id: 'c3',
    name: 'Sunita Devi',
    businessType: 'Health Conscious Consumer',
    buyerCategory: 'B2C',
    location: { lat: 28.4595, lon: 77.0266 }, // Gurgaon
    rating: 4.8,
    isVerified: true,
    completedTransactions: 60,
    paymentReliability: 0.99,
    budgetRange: { min: 60, max: 150 }, // Higher budget for organic
    requirements: {
      categories: ['organic', 'vegetables', 'fruits', 'nutritious'],
      wantedProducts: ['spinach', 'broccoli', 'apple', 'grapes'],
    },
    requiredQuantity: 8,
    phone: '+91 98765 43222',
    image: null,
    preferences: {
      organic: true,
      freshness: 'very-high',
      delivery: 'same-day'
    }
  },
  {
    id: 'c4',
    name: 'Restaurant "Swad"',
    businessType: 'Restaurant',
    buyerCategory: 'B2C', // Direct customer, not middleman
    location: { lat: 28.6139, lon: 77.2090 }, // Delhi
    rating: 4.4,
    isVerified: true,
    completedTransactions: 120,
    paymentReliability: 0.94,
    budgetRange: { min: 25, max: 90 },
    requirements: {
      categories: ['vegetables', 'fresh produce', 'spices'],
      wantedProducts: ['tomato', 'onion', 'ginger', 'garlic'],
    },
    requiredQuantity: 50,
    phone: '+91 98765 43223',
    image: null,
    preferences: {
      organic: false,
      freshness: 'high',
      delivery: 'daily'
    }
  },
  {
    id: 'c5',
    name: 'Ravi Apartments Society',
    businessType: 'Housing Society',
    buyerCategory: 'B2C',
    location: { lat: 28.7041, lon: 77.1025 }, // North Delhi
    rating: 4.6,
    isVerified: true,
    completedTransactions: 85,
    paymentReliability: 0.97,
    budgetRange: { min: 30, max: 70 },
    requirements: {
      categories: ['vegetables', 'fruits', 'staples'],
      wantedProducts: ['potato', 'onion', 'tomato', 'wheat'],
    },
    requiredQuantity: 100, // Bulk for society
    phone: '+91 98765 43224',
    image: null,
    preferences: {
      organic: false,
      freshness: 'medium',
      delivery: 'weekly'
    }
  },
  {
    id: 'c6',
    name: 'Maya Singh',
    businessType: 'Individual Consumer',
    buyerCategory: 'B2C',
    location: { lat: 28.6020, lon: 77.2300 }, // Central Delhi
    rating: 4.9,
    isVerified: true,
    completedTransactions: 30,
    paymentReliability: 1.0,
    budgetRange: { min: 45, max: 100 },
    requirements: {
      categories: ['vegetables', 'fresh produce', 'seasonal'],
      wantedProducts: ['seasonal vegetables', 'leafy greens'],
    },
    requiredQuantity: 3,
    phone: '+91 98765 43225',
    image: null,
    preferences: {
      organic: true,
      freshness: 'very-high',
      delivery: 'same-day'
    }
  },

  // B2B - More Traders
  {
    id: 't5',
    name: 'Local Sabzi Mandi',
    businessType: 'Local Market',
    buyerCategory: 'B2B',
    location: { lat: 28.6280, lon: 77.2200 }, // Very close
    rating: 3.9,
    isVerified: false,
    completedTransactions: 45,
    paymentReliability: 0.85,
    budgetRange: { min: 10, max: 60 },
    requirements: {
      categories: ['vegetables', 'fresh produce', 'perishables'],
      wantedProducts: ['tomato', 'onion', 'potato', 'carrot', 'beans'],
    },
    requiredQuantity: 100,
    phone: '+91 98765 43214',
    image: null,
  },
];

// Storage key
const STORAGE_KEY = '@agrobuddy_supply_chain_cache';

/**
 * Main hook for Supply Chain Matching
 */
export const useSupplyChainMatching = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [matches, setMatches] = useState([]);
  const [traders, setTraders] = useState(SAMPLE_TRADERS);
  const [farmerLocation, setFarmerLocation] = useState({ lat: 28.6139, lon: 77.2090 });
  const [selectedBuyerType, setSelectedBuyerType] = useState('ALL'); // ALL, B2B, B2C

  // Load cached data
  useEffect(() => {
    loadCachedData();
  }, []);

  const loadCachedData = async () => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        if (data.farmerLocation) {
          setFarmerLocation(data.farmerLocation);
        }
      }
    } catch (err) {
      console.log('Error loading cached supply chain data:', err);
    }
  };

  const saveFarmerLocation = async (location) => {
    try {
      setFarmerLocation(location);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ farmerLocation: location }));
    } catch (err) {
      console.log('Error saving farmer location:', err);
    }
  };

  /**
   * Find matches for a product with buyer type filtering
   */
  const findMatches = useCallback(async (product, buyerTypeFilter = 'ALL') => {
    setLoading(true);
    setError(null);

    try {
      // Filter traders by buyer type
      let filteredTraders = traders;
      if (buyerTypeFilter === 'B2B') {
        filteredTraders = traders.filter(t => t.buyerCategory === 'B2B');
      } else if (buyerTypeFilter === 'B2C') {
        filteredTraders = traders.filter(t => t.buyerCategory === 'B2C');
      }

      const matchResults = SupplyChainMatcher.findOptimalBuyers(
        product,
        filteredTraders,
        farmerLocation
      );

      setMatches(matchResults);
      return matchResults;
    } catch (err) {
      console.log('Error finding matches:', err);
      setError('Failed to find buyer matches');
      return [];
    } finally {
      setLoading(false);
    }
  }, [traders, farmerLocation]);

  /**
   * Get top N matches for a product
   */
  const getTopMatches = useCallback((product, topN = 5) => {
    return SupplyChainMatcher.getTopBuyers(product, traders, farmerLocation, topN);
  }, [traders, farmerLocation]);

  /**
   * Group matches by quality tier
   */
  const getGroupedMatches = useCallback(() => {
    return SupplyChainMatcher.groupMatchesByQuality(matches);
  }, [matches]);

  /**
   * Refresh traders list (from API in production)
   */
  const refreshTraders = useCallback(async () => {
    setLoading(true);
    try {
      // In production:
      // const response = await api.get('/traders');
      // setTraders(response.data);
      
      // For now, simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setTraders(SAMPLE_TRADERS);
    } catch (err) {
      setError('Failed to refresh traders');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get statistics by buyer type
   */
  const getStatsByBuyerType = useCallback(() => {
    const b2bMatches = matches.filter(m => m.buyerCategory === 'B2B');
    const b2cMatches = matches.filter(m => m.buyerCategory === 'B2C');
    
    return {
      b2b: {
        count: b2bMatches.length,
        avgScore: b2bMatches.length > 0 ? 
          Math.round(b2bMatches.reduce((sum, m) => sum + m.matchScore, 0) / b2bMatches.length * 100) : 0,
        bestMatch: b2bMatches[0] || null,
      },
      b2c: {
        count: b2cMatches.length,
        avgScore: b2cMatches.length > 0 ? 
          Math.round(b2cMatches.reduce((sum, m) => sum + m.matchScore, 0) / b2cMatches.length * 100) : 0,
        bestMatch: b2cMatches[0] || null,
      }
    };
  }, [matches]);

  /**
   * Filter existing matches by buyer type
   */
  const filterMatchesByType = useCallback((buyerType) => {
    if (buyerType === 'ALL') return matches;
    return matches.filter(m => m.buyerCategory === buyerType);
  }, [matches]);

  return {
    loading,
    error,
    matches,
    traders,
    farmerLocation,
    selectedBuyerType,
    findMatches,
    getTopMatches,
    getGroupedMatches,
    refreshTraders,
    saveFarmerLocation,
    setFarmerLocation,
    setSelectedBuyerType,
    getStatsByBuyerType,
    filterMatchesByType,
  };
};

/**
 * Hook for product-specific matching
 */
export const useProductMatching = (product) => {
  const { findMatches, loading, error, matches, farmerLocation } = useSupplyChainMatching();
  const [productMatches, setProductMatches] = useState([]);

  useEffect(() => {
    if (product && product.product_name) {
      findMatches(product).then(results => {
        setProductMatches(results);
      });
    }
  }, [product, findMatches]);

  return {
    matches: productMatches,
    loading,
    error,
    farmerLocation,
    refresh: () => findMatches(product),
  };
};

/**
 * Hook for getting match statistics
 */
export const useMatchStatistics = (matches) => {
  const [stats, setStats] = useState({
    totalMatches: 0,
    excellentMatches: 0,
    goodMatches: 0,
    averageMatchScore: 0,
    bestMatch: null,
    nearestBuyer: null,
    highestPaying: null,
  });

  useEffect(() => {
    if (!matches || matches.length === 0) {
      return;
    }

    const grouped = SupplyChainMatcher.groupMatchesByQuality(matches);
    
    const totalScore = matches.reduce((sum, m) => sum + m.matchScore, 0);
    
    const nearestBuyer = [...matches].sort(
      (a, b) => a.logistics.distanceKm - b.logistics.distanceKm
    )[0];

    const highestPaying = [...matches].sort(
      (a, b) => (b.budgetRange?.max || 0) - (a.budgetRange?.max || 0)
    )[0];

    setStats({
      totalMatches: matches.length,
      excellentMatches: grouped.excellent.length,
      goodMatches: grouped.good.length,
      averageMatchScore: Math.round((totalScore / matches.length) * 100),
      bestMatch: matches[0] || null,
      nearestBuyer,
      highestPaying,
    });
  }, [matches]);

  return stats;
};

export default useSupplyChainMatching;
