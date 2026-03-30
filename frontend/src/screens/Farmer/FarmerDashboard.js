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
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { farmerProductsAPI } from '../../services/api';

const FarmerDashboard = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = async () => {
    try {
      const response = await farmerProductsAPI.getMyProducts();
      if (response.data.success) {
        setProducts(response.data.data);
      }
    } catch (error) {
      console.log('Error fetching products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProducts();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts();
  }, []);

  const handleDelete = async (productId) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await farmerProductsAPI.delete(productId);
              setProducts(products.filter(p => p.id !== productId));
              Alert.alert('Success', 'Product deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: logout },
    ]);
  };

  const renderProduct = ({ item }) => (
    <View style={styles.productCard}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.productImage} />
      ) : (
        <View style={[styles.productImage, styles.placeholderImage]}>
          <Text style={styles.placeholderText}>🌾</Text>
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.product_name}</Text>
        <Text style={styles.productPrice}>₹{item.price}</Text>
        <Text style={styles.productQuantity}>Qty: {item.quantity}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item.id)}
      >
        <Text style={styles.deleteText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {user?.name}!</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#2E7D32' }]}
          onPress={() => navigation.navigate('AddFarmerProduct')}
        >
          <Text style={styles.actionButtonIcon}>➕</Text>
          <Text style={styles.actionButtonText}>Add Product</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#9C27B0' }]}
          onPress={() => navigation.navigate('FindBuyers')}
        >
          <Text style={styles.actionButtonIcon}>🔍</Text>
          <Text style={styles.actionButtonText}>Find Buyers</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FF8F00' }]}
          onPress={() => navigation.navigate('ViewTraderProducts')}
        >
          <Text style={styles.actionButtonIcon}>🌱</Text>
          <Text style={styles.actionButtonText}>Buy Seeds</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#1976D2' }]}
          onPress={() => navigation.navigate('OrderHistory')}
        >
          <Text style={styles.actionButtonIcon}>📋</Text>
          <Text style={styles.actionButtonText}>Orders</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>My Products ({products.length})</Text>

      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No products yet</Text>
          <Text style={styles.emptySubtext}>Add your first product to start selling</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutText: {
    color: '#d32f2f',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionButtonIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listContainer: {
    padding: 16,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  placeholderImage: {
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 30,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  productPrice: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: 'bold',
    marginTop: 4,
  },
  productQuantity: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  deleteText: {
    fontSize: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default FarmerDashboard;
