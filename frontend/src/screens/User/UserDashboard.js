import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const UserDashboard = ({ navigation }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: logout },
    ]);
  };

  const categories = [
    { id: '1', name: 'Fresh Vegetables', icon: '🥬', source: 'farmer' },
    { id: '2', name: 'Fruits', icon: '🍎', source: 'farmer' },
    { id: '3', name: 'Grains', icon: '🌾', source: 'farmer' },
    { id: '4', name: 'Dairy Products', icon: '🥛', source: 'farmer' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Hello, {user?.name}! 👋</Text>
          <Text style={styles.subtitle}>What would you like to buy today?</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bannerContainer}>
        <View style={styles.banner}>
          <Text style={styles.bannerIcon}>🛒</Text>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Farm Fresh Products</Text>
            <Text style={styles.bannerSubtitle}>Buy directly from farmers</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.mainButton, { backgroundColor: '#2E7D32' }]}
          onPress={() => navigation.navigate('ProductList', { source: 'farmer' })}
        >
          <Text style={styles.buttonIcon}>🌾</Text>
          <Text style={styles.buttonTitle}>Browse Farmer Products</Text>
          <Text style={styles.buttonSubtitle}>Fresh from the farm</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainButton, { backgroundColor: '#1976D2' }]}
          onPress={() => navigation.navigate('OrderHistory')}
        >
          <Text style={styles.buttonIcon}>📦</Text>
          <Text style={styles.buttonTitle}>My Orders</Text>
          <Text style={styles.buttonSubtitle}>Track your purchases</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.categoriesContainer}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryCard}
              onPress={() => navigation.navigate('ProductList', { source: cat.source })}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={styles.categoryName}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Why AgroBuddy?</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>✅</Text>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoHeading}>Direct from Farmers</Text>
            <Text style={styles.infoText}>No middlemen, fair prices</Text>
          </View>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>🌱</Text>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoHeading}>Fresh & Quality</Text>
            <Text style={styles.infoText}>Farm fresh products daily</Text>
          </View>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>🤝</Text>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoHeading}>Support Local Farmers</Text>
            <Text style={styles.infoText}>Help farming communities grow</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  logoutText: {
    color: '#d32f2f',
    fontWeight: '600',
  },
  bannerContainer: {
    padding: 16,
  },
  banner: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  actionButtons: {
    paddingHorizontal: 16,
    gap: 12,
  },
  mainButton: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  buttonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  buttonSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  infoSection: {
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});

export default UserDashboard;
