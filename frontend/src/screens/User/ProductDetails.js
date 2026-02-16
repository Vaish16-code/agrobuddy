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

const ProductDetails = ({ route, navigation }) => {
  const { product } = route.params;
  const [quantity, setQuantity] = useState('1');
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    if (qty > product.quantity) {
      Alert.alert('Error', `Only ${product.quantity} units available`);
      return;
    }

    setLoading(true);
    try {
      const response = await ordersAPI.create({
        product_id: product.id,
        product_type: 'farmer_product',
        quantity: qty,
      });

      if (response.data.success) {
        Alert.alert(
          'Order Placed! 🎉',
          `Total: ₹${(product.price * qty).toFixed(2)}\n\nYour order has been placed successfully. Contact the farmer for delivery details.`,
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
          <Text style={styles.placeholderText}>🌾</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.productName}>{product.product_name}</Text>
        
        <View style={styles.farmerCard}>
          <View style={styles.farmerAvatar}>
            <Text style={styles.farmerAvatarText}>👨‍🌾</Text>
          </View>
          <View style={styles.farmerInfo}>
            <Text style={styles.farmerLabel}>Sold by</Text>
            <Text style={styles.farmerName}>{product.farmer_name}</Text>
            {product.farmer_phone && (
              <Text style={styles.farmerPhone}>📞 {product.farmer_phone}</Text>
            )}
          </View>
        </View>
        
        <View style={styles.priceContainer}>
          <View>
            <Text style={styles.priceLabel}>Price</Text>
            <Text style={styles.price}>₹{product.price}</Text>
          </View>
          <View style={styles.availabilityContainer}>
            <Text style={styles.availabilityLabel}>Available</Text>
            <Text style={styles.availability}>{product.quantity} units</Text>
          </View>
        </View>

        {product.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>
        )}

        <View style={styles.orderSection}>
          <Text style={styles.orderTitle}>Place Your Order</Text>
          
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
                <Text style={styles.quantityButtonText}>−</Text>
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
                  const q = Math.min(product.quantity, parseInt(quantity) + 1 || 1);
                  setQuantity(q.toString());
                }}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.totalContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>
                ₹{(product.price * (parseInt(quantity) || 0)).toFixed(2)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>
                ₹{(product.price * (parseInt(quantity) || 0)).toFixed(2)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.buyButton, loading && styles.buyButtonDisabled]}
            onPress={handleBuy}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.buyButtonText}>Buy Now</Text>
                <Text style={styles.buyButtonIcon}>🛒</Text>
              </>
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
    height: 280,
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
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  farmerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  farmerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  farmerAvatarText: {
    fontSize: 24,
  },
  farmerInfo: {
    flex: 1,
  },
  farmerLabel: {
    fontSize: 12,
    color: '#666',
  },
  farmerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  farmerPhone: {
    fontSize: 14,
    color: '#1976D2',
    marginTop: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  availabilityContainer: {
    alignItems: 'flex-end',
  },
  availabilityLabel: {
    fontSize: 12,
    color: '#666',
  },
  availability: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E7D32',
  },
  section: {
    marginBottom: 20,
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
  orderSection: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: '#1976D2',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  quantityInput: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginHorizontal: 12,
    borderRadius: 8,
    fontSize: 20,
    textAlign: 'center',
    minWidth: 70,
    fontWeight: 'bold',
  },
  totalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 16,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  grandTotalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  buyButton: {
    backgroundColor: '#1976D2',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyButtonDisabled: {
    backgroundColor: '#ccc',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  buyButtonIcon: {
    fontSize: 20,
  },
});

export default ProductDetails;
