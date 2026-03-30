/**
 * Find Buyers Screen
 * 
 * Allows farmers to find the best matching buyers/traders for their products
 * using the Supply Chain Matching Algorithm
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  FlatList,
} from 'react-native';
import { useSupplyChainMatching, useMatchStatistics } from '../../hooks/useSupplyChainMatching';
import BuyerMatchCard, { MatchSummary, NoMatchesFound } from '../../components/BuyerMatchCard';

const FindBuyersScreen = ({ navigation, route }) => {
  // Get product from navigation params if passed
  const passedProduct = route?.params?.product;

  // Form state for product details
  const [productName, setProductName] = useState(passedProduct?.product_name || '');
  const [price, setPrice] = useState(passedProduct?.price?.toString() || '');
  const [quantity, setQuantity] = useState(passedProduct?.quantity?.toString() || '');
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Hook for supply chain matching
  const {
    loading,
    error,
    matches,
    findMatches,
    refreshTraders,
    farmerLocation,
  } = useSupplyChainMatching();

  // Statistics hook
  const stats = useMatchStatistics(matches);

  // Auto-search if product was passed
  useEffect(() => {
    if (passedProduct) {
      handleFindBuyers();
    }
  }, [passedProduct]);

  const handleFindBuyers = async () => {
    if (!productName.trim()) {
      Alert.alert('Error', 'Please enter a product name');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    const product = {
      product_name: productName,
      price: parseFloat(price),
      quantity: parseFloat(quantity),
    };

    setSearchPerformed(true);
    await findMatches(product);
  };

  const handleViewBuyerDetails = (buyer) => {
    navigation.navigate('BuyerDetails', { buyer });
  };

  const handleContactBuyer = (buyer) => {
    Alert.alert(
      'Contact Buyer',
      `Do you want to contact ${buyer.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes', onPress: () => console.log('Contact:', buyer.phone) },
      ]
    );
  };

  const renderBuyerCard = ({ item, index }) => (
    <View>
      {index === 0 && (
        <View style={styles.topMatchBadge}>
          <Text style={styles.topMatchText}>🏆 Top Match</Text>
        </View>
      )}
      <BuyerMatchCard
        buyer={item}
        onContact={handleContactBuyer}
        onViewDetails={handleViewBuyerDetails}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔍 Find Buyers</Text>
        <Text style={styles.headerSubtitle}>
          Match your products with the best buyers using AI
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshTraders}
            colors={['#4CAF50']}
          />
        }
      >
        {/* Product Input Form */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Enter Your Product Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>🌾 Product Name</Text>
            <TextInput
              style={styles.input}
              value={productName}
              onChangeText={setProductName}
              placeholder="e.g., Fresh Tomatoes, Rice, Wheat"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>💰 Price (₹/kg)</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="50"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>⚖️ Quantity (kg)</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="100"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.searchButton, loading && styles.searchButtonDisabled]}
            onPress={handleFindBuyers}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.searchButtonText}>🔍 Find Matching Buyers</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Algorithm Explanation */}
        {!searchPerformed && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>📊 How it Works</Text>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>🎯</Text>
              <Text style={styles.infoText}>
                <Text style={styles.infoBold}>Demand Matching (30%):</Text> Matches your product with buyers actively looking for it
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>📍</Text>
              <Text style={styles.infoText}>
                <Text style={styles.infoBold}>Distance (25%):</Text> Prioritizes nearby buyers to reduce transport costs
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>💵</Text>
              <Text style={styles.infoText}>
                <Text style={styles.infoBold}>Price Fit (20%):</Text> Finds buyers whose budget matches your price
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>⭐</Text>
              <Text style={styles.infoText}>
                <Text style={styles.infoBold}>Reliability (15%):</Text> Considers buyer ratings and transaction history
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>📦</Text>
              <Text style={styles.infoText}>
                <Text style={styles.infoBold}>Quantity Match (10%):</Text> Checks if you can fulfill buyer's requirements
              </Text>
            </View>
          </View>
        )}

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>❌ {error}</Text>
            <TouchableOpacity onPress={handleFindBuyers}>
              <Text style={styles.retryText}>Tap to retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Results Section */}
        {searchPerformed && !loading && (
          <>
            {matches.length > 0 ? (
              <>
                {/* Match Summary */}
                <MatchSummary stats={stats} />

                {/* Matches List */}
                <View style={styles.matchesHeader}>
                  <Text style={styles.matchesTitle}>
                    🎯 {matches.length} Buyer{matches.length !== 1 ? 's' : ''} Found
                  </Text>
                  <Text style={styles.matchesSubtitle}>
                    Sorted by best match score
                  </Text>
                </View>

                {matches.map((buyer, index) => (
                  <View key={buyer.id || index}>
                    {index === 0 && (
                      <View style={styles.topMatchBadge}>
                        <Text style={styles.topMatchText}>🏆 Top Match</Text>
                      </View>
                    )}
                    <BuyerMatchCard
                      buyer={buyer}
                      onContact={handleContactBuyer}
                      onViewDetails={handleViewBuyerDetails}
                    />
                  </View>
                ))}

                {/* Tips for Better Matches */}
                <View style={styles.tipsContainer}>
                  <Text style={styles.tipsTitle}>💡 Tips for Better Matches</Text>
                  <Text style={styles.tipsText}>
                    • Price competitively - check average market rates{'\n'}
                    • Offer flexible quantities for more buyers{'\n'}
                    • Respond quickly to buyer inquiries{'\n'}
                    • Maintain product quality for repeat business
                  </Text>
                </View>
              </>
            ) : (
              <NoMatchesFound onRefresh={handleFindBuyers} />
            )}
          </>
        )}

        {/* Location Info */}
        <View style={styles.locationInfo}>
          <Text style={styles.locationLabel}>📍 Your Location</Text>
          <Text style={styles.locationValue}>
            Lat: {farmerLocation?.lat?.toFixed(4)}, 
            Lon: {farmerLocation?.lon?.toFixed(4)}
          </Text>
          <TouchableOpacity 
            style={styles.updateLocationButton}
            onPress={() => Alert.alert('Update Location', 'Location update feature coming soon!')}
          >
            <Text style={styles.updateLocationText}>Update Location</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#C8E6C9',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Form
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  row: {
    flexDirection: 'row',
  },
  searchButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  searchButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Info Card
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  infoBullet: {
    fontSize: 16,
    marginRight: 10,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  infoBold: {
    fontWeight: '600',
    color: '#1976D2',
  },

  // Error
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    marginBottom: 8,
  },
  retryText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '600',
  },

  // Matches
  matchesHeader: {
    marginBottom: 12,
  },
  matchesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  matchesSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  topMatchBadge: {
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  topMatchText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F57C00',
  },

  // Tips
  tipsContainer: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
  },

  // Location
  locationInfo: {
    backgroundColor: '#ECEFF1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  locationLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  updateLocationButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#2196F3',
    borderRadius: 6,
  },
  updateLocationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default FindBuyersScreen;
