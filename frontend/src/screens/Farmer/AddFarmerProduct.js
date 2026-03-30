import React, { useState } from 'react';
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
import { farmerProductsAPI } from '../../services/api';

const AddFarmerProduct = ({ navigation }) => {
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to add product photos');
        return;
      }

      // Show action sheet for image source
      Alert.alert(
        'Select Image',
        'Choose an option',
        [
          { text: 'Camera', onPress: () => openCamera() },
          { text: 'Gallery', onPress: () => openGallery() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } catch (error) {
      console.log('Image picker permission error:', error);
      Alert.alert('Error', 'Failed to open image picker');
    }
  };

  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera permissions');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
        console.log('Camera image selected:', result.assets[0].uri);
      }
    } catch (error) {
      console.log('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const openGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        exif: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
        console.log('Gallery image selected:', result.assets[0].uri);
      }
    } catch (error) {
      console.log('Gallery error:', error);
      Alert.alert('Error', 'Failed to select image from gallery');
    }
  };

  const handleSubmit = async () => {
    if (!productName || !price || !quantity) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('product_name', productName);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('quantity', quantity);

      if (image) {
        console.log('Adding image to formData:', image);
        const filename = image.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        // For React Native, we need to create a proper file object
        const imageFile = {
          uri: image,
          name: filename || 'product_image.jpg',
          type: type,
        };
        
        formData.append('image', imageFile);
        console.log('Image added to formData:', imageFile);
      }

      console.log('Submitting product data...');
      const response = await farmerProductsAPI.add(formData);

      if (response.data.success) {
        Alert.alert('Success', 'Product added successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        console.log('API Error:', response.data);
        Alert.alert('Error', response.data.message || 'Failed to add product');
      }
    } catch (error) {
      console.log('Error adding product:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add product';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
        {image ? (
          <View style={styles.imageWrapper}>
            <Image source={{ uri: image }} style={styles.image} />
            <TouchableOpacity 
              style={styles.removeImageButton} 
              onPress={() => setImage(null)}
            >
              <Text style={styles.removeImageText}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imageIcon}>📷</Text>
            <Text style={styles.imageText}>Tap to add image</Text>
            <Text style={styles.imageSubText}>Camera or Gallery</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Product Name *</Text>
        <TextInput
          style={styles.input}
          value={productName}
          onChangeText={setProductName}
          placeholder="e.g., Fresh Tomatoes"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe your product..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Price (₹) *</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="0.00"
            placeholderTextColor="#999"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>Quantity *</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            placeholder="0"
            placeholderTextColor="#999"
            keyboardType="number-pad"
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Add Product</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },
  imageContainer: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  imageWrapper: {
    position: 'relative',
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2E7D32',
    borderStyle: 'dashed',
  },
  imageIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  imageText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
  },
  imageSubText: {
    color: '#2E7D32',
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  button: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AddFarmerProduct;
