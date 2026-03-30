/**
 * AgroBuddy - Offline-First Synchronization Algorithm
 * 
 * This algorithm is critical for farmers in rural areas with poor internet connectivity.
 * It allows farmers to:
 * - Add products without internet
 * - Place/receive orders offline
 * - Automatically sync when connection is restored
 * 
 * Algorithm Flow:
 * 1. Check network status before any operation
 * 2. If offline: Store data locally with pending status
 * 3. If online: Try to sync, fallback to offline on failure
 * 4. Background sync: Periodically attempt to sync pending operations
 * 5. Conflict resolution: Use timestamp-based "last write wins" strategy
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import api from './api';

// Storage keys for offline data
const STORAGE_KEYS = {
  PENDING_PRODUCTS: 'agrobuddy_pending_products',
  PENDING_ORDERS: 'agrobuddy_pending_orders',
  PENDING_UPDATES: 'agrobuddy_pending_updates',
  CACHED_PRODUCTS: 'agrobuddy_cached_products',
  CACHED_ORDERS: 'agrobuddy_cached_orders',
  SYNC_QUEUE: 'agrobuddy_sync_queue',
  LAST_SYNC_TIME: 'agrobuddy_last_sync',
};

// Operation types for the sync queue
const OPERATION_TYPES = {
  ADD_PRODUCT: 'ADD_PRODUCT',
  UPDATE_PRODUCT: 'UPDATE_PRODUCT',
  DELETE_PRODUCT: 'DELETE_PRODUCT',
  PLACE_ORDER: 'PLACE_ORDER',
  UPDATE_ORDER_STATUS: 'UPDATE_ORDER_STATUS',
};

// Priority levels for sync operations
const PRIORITY = {
  HIGH: 1,    // Orders (money involved)
  MEDIUM: 2,  // Product updates
  LOW: 3,     // Non-critical updates
};

class OfflineSyncManager {
  constructor() {
    this.isOnline = true;
    this.isSyncing = false;
    this.syncListeners = [];
    this.networkListeners = [];
  }

  /**
   * Initialize the offline sync manager
   * Call this when app starts
   */
  async initialize() {
    // Check initial network state
    const netInfo = await NetInfo.fetch();
    this.isOnline = netInfo.isConnected && netInfo.isInternetReachable;

    // Subscribe to network changes
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected && state.isInternetReachable;

      // Notify listeners
      this.networkListeners.forEach(listener => listener(this.isOnline));

      // If coming back online, trigger sync
      if (wasOffline && this.isOnline) {
        console.log('📶 Network restored - Starting sync...');
        this.syncAll();
      }
    });

    // Try initial sync if online
    if (this.isOnline) {
      await this.syncAll();
    }

    console.log('✅ OfflineSyncManager initialized, Online:', this.isOnline);
  }

  /**
   * Subscribe to network status changes
   */
  onNetworkChange(listener) {
    this.networkListeners.push(listener);
    return () => {
      this.networkListeners = this.networkListeners.filter(l => l !== listener);
    };
  }

  /**
   * Subscribe to sync status changes
   */
  onSyncChange(listener) {
    this.syncListeners.push(listener);
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== listener);
    };
  }

  /**
   * Check if currently online
   */
  async checkOnlineStatus() {
    const netInfo = await NetInfo.fetch();
    this.isOnline = netInfo.isConnected && netInfo.isInternetReachable;
    return this.isOnline;
  }

  // =====================================================
  // PRODUCT OPERATIONS (For Farmers)
  // =====================================================

  /**
   * Add a new product (works offline)
   * @param {Object} productData - Product information
   * @param {string} imageUri - Local image URI (optional)
   */
  async addProduct(productData, imageUri = null) {
    const operation = {
      id: `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: OPERATION_TYPES.ADD_PRODUCT,
      data: {
        ...productData,
        localImageUri: imageUri,
        createdAt: new Date().toISOString(),
      },
      priority: PRIORITY.MEDIUM,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3,
      status: 'pending', // pending, syncing, synced, failed
    };

    // Try to sync immediately if online
    if (await this.checkOnlineStatus()) {
      try {
        const result = await this._syncAddProduct(operation);
        operation.status = 'synced';
        operation.serverId = result.id;
        
        // Cache the synced product
        await this._cacheProduct(result);
        
        return { success: true, product: result, wasOffline: false };
      } catch (error) {
        console.log('⚠️ Online sync failed, saving offline:', error.message);
      }
    }

    // Save to offline queue
    await this._addToSyncQueue(operation);
    
    // Also save to local products for immediate display
    await this._saveLocalProduct(operation.data, operation.id);

    return { 
      success: true, 
      product: { ...operation.data, id: operation.id }, 
      wasOffline: true,
      message: 'Product saved offline. Will sync when connection is available.'
    };
  }

  /**
   * Update an existing product (works offline)
   */
  async updateProduct(productId, updateData) {
    const operation = {
      id: `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: OPERATION_TYPES.UPDATE_PRODUCT,
      data: {
        productId,
        ...updateData,
        updatedAt: new Date().toISOString(),
      },
      priority: PRIORITY.MEDIUM,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3,
      status: 'pending',
    };

    if (await this.checkOnlineStatus()) {
      try {
        const result = await this._syncUpdateProduct(operation);
        await this._cacheProduct(result);
        return { success: true, product: result, wasOffline: false };
      } catch (error) {
        console.log('⚠️ Online update failed, saving offline:', error.message);
      }
    }

    await this._addToSyncQueue(operation);
    await this._updateLocalProduct(productId, updateData);

    return { 
      success: true, 
      wasOffline: true,
      message: 'Update saved offline. Will sync when connection is available.'
    };
  }

  /**
   * Delete a product (works offline)
   */
  async deleteProduct(productId) {
    const operation = {
      id: `delete_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: OPERATION_TYPES.DELETE_PRODUCT,
      data: { productId },
      priority: PRIORITY.LOW,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3,
      status: 'pending',
    };

    if (await this.checkOnlineStatus()) {
      try {
        await api.delete(`/farmer/products/${productId}`);
        await this._removeLocalProduct(productId);
        return { success: true, wasOffline: false };
      } catch (error) {
        console.log('⚠️ Online delete failed, saving offline:', error.message);
      }
    }

    await this._addToSyncQueue(operation);
    await this._markLocalProductDeleted(productId);

    return { 
      success: true, 
      wasOffline: true,
      message: 'Delete queued. Will sync when connection is available.'
    };
  }

  // =====================================================
  // ORDER OPERATIONS
  // =====================================================

  /**
   * Place an order (works offline with high priority)
   */
  async placeOrder(orderData) {
    const operation = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: OPERATION_TYPES.PLACE_ORDER,
      data: {
        ...orderData,
        createdAt: new Date().toISOString(),
        status: 'pending',
      },
      priority: PRIORITY.HIGH, // Orders have highest priority
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 5, // More retries for orders
      status: 'pending',
    };

    if (await this.checkOnlineStatus()) {
      try {
        const result = await this._syncPlaceOrder(operation);
        await this._cacheOrder(result);
        return { success: true, order: result, wasOffline: false };
      } catch (error) {
        console.log('⚠️ Online order failed, saving offline:', error.message);
      }
    }

    await this._addToSyncQueue(operation);
    await this._saveLocalOrder(operation.data, operation.id);

    return { 
      success: true, 
      order: { ...operation.data, id: operation.id }, 
      wasOffline: true,
      message: 'Order saved offline. Will be placed when connection is available.'
    };
  }

  /**
   * Update order status (for farmers/traders)
   */
  async updateOrderStatus(orderId, newStatus) {
    const operation = {
      id: `status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: OPERATION_TYPES.UPDATE_ORDER_STATUS,
      data: {
        orderId,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      },
      priority: PRIORITY.HIGH,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 5,
      status: 'pending',
    };

    if (await this.checkOnlineStatus()) {
      try {
        const result = await api.patch(`/orders/${orderId}/status`, { status: newStatus });
        await this._updateLocalOrder(orderId, { status: newStatus });
        return { success: true, order: result.data, wasOffline: false };
      } catch (error) {
        console.log('⚠️ Status update failed, saving offline:', error.message);
      }
    }

    await this._addToSyncQueue(operation);
    await this._updateLocalOrder(orderId, { status: newStatus, pendingSync: true });

    return { 
      success: true, 
      wasOffline: true,
      message: 'Status update queued. Will sync when connection is available.'
    };
  }

  // =====================================================
  // SYNC OPERATIONS
  // =====================================================

  /**
   * Sync all pending operations
   * Called automatically when coming online or manually
   */
  async syncAll() {
    if (this.isSyncing) {
      console.log('⏳ Sync already in progress...');
      return { success: false, message: 'Sync in progress' };
    }

    if (!await this.checkOnlineStatus()) {
      console.log('📵 Cannot sync - offline');
      return { success: false, message: 'No internet connection' };
    }

    this.isSyncing = true;
    this.syncListeners.forEach(listener => listener({ syncing: true }));

    const results = {
      synced: 0,
      failed: 0,
      remaining: 0,
      errors: [],
    };

    try {
      // Get all pending operations sorted by priority and timestamp
      const queue = await this._getSyncQueue();
      const sortedQueue = queue
        .filter(op => op.status === 'pending' || op.status === 'failed')
        .sort((a, b) => {
          if (a.priority !== b.priority) return a.priority - b.priority;
          return a.timestamp - b.timestamp;
        });

      console.log(`🔄 Starting sync of ${sortedQueue.length} operations...`);

      for (const operation of sortedQueue) {
        try {
          await this._processOperation(operation);
          operation.status = 'synced';
          results.synced++;
        } catch (error) {
          operation.retryCount++;
          
          if (operation.retryCount >= operation.maxRetries) {
            operation.status = 'failed';
            results.failed++;
            results.errors.push({
              operationId: operation.id,
              error: error.message,
            });
          } else {
            operation.status = 'pending';
            results.remaining++;
          }
        }
      }

      // Update the queue with new statuses
      await this._saveSyncQueue(sortedQueue.filter(op => op.status !== 'synced'));
      
      // Update last sync time
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC_TIME, new Date().toISOString());

      console.log(`✅ Sync complete: ${results.synced} synced, ${results.failed} failed, ${results.remaining} remaining`);

    } catch (error) {
      console.error('❌ Sync error:', error);
      results.errors.push({ error: error.message });
    } finally {
      this.isSyncing = false;
      this.syncListeners.forEach(listener => listener({ syncing: false, results }));
    }

    return { success: true, results };
  }

  /**
   * Get pending operations count
   */
  async getPendingCount() {
    const queue = await this._getSyncQueue();
    return queue.filter(op => op.status === 'pending' || op.status === 'failed').length;
  }

  /**
   * Get sync status summary
   */
  async getSyncStatus() {
    const queue = await this._getSyncQueue();
    const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC_TIME);
    
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: queue.filter(op => op.status === 'pending').length,
      failedCount: queue.filter(op => op.status === 'failed').length,
      lastSyncTime: lastSync,
      pendingOperations: queue.map(op => ({
        id: op.id,
        type: op.type,
        status: op.status,
        retryCount: op.retryCount,
      })),
    };
  }

  // =====================================================
  // CACHE OPERATIONS (For reading data offline)
  // =====================================================

  /**
   * Get products (from cache if offline)
   */
  async getProducts(farmerId = null) {
    if (await this.checkOnlineStatus()) {
      try {
        const endpoint = farmerId ? `/farmer/products/my` : '/farmer/products';
        const response = await api.get(endpoint);
        
        // Cache the results
        await this._cacheProducts(response.data.data || response.data);
        
        return { 
          success: true, 
          products: response.data.data || response.data, 
          fromCache: false 
        };
      } catch (error) {
        console.log('⚠️ Failed to fetch online, using cache:', error.message);
      }
    }

    // Return cached data
    const cachedProducts = await this._getCachedProducts();
    const localProducts = await this._getLocalProducts();
    
    // Merge cached and local (pending) products
    const allProducts = [...cachedProducts, ...localProducts.filter(p => !p.deleted)];

    return { 
      success: true, 
      products: allProducts, 
      fromCache: true,
      message: 'Showing offline data. Some products may be pending sync.'
    };
  }

  /**
   * Get orders (from cache if offline)
   */
  async getOrders(userId, type = 'purchases') {
    if (await this.checkOnlineStatus()) {
      try {
        const endpoint = type === 'purchases' ? '/orders/purchases' : '/orders/sales';
        const response = await api.get(endpoint);
        
        await this._cacheOrders(response.data.data || response.data);
        
        return { 
          success: true, 
          orders: response.data.data || response.data, 
          fromCache: false 
        };
      } catch (error) {
        console.log('⚠️ Failed to fetch orders online, using cache:', error.message);
      }
    }

    const cachedOrders = await this._getCachedOrders();
    const localOrders = await this._getLocalOrders();

    return { 
      success: true, 
      orders: [...cachedOrders, ...localOrders], 
      fromCache: true 
    };
  }

  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================

  async _addToSyncQueue(operation) {
    const queue = await this._getSyncQueue();
    queue.push(operation);
    await this._saveSyncQueue(queue);
  }

  async _getSyncQueue() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading sync queue:', error);
      return [];
    }
  }

  async _saveSyncQueue(queue) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  }

  async _processOperation(operation) {
    switch (operation.type) {
      case OPERATION_TYPES.ADD_PRODUCT:
        return await this._syncAddProduct(operation);
      case OPERATION_TYPES.UPDATE_PRODUCT:
        return await this._syncUpdateProduct(operation);
      case OPERATION_TYPES.DELETE_PRODUCT:
        return await this._syncDeleteProduct(operation);
      case OPERATION_TYPES.PLACE_ORDER:
        return await this._syncPlaceOrder(operation);
      case OPERATION_TYPES.UPDATE_ORDER_STATUS:
        return await this._syncUpdateOrderStatus(operation);
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  async _syncAddProduct(operation) {
    const { data } = operation;
    
    const formData = new FormData();
    formData.append('product_name', data.productName || data.product_name);
    formData.append('description', data.description || '');
    formData.append('price', String(data.price));
    formData.append('quantity', String(data.quantity));

    if (data.localImageUri) {
      const filename = data.localImageUri.split('/').pop();
      const fileType = filename.split('.').pop();
      
      formData.append('image', {
        uri: data.localImageUri,
        name: filename || 'product.jpg',
        type: `image/${fileType}` || 'image/jpeg',
      });
    }

    const response = await api.post('/farmer/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });

    // Remove from local products after successful sync
    await this._removeLocalProduct(operation.id);

    return response.data.data || response.data;
  }

  async _syncUpdateProduct(operation) {
    const { data } = operation;
    const response = await api.put(`/farmer/products/${data.productId}`, data);
    return response.data.data || response.data;
  }

  async _syncDeleteProduct(operation) {
    await api.delete(`/farmer/products/${operation.data.productId}`);
    await this._removeLocalProduct(operation.data.productId);
  }

  async _syncPlaceOrder(operation) {
    const response = await api.post('/orders', operation.data);
    await this._removeLocalOrder(operation.id);
    return response.data.data || response.data;
  }

  async _syncUpdateOrderStatus(operation) {
    const { data } = operation;
    const response = await api.patch(`/orders/${data.orderId}/status`, { 
      status: data.status 
    });
    return response.data.data || response.data;
  }

  // Local product storage
  async _saveLocalProduct(product, localId) {
    const products = await this._getLocalProducts();
    products.push({ ...product, id: localId, pendingSync: true });
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_PRODUCTS, JSON.stringify(products));
  }

  async _getLocalProducts() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_PRODUCTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  async _updateLocalProduct(productId, updateData) {
    const products = await this._getLocalProducts();
    const index = products.findIndex(p => p.id === productId);
    if (index !== -1) {
      products[index] = { ...products[index], ...updateData, pendingSync: true };
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_PRODUCTS, JSON.stringify(products));
    }
  }

  async _removeLocalProduct(productId) {
    const products = await this._getLocalProducts();
    const filtered = products.filter(p => p.id !== productId);
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_PRODUCTS, JSON.stringify(filtered));
  }

  async _markLocalProductDeleted(productId) {
    await this._updateLocalProduct(productId, { deleted: true });
  }

  // Local order storage
  async _saveLocalOrder(order, localId) {
    const orders = await this._getLocalOrders();
    orders.push({ ...order, id: localId, pendingSync: true });
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_ORDERS, JSON.stringify(orders));
  }

  async _getLocalOrders() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_ORDERS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  async _updateLocalOrder(orderId, updateData) {
    const orders = await this._getLocalOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      orders[index] = { ...orders[index], ...updateData };
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_ORDERS, JSON.stringify(orders));
    }
  }

  async _removeLocalOrder(orderId) {
    const orders = await this._getLocalOrders();
    const filtered = orders.filter(o => o.id !== orderId);
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_ORDERS, JSON.stringify(filtered));
  }

  // Cache operations
  async _cacheProduct(product) {
    const products = await this._getCachedProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index !== -1) {
      products[index] = product;
    } else {
      products.push(product);
    }
    await AsyncStorage.setItem(STORAGE_KEYS.CACHED_PRODUCTS, JSON.stringify(products));
  }

  async _cacheProducts(products) {
    await AsyncStorage.setItem(STORAGE_KEYS.CACHED_PRODUCTS, JSON.stringify(products));
  }

  async _getCachedProducts() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_PRODUCTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  async _cacheOrder(order) {
    const orders = await this._getCachedOrders();
    const index = orders.findIndex(o => o.id === order.id);
    if (index !== -1) {
      orders[index] = order;
    } else {
      orders.push(order);
    }
    await AsyncStorage.setItem(STORAGE_KEYS.CACHED_ORDERS, JSON.stringify(orders));
  }

  async _cacheOrders(orders) {
    await AsyncStorage.setItem(STORAGE_KEYS.CACHED_ORDERS, JSON.stringify(orders));
  }

  async _getCachedOrders() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_ORDERS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Clear all cached and pending data (for logout)
   */
  async clearAll() {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.PENDING_PRODUCTS,
      STORAGE_KEYS.PENDING_ORDERS,
      STORAGE_KEYS.PENDING_UPDATES,
      STORAGE_KEYS.CACHED_PRODUCTS,
      STORAGE_KEYS.CACHED_ORDERS,
      STORAGE_KEYS.SYNC_QUEUE,
      STORAGE_KEYS.LAST_SYNC_TIME,
    ]);
  }
}

// Create singleton instance
const offlineSyncManager = new OfflineSyncManager();

export default offlineSyncManager;
export { OfflineSyncManager, OPERATION_TYPES, PRIORITY };
