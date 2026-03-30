/**
 * Buyer Match Card Component
 * Displays matched buyer/trader information with score breakdown
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Animated,
} from 'react-native';

/**
 * Score Badge Component
 */
const ScoreBadge = ({ score, size = 'medium' }) => {
  const getScoreColor = () => {
    if (score >= 80) return '#4CAF50'; // Green - Excellent
    if (score >= 60) return '#8BC34A'; // Light green - Good
    if (score >= 40) return '#FF9800'; // Orange - Fair
    return '#F44336'; // Red - Low
  };

  const getScoreLabel = () => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Low';
  };

  const sizes = {
    small: { width: 40, height: 40, fontSize: 12, labelSize: 8 },
    medium: { width: 60, height: 60, fontSize: 18, labelSize: 10 },
    large: { width: 80, height: 80, fontSize: 24, labelSize: 12 },
  };

  const s = sizes[size];

  return (
    <View style={[styles.scoreBadge, { 
      width: s.width, 
      height: s.width,
      backgroundColor: getScoreColor() 
    }]}>
      <Text style={[styles.scoreText, { fontSize: s.fontSize }]}>{score}%</Text>
      <Text style={[styles.scoreLabel, { fontSize: s.labelSize }]}>{getScoreLabel()}</Text>
    </View>
  );
};

/**
 * Score Breakdown Bar
 */
const ScoreBar = ({ label, value, icon }) => {
  const getBarColor = () => {
    if (value >= 80) return '#4CAF50';
    if (value >= 60) return '#8BC34A';
    if (value >= 40) return '#FF9800';
    return '#F44336';
  };

  return (
    <View style={styles.scoreBarContainer}>
      <View style={styles.scoreBarHeader}>
        <Text style={styles.scoreBarIcon}>{icon}</Text>
        <Text style={styles.scoreBarLabel}>{label}</Text>
        <Text style={styles.scoreBarValue}>{value}%</Text>
      </View>
      <View style={styles.scoreBarTrack}>
        <View 
          style={[
            styles.scoreBarFill, 
            { width: `${value}%`, backgroundColor: getBarColor() }
          ]} 
        />
      </View>
    </View>
  );
};

/**
 * Main Buyer Match Card
 */
const BuyerMatchCard = ({ 
  buyer, 
  onContact, 
  onViewDetails,
  showDetails = false,
  compact = false 
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleCall = () => {
    if (buyer.phone) {
      Linking.openURL(`tel:${buyer.phone}`);
    } else {
      Alert.alert('Contact', 'Phone number not available');
    }
  };

  const handleWhatsApp = () => {
    if (buyer.phone) {
      const phoneNumber = buyer.phone.replace(/[^0-9]/g, '');
      const message = encodeURIComponent(
        `Hi, I'm interested in selling my agricultural products through AgroBuddy. Can we discuss?`
      );
      Linking.openURL(`whatsapp://send?phone=${phoneNumber}&text=${message}`);
    }
  };

  const handleContactBuyer = () => {
    Alert.alert(
      `Contact ${buyer.name}`,
      'How would you like to contact this buyer?',
      [
        { text: 'Call', onPress: handleCall },
        { text: 'WhatsApp', onPress: handleWhatsApp },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  if (compact) {
    return (
      <TouchableOpacity 
        style={styles.compactCard}
        onPress={() => onViewDetails && onViewDetails(buyer)}
      >
        <View style={styles.compactLeft}>
          <ScoreBadge score={buyer.matchPercentage} size="small" />
        </View>
        <View style={styles.compactRight}>
          <Text style={styles.compactName} numberOfLines={1}>{buyer.name}</Text>
          <Text style={styles.compactInfo}>
            {buyer.businessType} • {buyer.logistics?.distanceKm || '?'} km
          </Text>
        </View>
        <TouchableOpacity style={styles.compactContactBtn} onPress={handleContactBuyer}>
          <Text style={styles.compactContactText}>📞</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.nameRow}>
            <Text style={styles.buyerName}>{buyer.name}</Text>
            {buyer.isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verified</Text>
              </View>
            )}
          </View>
          <Text style={styles.businessType}>{buyer.businessType}</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.rating}>⭐ {buyer.rating?.toFixed(1) || 'N/A'}</Text>
            <Text style={styles.transactions}>
              • {buyer.completedTransactions || 0} transactions
            </Text>
          </View>
        </View>
        <ScoreBadge score={buyer.matchPercentage} />
      </View>

      {/* Match Reason */}
      {buyer.matchReason && (
        <View style={styles.matchReasonContainer}>
          <Text style={styles.matchReasonText}>💡 {buyer.matchReason}</Text>
        </View>
      )}

      {/* Logistics Info */}
      <View style={styles.logisticsContainer}>
        <View style={styles.logisticsItem}>
          <Text style={styles.logisticsIcon}>📍</Text>
          <Text style={styles.logisticsValue}>{buyer.logistics?.distanceKm || '?'} km</Text>
          <Text style={styles.logisticsLabel}>Distance</Text>
        </View>
        <View style={styles.logisticsItem}>
          <Text style={styles.logisticsIcon}>🚚</Text>
          <Text style={styles.logisticsValue}>{buyer.logistics?.estimatedDeliveryTime || '?'}</Text>
          <Text style={styles.logisticsLabel}>Delivery</Text>
        </View>
        <View style={styles.logisticsItem}>
          <Text style={styles.logisticsIcon}>💰</Text>
          <Text style={styles.logisticsValue}>₹{buyer.logistics?.transportCost || '?'}</Text>
          <Text style={styles.logisticsLabel}>Transport</Text>
        </View>
        <View style={styles.logisticsItem}>
          <Text style={styles.logisticsIcon}>📈</Text>
          <Text style={[styles.logisticsValue, styles.profitText]}>
            ₹{buyer.logistics?.estimatedProfit || '?'}
          </Text>
          <Text style={styles.logisticsLabel}>Est. Profit</Text>
        </View>
      </View>

      {/* Budget Range */}
      <View style={styles.budgetContainer}>
        <Text style={styles.budgetLabel}>Budget Range:</Text>
        <Text style={styles.budgetValue}>
          ₹{buyer.budgetRange?.min || '?'} - ₹{buyer.budgetRange?.max || '?'} per kg
        </Text>
      </View>

      {/* Expandable Score Breakdown */}
      <TouchableOpacity 
        style={styles.expandButton}
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={styles.expandButtonText}>
          {expanded ? '▲ Hide Score Details' : '▼ View Score Details'}
        </Text>
      </TouchableOpacity>

      {expanded && buyer.scoreBreakdown && (
        <View style={styles.scoreBreakdownContainer}>
          <ScoreBar 
            label="Demand Match" 
            value={buyer.scoreBreakdown.demandMatch} 
            icon="🎯"
          />
          <ScoreBar 
            label="Distance" 
            value={buyer.scoreBreakdown.distance} 
            icon="📍"
          />
          <ScoreBar 
            label="Price Fit" 
            value={buyer.scoreBreakdown.priceCompatibility} 
            icon="💵"
          />
          <ScoreBar 
            label="Reliability" 
            value={buyer.scoreBreakdown.reliability} 
            icon="⭐"
          />
          <ScoreBar 
            label="Quantity" 
            value={buyer.scoreBreakdown.quantityMatch} 
            icon="📦"
          />
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.contactButton]}
          onPress={handleContactBuyer}
        >
          <Text style={styles.contactButtonText}>📞 Contact Buyer</Text>
        </TouchableOpacity>
        {onViewDetails && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.detailsButton]}
            onPress={() => onViewDetails(buyer)}
          >
            <Text style={styles.detailsButtonText}>View Details</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

/**
 * Match Summary Statistics
 */
export const MatchSummary = ({ stats }) => {
  if (!stats) return null;

  return (
    <View style={styles.summaryContainer}>
      <Text style={styles.summaryTitle}>📊 Match Summary</Text>
      <View style={styles.summaryGrid}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{stats.totalMatches}</Text>
          <Text style={styles.summaryLabel}>Total Matches</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
            {stats.excellentMatches}
          </Text>
          <Text style={styles.summaryLabel}>Excellent</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#8BC34A' }]}>
            {stats.goodMatches}
          </Text>
          <Text style={styles.summaryLabel}>Good</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{stats.averageMatchScore}%</Text>
          <Text style={styles.summaryLabel}>Avg Score</Text>
        </View>
      </View>
      
      {stats.bestMatch && (
        <View style={styles.bestMatchContainer}>
          <Text style={styles.bestMatchTitle}>🏆 Best Match</Text>
          <Text style={styles.bestMatchName}>{stats.bestMatch.name}</Text>
          <Text style={styles.bestMatchScore}>
            {stats.bestMatch.matchPercentage}% match
          </Text>
        </View>
      )}
    </View>
  );
};

/**
 * No Matches Found Component
 */
export const NoMatchesFound = ({ onRefresh }) => (
  <View style={styles.noMatchesContainer}>
    <Text style={styles.noMatchesIcon}>🔍</Text>
    <Text style={styles.noMatchesTitle}>No Matches Found</Text>
    <Text style={styles.noMatchesText}>
      We couldn't find any buyers matching your product criteria.
      Try adjusting your price or quantity.
    </Text>
    {onRefresh && (
      <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
        <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  // Score Badge
  scoreBadge: {
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  scoreText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  scoreLabel: {
    color: '#FFFFFF',
    fontWeight: '500',
    marginTop: 2,
  },

  // Score Bar
  scoreBarContainer: {
    marginBottom: 10,
  },
  scoreBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  scoreBarIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  scoreBarLabel: {
    flex: 1,
    fontSize: 12,
    color: '#666',
  },
  scoreBarValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  scoreBarTrack: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  buyerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  verifiedBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
  },
  businessType: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rating: {
    fontSize: 13,
    color: '#FF9800',
    fontWeight: '500',
  },
  transactions: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },

  // Match Reason
  matchReasonContainer: {
    backgroundColor: '#FFF8E1',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  matchReasonText: {
    fontSize: 13,
    color: '#F57C00',
    fontWeight: '500',
  },

  // Logistics
  logisticsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  logisticsItem: {
    alignItems: 'center',
  },
  logisticsIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  logisticsValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  logisticsLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  profitText: {
    color: '#4CAF50',
  },

  // Budget
  budgetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 8,
  },
  budgetValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },

  // Expand Button
  expandButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  expandButtonText: {
    fontSize: 13,
    color: '#2196F3',
    fontWeight: '500',
  },

  // Score Breakdown
  scoreBreakdownContainer: {
    backgroundColor: '#FAFAFA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  contactButton: {
    backgroundColor: '#4CAF50',
    flex: 2,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  detailsButton: {
    backgroundColor: '#F5F5F5',
    flex: 1,
  },
  detailsButtonText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
  },

  // Compact Card
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  compactLeft: {
    marginRight: 12,
  },
  compactRight: {
    flex: 1,
  },
  compactName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  compactInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  compactContactBtn: {
    padding: 8,
  },
  compactContactText: {
    fontSize: 20,
  },

  // Summary
  summaryContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  bestMatchContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  bestMatchTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  bestMatchName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  bestMatchScore: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },

  // No Matches
  noMatchesContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noMatchesIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  noMatchesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  noMatchesText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  refreshButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default BuyerMatchCard;
