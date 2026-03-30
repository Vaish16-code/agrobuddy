/**
 * FreshPicksScreen.js
 * 
 * Shows buyers the freshest, highest-quality farmer products
 * Sorted by: Freshness (60%) + Farmer Reliability (40%)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { recommendationsAPI, ordersAPI } from '../../services/api';

const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Grains', 'Spices', 'Dairy'];

const FreshPicksScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [error, setError] = useState(null);

  const fetchFreshPicks = useCallback(async (category = selectedCategory) => {
    try {
      setError(null);
      const cat = category === 'All' ? null : category;
      const response = await recommendationsAPI.getFreshPicks(20, cat);
      if (response.data?.success) {
        setProducts(response.data.data || []);
      }
    } catch (err) {
      console.error('FreshPicks fetch error:', err);
      setError('Unable to load fresh picks. Check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchFreshPicks();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFreshPicks();
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setLoading(true);
    fetchFreshPicks(cat);
  };

  const handleBuyProduct = (product) => {
    navigation.navigate('ProductDetails', { product, source: 'farmer' });
  };

  const renderFreshnessBar = (score) => {
    const pct = Math.min(100, Math.max(0, score));
    const color = pct > 70 ? '#4CAF50' : pct > 40 ? '#FF9800' : '#F44336';
    return (
      <View style={styles.freshnessBarTrack}>
        <View style={[styles.freshnessBarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    );
  };

  const renderProductCard = ({ item, index }) => {
    const isTopPick = index < 3;
    const freshnessScore = parseFloat(item.freshness_score || 0);
    const reliabilityPct = parseFloat(item.farmer_reliability_pct || 50);
    const overallScore = parseFloat(item.overall_score || 0);

    return (
      <TouchableOpacity
        style={[styles.card, isTopPick && styles.topPickCard]}
        onPress={() => handleBuyProduct(item)}
        activeOpacity={0.85}
      >
        {/* Top Pick badge */}
        {isTopPick && (
          <View style={styles.topPickBadge}>
            <Text style={styles.topPickText}>🏆 Top Pick #{index + 1}</Text>
          </View>
        )}

        <View style={styles.cardRow}>
          {/* Product image or placeholder */}
          <View style={styles.imageContainer}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>🌾</Text>
              </View>
            )}
            {/* Overall score overlay */}
            <View style={[styles.scoreOverlay, {
              backgroundColor: overallScore > 70 ? '#4CAF50' : overallScore > 45 ? '#FF9800' : '#9E9E9E',
            }]}>
              <Text style={styles.scoreOverlayText}>{Math.round(overallScore)}%</Text>
            </View>
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.productName} numberOfLines={1}>{item.product_name}</Text>

            <Text style={styles.freshnessLabel}>{item.freshness_label || 'Fresh'}</Text>

            {/* Freshness bar */}
            <View style={styles.freshnessRow}>
              <Text style={styles.freshnessBarLabel}>Freshness</Text>
              {renderFreshnessBar(freshnessScore)}
              <Text style={styles.freshnessBarValue}>{Math.round(freshnessScore)}%</Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaItem}>👨‍🌾 {item.farmer_name || 'Farmer'}</Text>
              <Text style={styles.metaItem}>
                ⭐ {parseInt(item.farmer_total_sales) > 0
                  ? `${Math.round(reliabilityPct)}% reliable`
                  : 'New seller'}
              </Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.price}>₹{item.price}/unit</Text>
              <Text style={styles.quantity}>Qty: {item.quantity}</Text>
            </View>

            <View style={styles.daysRow}>
              <Text style={styles.daysText}>
                {parseFloat(item.days_old) < 1
                  ? '🌱 Listed today'
                  : `📅 Listed ${parseFloat(item.days_old).toFixed(0)} day(s) ago`}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.orderButton}
          onPress={() => handleBuyProduct(item)}
        >
          <Text style={styles.orderButtonText}>🛒 View & Order</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Finding the freshest produce...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🌟 Fresh Picks</Text>
        <Text style={styles.headerSubtitle}>Freshest produce · Direct from farmers</Text>
      </View>

      {/* How it works strip */}
      <View style={styles.howItWorks}>
        <Text style={styles.howItem}>🕐 Freshness 60%</Text>
        <Text style={styles.howDivider}>+</Text>
        <Text style={styles.howItem}>⭐ Reliability 40%</Text>
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.catChip, selectedCategory === cat && styles.catChipActive]}
            onPress={() => handleCategoryChange(cat)}
          >
            <Text style={[styles.catChipText, selectedCategory === cat && styles.catChipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Error state */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Product list */}
      {products.length === 0 && !error ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>🌾</Text>
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptySubtitle}>
            {selectedCategory === 'All'
              ? 'No farmer products listed yet.'
              : `No ${selectedCategory} found. Try a different category.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderProductCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4CAF50']}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F8E9',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#555',
  },

  // Header
  header: {
    backgroundColor: '#2E7D32',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#A5D6A7',
    marginTop: 4,
  },

  // How it works
  howItWorks: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#C8E6C9',
  },
  howItem: { fontSize: 12, color: '#2E7D32', fontWeight: '600' },
  howDivider: { fontSize: 12, color: '#888', marginHorizontal: 8 },

  // Category filter
  categoryScroll: { maxHeight: 50 },
  categoryContent: { paddingHorizontal: 16, paddingVertical: 8, alignItems: 'center' },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#81C784',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  catChipActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  catChipText: { fontSize: 13, color: '#2E7D32', fontWeight: '500' },
  catChipTextActive: { color: '#FFFFFF' },

  // Error
  errorBox: {
    backgroundColor: '#FFEBEE',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  errorText: { color: '#C62828', fontSize: 14, marginBottom: 8 },
  retryText: { color: '#1976D2', fontWeight: '600', fontSize: 14 },

  // List
  listContent: { padding: 16 },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  topPickCard: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  topPickBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#C8E6C9',
  },
  topPickText: { fontSize: 12, fontWeight: 'bold', color: '#2E7D32' },

  cardRow: { flexDirection: 'row', padding: 14 },

  // Image
  imageContainer: { position: 'relative', width: 85, height: 85, marginRight: 14 },
  image: { width: 85, height: 85, borderRadius: 12 },
  imagePlaceholder: {
    width: 85,
    height: 85,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: { fontSize: 34 },
  scoreOverlay: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  scoreOverlayText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },

  // Card content
  cardContent: { flex: 1 },
  productName: { fontSize: 16, fontWeight: 'bold', color: '#1B5E20', marginBottom: 2 },
  freshnessLabel: { fontSize: 12, color: '#558B2F', marginBottom: 6 },

  freshnessRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  freshnessBarLabel: { fontSize: 10, color: '#888', width: 58 },
  freshnessBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
    marginHorizontal: 4,
  },
  freshnessBarFill: { height: '100%', borderRadius: 3 },
  freshnessBarValue: { fontSize: 10, color: '#555', width: 30, textAlign: 'right' },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  metaItem: { fontSize: 11, color: '#666', marginRight: 8, marginBottom: 2 },

  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: 16, fontWeight: 'bold', color: '#2E7D32' },
  quantity: { fontSize: 12, color: '#888' },

  daysRow: { marginTop: 4 },
  daysText: { fontSize: 11, color: '#777' },

  // Order button
  orderButton: {
    backgroundColor: '#388E3C',
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  orderButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },

  // Empty
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
});

export default FreshPicksScreen;
