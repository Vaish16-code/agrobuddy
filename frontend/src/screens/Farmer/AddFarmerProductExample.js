/**
 * Example: AddFarmerProduct with Offline-First Algorithm
 * 
 * This file demonstrates how to integrate the offline sync algorithm
 * into your existing AddFarmerProduct screen.
 * 
 * Copy the relevant parts to your actual AddFarmerProduct.js file.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// Import the offline sync hooks
import { useOfflineSync, useFarmerProducts } from '../../services/useOfflineSync';
import SyncStatusIndicator, { SyncStatusBanner } from '../../components/SyncStatusIndicator';

const AddFarmerProductWithOfflineSync = ({ navigation }) => {
  // Form state
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [image, setImage] = useState(null);

  // Use the offline sync hooks
  const { isOnline, pendingCount, syncNow } = useOfflineSync();
  const { addProduct, loading, error } = useFarmerProducts();

  // Pick image
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Submit product with offline support
  const handleSubmit = async () => {
    // Validation
    if (!productName || !price || !quantity) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Use the offline-aware addProduct function
    const result = await addProduct(
      {
        productName,
        description,
        price: parseFloat(price),
        quantity: parseInt(quantity),
      },
      image // Pass the local image URI
    );

    if (result.success) {
      if (result.wasOffline) {
        // Product was saved offline
        Alert.alert(
          '📱 Saved Offline',
          'Your product has been saved locally and will be uploaded automatically when you have internet connection.',
          [
            { 
              text: 'OK', 
              onPress: () => navigation.goBack() 
            }
          ]
        );
      } else {
        // Product was synced immediately
        Alert.alert(
          '✅ Success',
          'Product added successfully!',
          [
            { 
              text: 'OK', 
              onPress: () => navigation.goBack() 
            }
          ]
        );
      }
    } else {
      Alert.alert('Error', result.error || 'Failed to add product');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Show sync status banner */}
      <SyncStatusBanner />
      
      {/* Network status indicator */}
      <View style={styles.statusRow}>
        <SyncStatusIndicator showDetails />
      </View>

      <View style={styles.form}>
        {/* Image Picker */}
        <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imageIcon}>📷</Text>
              <Text style={styles.imagePlaceholderText}>Add Product Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Product Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>🌾 Product Name *</Text>
          <TextInput
            style={styles.input}
            value={productName}
            onChangeText={setProductName}
            placeholder="e.g., Fresh Tomatoes"
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>📝 Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your product quality, farming method, etc."
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Price and Quantity */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>💰 Price (₹/kg) *</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="50"
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>⚖️ Quantity (kg) *</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="100"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Offline indicator message */}
        {!isOnline && (
          <View style={styles.offlineMessage}>
            <Text style={styles.offlineMessageText}>
              📵 You're offline. Don't worry - your product will be saved locally 
              and automatically uploaded when you're back online!
            </Text>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            loading && styles.submitButtonDisabled,
            !isOnline && styles.offlineButton
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isOnline ? '➕ Add Product' : '💾 Save Offline'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Pending sync info */}
        {pendingCount > 0 && (
          <View style={styles.pendingInfo}>
            <Text style={styles.pendingText}>
              ⏳ You have {pendingCount} item(s) waiting to sync
            </Text>
            {isOnline && (
              <TouchableOpacity onPress={syncNow}>
                <Text style={styles.syncNowText}>Sync Now →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  statusRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  form: {
    padding: 16,
  },
  imageContainer: {
    height: 200,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#C8E6C9',
    borderStyle: 'dashed',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  offlineMessage: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  offlineMessageText: {
    color: '#E65100',
    fontSize: 13,
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  offlineButton: {
    backgroundColor: '#FF9800',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  pendingInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  pendingText: {
    color: '#1565C0',
    fontSize: 13,
  },
  syncNowText: {
    color: '#1565C0',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default AddFarmerProductWithOfflineSync;
