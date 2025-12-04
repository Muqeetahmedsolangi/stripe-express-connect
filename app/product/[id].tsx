import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import * as WebBrowser from 'expo-web-browser';
import { RootState } from '../../store';
import { Product } from '../../store/slices/productsSlice';
import paymentService from '../../services/paymentService';

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products } = useSelector((state: RootState) => state.products);
  
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const foundProduct = products.find(p => p.id === id);
    if (foundProduct) {
      setProduct(foundProduct);
    } else {
      Alert.alert('Product not found', 'This product could not be found.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  }, [id, products]);

  const handleDirectPurchase = async () => {
    if (!product) return;

    if (!product.inStock) {
      Toast.show({
        type: 'error',
        text1: 'Out of Stock ❌',
        text2: 'This product is currently unavailable',
        position: 'top',
      });
      return;
    }

    try {
      setIsProcessing(true);

      Toast.show({
        type: 'info',
        text1: 'Processing Payment 💳',
        text2: 'Creating Stripe payment intent...',
        position: 'top',
      });

      // Create payment intent
      const response = await paymentService.createPaymentIntent({
        productId: product.id,
        quantity,
      });

      const { paymentIntent, order } = response.data;

      // Create Stripe payment URL (for demo purposes)
      const stripeUrl = `https://checkout.stripe.com/pay/${paymentIntent.clientSecret}`;

      // Open Stripe payment in browser
      const result = await WebBrowser.openBrowserAsync(stripeUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
        controlsColor: '#007AFF',
      });

      if (result.type === 'dismiss') {
        Toast.show({
          type: 'info',
          text1: 'Payment Cancelled 🚫',
          text2: 'You can try again anytime',
          position: 'top',
        });
      } else {
        // Simulate successful payment
        Toast.show({
          type: 'success',
          text1: 'Payment Successful! 🎉',
          text2: `Purchased ${quantity} ${product.name}${quantity > 1 ? 's' : ''}`,
          position: 'top',
        });

        // Navigate back after successful purchase
        setTimeout(() => {
          router.back();
        }, 2000);
      }

    } catch (error: any) {
      console.error('Payment error:', error);
      Toast.show({
        type: 'error',
        text1: 'Payment Failed ❌',
        text2: error.message || 'Something went wrong',
        position: 'top',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading product...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Details</Text>
        </View>

        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Text style={styles.productEmoji}>{product.image || '📦'}</Text>
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <View style={styles.productHeader}>
            <View style={styles.productTitleSection}>
              <Text style={styles.productName}>{product.name}</Text>
              <View style={styles.ratingSection}>
                <Text style={styles.rating}>⭐ {product.rating}</Text>
                <Text style={styles.reviews}>({product.reviews} reviews)</Text>
              </View>
            </View>
            {!product.inStock && (
              <View style={styles.outOfStockBadge}>
                <Text style={styles.outOfStockText}>Out of Stock</Text>
              </View>
            )}
          </View>
          <Text style={styles.productPrice}>
            ${product.price.toFixed(2)} {product.currency}
          </Text>
          <View style={styles.categoryContainer}>
            <Text style={styles.categoryLabel}>Category:</Text>
            <Text style={styles.categoryValue}>{product.category}</Text>
          </View>
          <Text style={styles.productDescription}>{product.description}</Text>
        </View>

        {/* Product Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Product Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Product ID:</Text>
            <Text style={styles.detailValue}>{product.id}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Currency:</Text>
            <Text style={styles.detailValue}>{product.currency}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created:</Text>
            <Text style={styles.detailValue}>
              {new Date(product.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Quantity Selector */}
        <View style={styles.quantitySection}>
          <Text style={styles.sectionTitle}>Quantity</Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={[styles.quantityButton, quantity === 1 && styles.disabledButton]}
              onPress={decrementQuantity}
              disabled={quantity === 1}
            >
              <Text style={[styles.quantityButtonText, quantity === 1 && styles.disabledButtonText]}>
                -
              </Text>
            </TouchableOpacity>
            <View style={styles.quantityDisplay}>
              <Text style={styles.quantityText}>{quantity}</Text>
            </View>
            <TouchableOpacity style={styles.quantityButton} onPress={incrementQuantity}>
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.totalPrice}>
            Total: ${(product.price * quantity).toFixed(2)}
          </Text>
        </View>

        {/* Purchase Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.purchaseButton,
              (!product.inStock || isProcessing) && styles.disabledButton
            ]} 
            onPress={handleDirectPurchase}
            disabled={!product.inStock || isProcessing}
          >
            {isProcessing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.purchaseButtonText}>Processing...</Text>
              </View>
            ) : (
              <Text style={[
                styles.purchaseButtonText,
                !product.inStock && styles.disabledButtonText
              ]}>
                {!product.inStock 
                  ? '❌ Out of Stock' 
                  : `💳 Buy Now - $${(product.price * quantity).toFixed(2)}`
                }
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer spacing */}
        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  imageContainer: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 40,
    marginBottom: 20,
  },
  productEmoji: {
    fontSize: 120,
  },
  productInfo: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 20,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productTitleSection: {
    flex: 1,
  },
  productName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 16,
    color: '#FF8C00',
    fontWeight: '600',
  },
  reviews: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  outOfStockBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  outOfStockText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  categoryValue: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    backgroundColor: '#E8F4FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  productPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 16,
  },
  productDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  detailsSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  quantitySection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 20,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  quantityButtonText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  disabledButtonText: {
    color: '#999',
  },
  quantityDisplay: {
    marginHorizontal: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  buttonContainer: {
    padding: 20,
  },
  purchaseButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  purchaseButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  footer: {
    height: 20,
  },
});