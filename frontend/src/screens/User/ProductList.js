import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { farmerProductsAPI } from '../../services/api';

// ─── Category keyword mapping ──────────────────────────────────────────────
// Each category has keywords — product_name must match one to appear in that category
const CATEGORY_KEYWORDS = {
  'Fresh Vegetables': [
    'tomato', 'potato', 'onion', 'carrot', 'spinach', 'cabbage', 'brinjal',
    'capsicum', 'cucumber', 'beans', 'peas', 'cauliflower', 'broccoli',
    'radish', 'beetroot', 'lady finger', 'bhindi', 'pumpkin', 'gourd',
    'bitter gourd', 'bottle gourd', 'ridge gourd', 'chilli', 'garlic', 'ginger',
    'leek', 'celery', 'kale', 'methi', 'fenugreek', 'coriander', 'mint',
    'palak', 'arbi', 'suran', 'taro', 'yam', 'raw banana', 'drumstick',
    'vegetable', 'sabzi', 'green',
  ],
  'Fruits': [
    'mango', 'apple', 'banana', 'orange', 'grapes', 'watermelon', 'papaya',
    'guava', 'pomegranate', 'pineapple', 'strawberry', 'lemon', 'lime',
    'coconut', 'jackfruit', 'litchi', 'kiwi', 'peach', 'plum', 'pear',
    'cherry', 'fig', 'date', 'mulberry', 'custard apple', 'sapota', 'chiku',
    'avocado', 'dragon fruit', 'passion fruit', 'fruit',
  ],
  'Grains': [
    'rice', 'wheat', 'dal', 'lentil', 'maize', 'corn', 'jowar', 'bajra',
    'ragi', 'barley', 'oats', 'sorghum', 'millet', 'chickpea', 'chana',
    'rajma', 'kidney bean', 'moong', 'urad', 'masoor', 'toor', 'arhar',
    'soybean', 'groundnut', 'peanut', 'mustard', 'sesame', 'sunflower seed',
    'grain', 'cereal', 'pulse', 'legume', 'flour', 'atta',
  ],
  'Dairy Products': [
    'milk', 'ghee', 'butter', 'paneer', 'curd', 'yogurt', 'cheese',
    'cream', 'lassi', 'whey', 'dairy', 'dahi',
  ],
};

function matchesCategory(productName, category) {
  if (!category || category === 'All') return true;
  const keywords = CATEGORY_KEYWORDS[category] || [];
  const lower = productName.toLowerCase();
  return keywords.some(kw => lower.includes(kw));
}

const ProductList = ({ navigation, route }) => {
  const category = route?.params?.category || null; // e.g. 'Fresh Vegetables'
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProducts = async () => {
    try {
      const response = await farmerProductsAPI.getAll();
      if (response.data.success) {
        const all = response.data.data;
        setProducts(all);
        applyFilters(all, searchQuery, category);
      }
    } catch (error) {
      console.log('Error fetching products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = (all, query, cat) => {
    let result = all;

    // Filter by category keywords
    if (cat) {
      result = result.filter(p => matchesCategory(p.product_name, cat));
    }

    // Filter by search query
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        p =>
          p.product_name.toLowerCase().includes(q) ||
          p.farmer_name?.toLowerCase().includes(q)
      );
    }

    setFilteredProducts(result);
  };

  useEffect(() => { fetchProducts(); }, []);

  useEffect(() => {
    applyFilters(products, searchQuery, category);
  }, [searchQuery, products]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts();
  }, []);

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetails', { product });
  };

  const getCategoryEmoji = () => {
    const map = {
      'Fresh Vegetables': '🥬',
      'Fruits': '🍎',
      'Grains': '🌾',
      'Dairy Products': '🥛',
    };
    return map[category] || '🛒';
  };

  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleProductPress(item)}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.productImage} />
      ) : (
        <View style={[styles.productImage, styles.placeholderImage]}>
          <Text style={styles.placeholderText}>{getCategoryEmoji()}</Text>
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.product_name}</Text>
        <Text style={styles.farmerName}>by {item.farmer_name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>₹{item.price}</Text>
          <Text style={styles.productQuantity}>Stock: {item.quantity}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Category header strip */}
      {category && (
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryHeaderText}>
            {getCategoryEmoji()} {category}
          </Text>
          <Text style={styles.categoryCount}>
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={`Search${category ? ` in ${category}` : ' products or farmers'}...`}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>{getCategoryEmoji()}</Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? 'No products found'
              : category
              ? `No ${category} available yet`
              : 'No products available'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery
              ? 'Try a different search term'
              : category
              ? `Farmers haven't listed ${category} yet. Check back soon!`
              : 'Check back later for new products'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={2}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1976D2']} />
          }
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1976D2',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  categoryHeaderText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  categoryCount: { fontSize: 13, color: '#BBDEFB' },

  searchContainer: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
  },
  listContainer: { padding: 8 },
  columnWrapper: { justifyContent: 'space-between', paddingHorizontal: 8 },
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productImage: { width: '100%', height: 120 },
  placeholderImage: { backgroundColor: '#e8f5e9', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 40 },
  productInfo: { padding: 12 },
  productName: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 },
  farmerName: { fontSize: 12, color: '#666', marginBottom: 8 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { fontSize: 16, color: '#1976D2', fontWeight: 'bold' },
  productQuantity: { fontSize: 12, color: '#666' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#666', marginBottom: 8, textAlign: 'center' },
  emptySubtext: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 20 },
});

export default ProductList;
