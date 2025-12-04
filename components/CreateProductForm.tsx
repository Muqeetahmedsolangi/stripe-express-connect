import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { addProductStart, addProductSuccess, addProductFailure } from '../store/slices/productsSlice';
import { Product } from '../store/slices/productsSlice';

interface CreateProductFormProps {
  onProductCreated?: () => void;
}

const EMOJI_OPTIONS = ['📱', '💻', '🎧', '📚', '👕', '☕', '🎮', '📷', '⌚', '🛍️', '🏠', '🚗'];

export default function CreateProductForm({ onProductCreated }: CreateProductFormProps) {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state: RootState) => state.products);
  const { isConnected } = useSelector((state: RootState) => state.stripe);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'USD',
    image: '📦',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = 'Please enter a valid price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!isConnected) {
      Alert.alert('Bank Not Connected', 'Please connect your bank account before creating products.');
      return;
    }

    dispatch(addProductStart());

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newProduct: Product = {
        id: 'prod_' + Date.now(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        currency: formData.currency,
        image: formData.image,
        createdAt: new Date().toISOString(),
      };

      dispatch(addProductSuccess(newProduct));

      // Reset form
      setFormData({
        name: '',
        description: '',
        price: '',
        currency: 'USD',
        image: '📦',
      });

      Alert.alert('Success', 'Product created successfully!', [
        { text: 'OK', onPress: onProductCreated }
      ]);

    } catch (error) {
      dispatch(addProductFailure('Failed to create product'));
      Alert.alert('Error', 'Failed to create product. Please try again.');
    }
  };

  const selectEmoji = (emoji: string) => {
    setFormData(prev => ({ ...prev, image: emoji }));
  };

  if (!isConnected) {
    return (
      <View style={styles.notConnectedContainer}>
        <Text style={styles.notConnectedIcon}>🏦</Text>
        <Text style={styles.notConnectedTitle}>Bank Account Required</Text>
        <Text style={styles.notConnectedDescription}>
          You need to connect your bank account with Stripe Express before you can create products.
        </Text>
        <Text style={styles.notConnectedInstruction}>
          Please connect your bank account first, then come back here to create your products.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Create New Product</Text>

        {/* Emoji Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Icon</Text>
          <View style={styles.emojiContainer}>
            {EMOJI_OPTIONS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[
                  styles.emojiOption,
                  formData.image === emoji && styles.selectedEmoji
                ]}
                onPress={() => selectEmoji(emoji)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Product Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="Enter product name"
            placeholderTextColor="#999"
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea, errors.description && styles.inputError]}
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            placeholder="Describe your product"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        </View>

        {/* Price */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Price ({formData.currency}) *</Text>
          <TextInput
            style={[styles.input, errors.price && styles.inputError]}
            value={formData.price}
            onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
            placeholder="0.00"
            placeholderTextColor="#999"
            keyboardType="decimal-pad"
          />
          {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.submitButtonText}>Creating...</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>Create Product</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  textArea: {
    minHeight: 100,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
  },
  emojiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiOption: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedEmoji: {
    borderColor: '#007AFF',
    backgroundColor: '#E8F4FF',
  },
  emojiText: {
    fontSize: 24,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notConnectedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f5f5f5',
  },
  notConnectedIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  notConnectedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  notConnectedDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  notConnectedInstruction: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});