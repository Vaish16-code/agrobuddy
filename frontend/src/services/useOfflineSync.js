/**
 * AgroBuddy - useOfflineSync Hook
 * 
 * A React hook that provides easy access to the offline sync functionality.
 * Use this hook in your components to:
 * - Check online/offline status
 * - Add products with offline support
 * - Place orders with offline support
 * - Get pending sync count
 * - Manually trigger sync
 */

import { useState, useEffect, useCallback } from 'react';
import offlineSyncManager from './offlineSync';

/**
 * Main hook for offline sync functionality
 */
export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState(null);

  useEffect(() => {
    // Initialize the sync manager
    offlineSyncManager.initialize();

    // Subscribe to network changes
    const unsubscribeNetwork = offlineSyncManager.onNetworkChange((online) => {
      setIsOnline(online);
    });

    // Subscribe to sync changes
    const unsubscribeSync = offlineSyncManager.onSyncChange(({ syncing, results }) => {
      setIsSyncing(syncing);
      if (results) {
        setSyncStatus(results);
      }
    });

    // Get initial pending count
    updatePendingCount();

    // Set up periodic pending count update
    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      unsubscribeNetwork();
      unsubscribeSync();
      clearInterval(interval);
    };
  }, []);

  const updatePendingCount = async () => {
    const count = await offlineSyncManager.getPendingCount();
    setPendingCount(count);
  };

  // Sync all pending operations
  const syncNow = useCallback(async () => {
    const result = await offlineSyncManager.syncAll();
    await updatePendingCount();
    return result;
  }, []);

  // Get detailed sync status
  const getSyncDetails = useCallback(async () => {
    return await offlineSyncManager.getSyncStatus();
  }, []);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    syncStatus,
    syncNow,
    getSyncDetails,
  };
};

/**
 * Hook for farmer product operations with offline support
 */
export const useFarmerProducts = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Add a new product (works offline)
  const addProduct = useCallback(async (productData, imageUri) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await offlineSyncManager.addProduct(productData, imageUri);
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Update a product (works offline)
  const updateProduct = useCallback(async (productId, updateData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await offlineSyncManager.updateProduct(productId, updateData);
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a product (works offline)
  const deleteProduct = useCallback(async (productId) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await offlineSyncManager.deleteProduct(productId);
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get products (from cache if offline)
  const getProducts = useCallback(async (farmerId = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await offlineSyncManager.getProducts(farmerId);
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message, products: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    addProduct,
    updateProduct,
    deleteProduct,
    getProducts,
    loading,
    error,
  };
};

/**
 * Hook for order operations with offline support
 */
export const useOrders = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Place an order (works offline)
  const placeOrder = useCallback(async (orderData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await offlineSyncManager.placeOrder(orderData);
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Update order status (works offline)
  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await offlineSyncManager.updateOrderStatus(orderId, newStatus);
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get orders (from cache if offline)
  const getOrders = useCallback(async (userId, type = 'purchases') => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await offlineSyncManager.getOrders(userId, type);
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message, orders: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    placeOrder,
    updateOrderStatus,
    getOrders,
    loading,
    error,
  };
};

export default useOfflineSync;
