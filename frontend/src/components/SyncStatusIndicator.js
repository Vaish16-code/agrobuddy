/**
 * AgroBuddy - Sync Status Indicator Component
 * 
 * Shows the user their connection status and pending sync items.
 * Visual indicator for rural farmers to know:
 * - If they're online/offline
 * - How many items are waiting to sync
 * - When sync is in progress
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useOfflineSync } from '../services/useOfflineSync';

const SyncStatusIndicator = ({ style, showDetails = false }) => {
  const { isOnline, isSyncing, pendingCount, syncNow } = useOfflineSync();

  // Don't show anything if online and no pending items
  if (isOnline && pendingCount === 0 && !showDetails) {
    return null;
  }

  const getStatusColor = () => {
    if (isSyncing) return '#2196F3'; // Blue - syncing
    if (!isOnline) return '#FF9800'; // Orange - offline
    if (pendingCount > 0) return '#4CAF50'; // Green - online with pending
    return '#4CAF50'; // Green - all synced
  };

  const getStatusIcon = () => {
    if (isSyncing) return '🔄';
    if (!isOnline) return '📵';
    if (pendingCount > 0) return '⏳';
    return '✅';
  };

  const getStatusText = () => {
    if (isSyncing) return 'Syncing...';
    if (!isOnline) return 'Offline Mode';
    if (pendingCount > 0) return `${pendingCount} pending`;
    return 'All synced';
  };

  const handlePress = () => {
    if (isOnline && pendingCount > 0 && !isSyncing) {
      syncNow();
    }
  };

  return (
    <TouchableOpacity 
      onPress={handlePress} 
      activeOpacity={0.8}
      disabled={!isOnline || isSyncing || pendingCount === 0}
    >
      <View style={[styles.container, { backgroundColor: getStatusColor() }, style]}>
        <Text style={styles.icon}>{getStatusIcon()}</Text>
        <Text style={styles.text}>{getStatusText()}</Text>
        
        {isOnline && pendingCount > 0 && !isSyncing && (
          <Text style={styles.tapText}>Tap to sync</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

/**
 * Detailed sync status banner for dashboard screens
 */
export const SyncStatusBanner = () => {
  const { isOnline, isSyncing, pendingCount, syncNow, getSyncDetails } = useOfflineSync();
  const [details, setDetails] = React.useState(null);
  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => {
    loadDetails();
  }, [pendingCount]);

  const loadDetails = async () => {
    const status = await getSyncDetails();
    setDetails(status);
  };

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <TouchableOpacity 
        style={styles.bannerHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.8}
      >
        <View style={styles.bannerLeft}>
          <View style={[
            styles.statusDot, 
            { backgroundColor: isOnline ? '#4CAF50' : '#FF9800' }
          ]} />
          <Text style={styles.bannerText}>
            {!isOnline ? '📵 Offline Mode' : `⏳ ${pendingCount} items pending sync`}
          </Text>
        </View>
        <Text style={styles.expandIcon}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.bannerDetails}>
          {!isOnline && (
            <Text style={styles.detailText}>
              Don't worry! Your changes are saved locally and will sync automatically when you're back online.
            </Text>
          )}

          {details && details.pendingOperations?.length > 0 && (
            <View style={styles.operationsList}>
              <Text style={styles.detailTitle}>Pending Operations:</Text>
              {details.pendingOperations.slice(0, 5).map((op, index) => (
                <View key={op.id} style={styles.operationItem}>
                  <Text style={styles.operationType}>
                    {op.type.replace(/_/g, ' ')}
                  </Text>
                  <Text style={[
                    styles.operationStatus,
                    op.status === 'failed' && styles.failedStatus
                  ]}>
                    {op.status} {op.retryCount > 0 && `(retry ${op.retryCount})`}
                  </Text>
                </View>
              ))}
              {details.pendingOperations.length > 5 && (
                <Text style={styles.moreText}>
                  +{details.pendingOperations.length - 5} more...
                </Text>
              )}
            </View>
          )}

          {details?.lastSyncTime && (
            <Text style={styles.lastSync}>
              Last sync: {new Date(details.lastSyncTime).toLocaleString()}
            </Text>
          )}

          {isOnline && pendingCount > 0 && (
            <TouchableOpacity 
              style={styles.syncButton}
              onPress={syncNow}
              disabled={isSyncing}
            >
              <Text style={styles.syncButtonText}>
                {isSyncing ? '🔄 Syncing...' : '⬆️ Sync Now'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

/**
 * Mini indicator for header/navbar
 */
export const SyncStatusMini = () => {
  const { isOnline, isSyncing, pendingCount } = useOfflineSync();

  return (
    <View style={styles.miniContainer}>
      {isSyncing ? (
        <Text style={styles.miniIcon}>🔄</Text>
      ) : !isOnline ? (
        <Text style={styles.miniIcon}>📵</Text>
      ) : pendingCount > 0 ? (
        <View style={styles.miniBadge}>
          <Text style={styles.miniBadgeText}>{pendingCount}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  icon: {
    fontSize: 14,
    marginRight: 6,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  tapText: {
    color: '#FFFFFF',
    fontSize: 11,
    marginLeft: 8,
    opacity: 0.8,
  },

  // Banner styles
  banner: {
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  bannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
  },
  expandIcon: {
    color: '#E65100',
    fontSize: 12,
  },
  bannerDetails: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#FFE0B2',
  },
  detailText: {
    fontSize: 13,
    color: '#5D4037',
    marginTop: 8,
    lineHeight: 18,
  },
  detailTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5D4037',
    marginTop: 8,
    marginBottom: 4,
  },
  operationsList: {
    marginTop: 4,
  },
  operationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0B2',
  },
  operationType: {
    fontSize: 12,
    color: '#5D4037',
    textTransform: 'capitalize',
  },
  operationStatus: {
    fontSize: 12,
    color: '#FF9800',
    textTransform: 'capitalize',
  },
  failedStatus: {
    color: '#F44336',
  },
  moreText: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4,
    fontStyle: 'italic',
  },
  lastSync: {
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 8,
  },
  syncButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 12,
    alignItems: 'center',
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },

  // Mini styles
  miniContainer: {
    marginRight: 12,
  },
  miniIcon: {
    fontSize: 18,
  },
  miniBadge: {
    backgroundColor: '#FF9800',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  miniBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default SyncStatusIndicator;
