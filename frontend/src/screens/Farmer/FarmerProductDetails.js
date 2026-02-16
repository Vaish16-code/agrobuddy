import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ordersAPI } from '../../services/api';

const FarmerProductDetails = ({ route, navigation }) => {
  const { product, type } = route.params;
  const [quantity, setQuantity] = useState('1');
  const [loading, setLoading] = useState(false);

  const priceKey = type === 'trader' ? 'price_per_kg' : 'price';
  const quantityKey = type === 'trader' ? 'available_quantity' : 'quantity';
  const productType = type === 'trader' ? 'trader_product' : 'farmer_product';
  const sellerName = type === 'trader' ? product.trader_name : product.farmer_name;

  const handleBuy = async () => {
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    if (qty > product[quantityKey]) {
      Alert.alert('Error', `Only ${product[quantityKey]} units available`);
      return;
    }

    setLoading(true);
    try {
      const response = await ordersAPI.create({
        product_id: product.id,
        product_type: productType,
        quantity: qty,
      });

      if (response.data.success) {
        Alert.alert(
          'Order Placed!',
          `Total: ₹${(product[priceKey] * qty).toFixed(2)}`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to place order';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {product.image_url ? (
        <Image source={{ uri: product.image_url }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholderImage]}>
          <Text style={styles.placeholderText}>{type === 'trader' ? '🌱' : '🌾'}</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.productName}>{product.product_name}</Text>
        <Text style={styles.sellerName}>Sold by: {sellerName}</Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>
            ₹{product[priceKey]}
            {type === 'trader' && <Text style={styles.perUnit}>/kg</Text>}
          </Text>
          <Text style={styles.available}>
            Available: {product[quantityKey]} {type === 'trader' ? 'kg' : 'units'}
          </Text>
        </View>

        {product.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Seller</Text>
          <Text style={styles.phone}>
            📞 {type === 'trader' ? product.trader_phone : product.farmer_phone || 'Not provided'}
          </Text>
        </View>

        <View style={styles.orderSection}>
          <Text style={styles.sectionTitle}>Place Order</Text>
          <View style={styles.quantityRow}>
            <Text style={styles.quantityLabel}>Quantity:</Text>
            <View style={styles.quantityInputContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => {
                  const q = Math.max(1, parseInt(quantity) - 1 || 1);
                  setQuantity(q.toString());
                }}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.quantityInput}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="number-pad"
              />
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => {
                  const q = Math.min(product[quantityKey], parseInt(quantity) + 1 || 1);
                  setQuantity(q.toString());
                }}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalPrice}>
              ₹{(product[priceKey] * (parseInt(quantity) || 0)).toFixed(2)}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.buyButton, loading && styles.buyButtonDisabled]}
            onPress={handleBuy}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buyButtonText}>Place Order</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: 250,
  },
  placeholderImage: {
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 80,
  },
  content: {
    padding: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  sellerName: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  perUnit: {
    fontSize: 16,
    fontWeight: 'normal',
  },
  available: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  phone: {
    fontSize: 16,
    color: '#1976D2',
  },
  orderSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 16,
    color: '#333',
  },
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: '#2E7D32',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  quantityInput: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 12,
    borderRadius: 8,
    fontSize: 18,
    textAlign: 'center',
    minWidth: 60,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  buyButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buyButtonDisabled: {
    backgroundColor: '#ccc',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default FarmerProductDetails;
