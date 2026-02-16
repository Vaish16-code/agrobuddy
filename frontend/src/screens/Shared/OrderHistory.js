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
import { ordersAPI } from '../../services/api';

const OrderHistory = ({ navigation }) => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('purchases');

  const fetchOrders = async () => {
    try {
      const [purchasesRes, salesRes] = await Promise.all([
        ordersAPI.getMyPurchases(),
        ordersAPI.getMySales(),
      ]);

      if (purchasesRes.data.success) {
        setPurchases(purchasesRes.data.data);
      }
      if (salesRes.data.success) {
        setSales(salesRes.data.data);
      }
    } catch (error) {
      console.log('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'confirmed': return '#2196F3';
      case 'shipped': return '#9C27B0';
      case 'delivered': return '#4CAF50';
      case 'cancelled': return '#F44336';
      default: return '#666';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderOrder = ({ item }) => {
    const isPurchase = activeTab === 'purchases';
    const otherPartyName = isPurchase ? item.seller_name : item.buyer_name;
    const otherPartyPhone = isPurchase ? item.seller_phone : item.buyer_phone;

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.orderIdContainer}>
            <Text style={styles.orderIdLabel}>Order</Text>
            <Text style={styles.orderId}>#{item.id.slice(0, 8)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.productRow}>
          {item.product_image ? (
            <Image source={{ uri: item.product_image }} style={styles.productImage} />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>📦</Text>
            </View>
          )}
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.product_name || 'Product'}</Text>
            <Text style={styles.quantity}>Qty: {item.quantity}</Text>
          </View>
          <Text style={styles.price}>₹{item.total_price}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.partyInfo}>
          <Text style={styles.partyLabel}>{isPurchase ? 'Seller' : 'Buyer'}:</Text>
          <View style={styles.partyDetails}>
            <Text style={styles.partyName}>{otherPartyName}</Text>
            {otherPartyPhone && (
              <Text style={styles.partyPhone}>📞 {otherPartyPhone}</Text>
            )}
          </View>
        </View>

        <Text style={styles.date}>{formatDate(item.created_at)}</Text>
      </View>
    );
  };

  const currentData = activeTab === 'purchases' ? purchases : sales;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'purchases' && styles.activeTab]}
          onPress={() => setActiveTab('purchases')}
        >
          <Text style={[styles.tabText, activeTab === 'purchases' && styles.activeTabText]}>
            My Purchases ({purchases.length})
          </Text>
        </TouchableOpacity>
        {(user?.role === 'farmer' || user?.role === 'trader') && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'sales' && styles.activeTab]}
            onPress={() => setActiveTab('sales')}
          >
            <Text style={[styles.tabText, activeTab === 'sales' && styles.activeTabText]}>
              My Sales ({sales.length})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {currentData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>{activeTab === 'purchases' ? '🛒' : '📦'}</Text>
          <Text style={styles.emptyText}>
            No {activeTab === 'purchases' ? 'purchases' : 'sales'} yet
          </Text>
          <Text style={styles.emptySubtext}>
            {activeTab === 'purchases'
              ? 'Start shopping to see your orders here'
              : 'Your sales will appear here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentData}
          renderItem={renderOrder}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#E3F2FD',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#1976D2',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderIdContainer: {},
  orderIdLabel: {
    fontSize: 12,
    color: '#666',
  },
  orderId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  placeholderImage: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  quantity: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  partyInfo: {
    flexDirection: 'row',
  },
  partyLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  partyDetails: {
    flex: 1,
  },
  partyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  partyPhone: {
    fontSize: 12,
    color: '#1976D2',
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
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

export default OrderHistory;
