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
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { Product } from '../../store/slices/productsSlice';
import { addToCart } from '../../store/slices/cartSlice';

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useDispatch();
  const { products } = useSelector((state: RootState) => state.products);
  
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const foundProduct = products.find(p => p.id === parseInt(id));
    if (foundProduct) {
      setProduct(foundProduct);
    } else {
      Alert.alert('Product not found', 'This product could not be found.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  }, [id, products]);

  const handleAddToCart = () => {
    if (!product) return;

    if (!product.inStock) {
      Alert.alert('Out of Stock', 'This product is currently unavailable.');
      return;
    }

    dispatch(addToCart({ product, quantity }));
    Alert.alert(
      'Added to Cart!', 
      `${quantity} ${product.title || product.name}${quantity > 1 ? 's' : ''} added to your cart.`,
      [
        { text: 'Continue Shopping', style: 'cancel' },
        { text: 'View Cart', onPress: () => router.push('/cart') }
      ]
    );
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
          <Text style={styles.productEmoji}>📦</Text>
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <View style={styles.productHeader}>
            <View style={styles.productTitleSection}>
              <Text style={styles.productName}>{product.title || product.name}</Text>
              {(product.rating || product.reviews) && (
                <View style={styles.ratingSection}>
                  <Text style={styles.rating}>⭐ {product.rating || 4.5}</Text>
                  <Text style={styles.reviews}>({product.reviews || 0} reviews)</Text>
                </View>
              )}
            </View>
            {product.inStock === false && (
              <View style={styles.outOfStockBadge}>
                <Text style={styles.outOfStockText}>Out of Stock</Text>
              </View>
            )}
          </View>
          <Text style={styles.productPrice}>
            ${typeof product.price === 'string' ? parseFloat(product.price).toFixed(2) : product.price.toFixed(2)} {product.currency || 'USD'}
          </Text>
          {product.category && (
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryLabel}>Category:</Text>
              <Text style={styles.categoryValue}>{product.category}</Text>
            </View>
          )}
          <Text style={styles.productDescription}>{product.description}</Text>
          {product.seller && (
            <View style={styles.sellerContainer}>
              <Text style={styles.sellerLabel}>Sold by:</Text>
              <Text style={styles.sellerName}>
                {product.seller.firstName} {product.seller.lastName}
              </Text>
            </View>
          )}
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
            <Text style={styles.detailValue}>{product.currency || 'USD'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created:</Text>
            <Text style={styles.detailValue}>
              {new Date(product.createdAt).toLocaleDateString()}
            </Text>
          </View>
          {product.sellerId && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Seller ID:</Text>
              <Text style={styles.detailValue}>{product.sellerId}</Text>
            </View>
          )}
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
            Total: ${(parseFloat(product.price.toString()) * quantity).toFixed(2)}
          </Text>
        </View>

        {/* Add to Cart Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.addToCartButton,
              product.inStock === false && styles.disabledButton
            ]} 
            onPress={handleAddToCart}
            disabled={product.inStock === false}
          >
            <Text style={[
              styles.addToCartButtonText,
              product.inStock === false && styles.disabledButtonText
            ]}>
              {product.inStock === false 
                ? '❌ Out of Stock' 
                : `🛒 Add ${quantity} to Cart - $${(parseFloat(product.price.toString()) * quantity).toFixed(2)}`
              }
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionalCheckoutButton}
            onPress={() => Alert.alert('Checkout (Optional)', 'Stripe integration is optional - items are saved in cart for demonstration.')}
          >
            <Text style={styles.optionalCheckoutText}>
              💳 Optional Stripe Checkout
            </Text>
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
  sellerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  sellerLabel: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  sellerName: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '600',
  },
  addToCartButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },
  addToCartButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  optionalCheckoutButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  optionalCheckoutText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    height: 20,
  },
});