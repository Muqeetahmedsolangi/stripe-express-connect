import { StripeProvider, initPaymentSheet, presentPaymentSheet, useStripe } from '@stripe/stripe-react-native';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { ordersApi } from '@/repository/ordersApi';
import { RootState } from '@/store';
import { clearCart } from '@/store/slices/cartSlice';
import { parsePrice } from '@/utils/priceUtils';

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY as string || "pk_test_51Pacl7D14xfJoKMAjaiJywsdOO811qnPzP7W47r0kW08u3cQJIG8kbd0OZfz7nbaL2ZMycR5jmuL6baxhRVgx4tA00OWNiJXQ7";

export default function MobileCheckout() {
  const stripeProps = Platform.OS !== 'web' ? {
    publishableKey: STRIPE_PUBLISHABLE_KEY,
    merchantIdentifier: "merchant.com.yourstore",
    urlScheme: "stripeexpressconnect"
  } : {
    publishableKey: STRIPE_PUBLISHABLE_KEY
  };

  return (
    <StripeProvider {...stripeProps}>
      <CheckoutContent />
    </StripeProvider>
  );
}

function CheckoutContent() {
  const dispatch = useDispatch();
  const stripe = useStripe();
  const { items, totalItems, totalPrice } = useSelector((state: RootState) => state.cart);
  const { user } = useSelector((state: RootState) => state.auth);

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSheetReady, setPaymentSheetReady] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [breakdown, setBreakdown] = useState({
    subtotal: 0,
    governmentTax: 0,
    platformFee: 0,
    total: 0,
  });

  useEffect(() => {
    if (items.length === 0) {
      Alert.alert(
        'Empty Cart',
        'Your cart is empty. Add some items before checking out.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return;
    }

    // Calculate pricing breakdown
    const subtotal = totalPrice;
    const governmentTax = subtotal * 0.0725; // 7.25%
    const platformFee = subtotal * 0.0325; // 3.25%
    const total = subtotal + governmentTax + platformFee;

    setBreakdown({
      subtotal: Math.round(subtotal * 100) / 100,
      governmentTax: Math.round(governmentTax * 100) / 100,
      platformFee: Math.round(platformFee * 100) / 100,
      total: Math.round(total * 100) / 100,
    });

    // Initialize payment sheet only if we have items
    if (items.length > 0) {
      initializePaymentSheet();
    }
  }, [items, totalPrice]);

  const initializePaymentSheet = async () => {
    try {
      // Check if we have valid items
      if (!items || items.length === 0) {
        console.log('No items in cart, skipping payment initialization');
        return;
      }

      // Validate all items have proper product IDs
      const invalidItems = items.filter(item => !item.product || !item.product.id);
      if (invalidItems.length > 0) {
        console.log('Invalid items found:', invalidItems);
        Alert.alert(
          'Cart Error',
          'Some items in your cart are invalid. Please remove them and try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Prepare items for backend
      const backendItems = items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      // Create payment intent with backend
      const paymentIntentResponse = await ordersApi.createPaymentIntent({
        items: backendItems,
      });

      if (paymentIntentResponse.status !== 'success' || !paymentIntentResponse.data) {
        throw new Error(paymentIntentResponse.message || 'Failed to create payment intent');
      }

      const { clientSecret: secret, paymentIntentId: intentId } = paymentIntentResponse.data;
      setClientSecret(secret);
      setPaymentIntentId(intentId);

      // Initialize the payment sheet
      const { error } = await initPaymentSheet({
        merchantDisplayName: 'Your Store',
        paymentIntentClientSecret: secret,
        defaultBillingDetails: {
          name: `${user?.firstName} ${user?.lastName}`,
          email: user?.email,
        },
        allowsDelayedPaymentMethods: true,
        returnURL: 'stripeexpressconnect://stripe-redirect',
      });

      if (error) {
        console.error('Payment sheet initialization error:', error);
      } else {
        setPaymentSheetReady(true);
      }
    } catch (error: any) {
      console.error('Payment initialization error:', error);
      Alert.alert(
        'Payment Setup Failed',
        error.message || 'Unable to setup payment. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handlePayment = async () => {
    if (!paymentSheetReady) {
      Alert.alert('Error', 'Payment is not ready. Please wait and try again.');
      return;
    }

    setIsProcessing(true);

    try {
      // Present the payment sheet
      const { error } = await presentPaymentSheet();

      if (error) {
        // User cancelled or payment failed
        if (error.code !== 'Canceled') {
          Alert.alert('Payment Failed', error.message || 'Something went wrong. Please try again.');
        }
        return;
      }

      // Payment successful! Confirm with backend
      const confirmResponse = await ordersApi.confirmPayment({
        paymentIntentId,
      });

      if (confirmResponse.status === 'success') {
        // Success! Clear cart and show success
        dispatch(clearCart());
        
        Alert.alert(
          'Payment Successful! 🎉',
          `Your order has been confirmed. Order total: $${breakdown.total.toFixed(2)}`,
          [
            {
              text: 'View Order',
              onPress: () => router.push(`/order/${confirmResponse.data?.order.id}`),
            },
            {
              text: 'Continue Shopping',
              style: 'cancel',
              onPress: () => router.push('/'),
            },
          ]
        );
      } else {
        throw new Error(confirmResponse.message || 'Failed to confirm payment');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      Alert.alert(
        'Payment Failed',
        error.message || 'Something went wrong. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const renderOrderSummary = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Order Summary</Text>
      
      {items.map((item) => (
        <View key={item.id} style={styles.orderItem}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.product.title || item.product.name}
            </Text>
            <Text style={styles.itemDetails}>
              ${parsePrice(item.product.price).toFixed(2)} × {item.quantity}
            </Text>
          </View>
          <Text style={styles.itemTotal}>
            ${(parsePrice(item.product.price) * item.quantity).toFixed(2)}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderPriceBreakdown = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Price Breakdown</Text>
      
      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Subtotal ({totalItems} items)</Text>
        <Text style={styles.priceValue}>${breakdown.subtotal.toFixed(2)}</Text>
      </View>
      
      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Government Tax (7.25%)</Text>
        <Text style={styles.priceValue}>${breakdown.governmentTax.toFixed(2)}</Text>
      </View>
      
      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Platform Fee (3.25%)</Text>
        <Text style={styles.priceValue}>${breakdown.platformFee.toFixed(2)}</Text>
      </View>
      
      <View style={[styles.priceRow, styles.totalRow]}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>${breakdown.total.toFixed(2)}</Text>
      </View>
    </View>
  );

  const renderPaymentSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Payment</Text>
      
      <View style={styles.paymentContainer}>
        <Text style={styles.paymentIcon}>🔒</Text>
        <Text style={styles.paymentTitle}>Secure Payment</Text>
        <Text style={styles.paymentDescription}>
          Your payment will be processed securely through Stripe. Tap "Pay Now" to continue with your preferred payment method.
        </Text>
        
        {!paymentSheetReady && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={styles.loadingText}>Setting up payment...</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Cart is Empty</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Checkout</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{user?.email}</Text>
            <Text style={styles.customerEmail}>
              {user?.firstName} {user?.lastName}
            </Text>
          </View>
        </View>

        {renderOrderSummary()}
        {renderPriceBreakdown()}
        {renderPaymentSection()}
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.checkoutButton,
            (!paymentSheetReady || isProcessing) && styles.disabledButton
          ]}
          onPress={handlePayment}
          disabled={!paymentSheetReady || isProcessing}
        >
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.checkoutButtonText}>Processing...</Text>
            </View>
          ) : !paymentSheetReady ? (
            <Text style={styles.checkoutButtonText}>
              Setting up payment...
            </Text>
          ) : (
            <Text style={styles.checkoutButtonText}>
              Pay Now ${breakdown.total.toFixed(2)}
            </Text>
          )}
        </TouchableOpacity>
        
        <Text style={styles.securityNote}>
          🔒 Your payment information is secure and encrypted
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  customerInfo: {
    paddingVertical: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  customerEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: '#6B7280',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4F46E5',
  },
  paymentContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  paymentIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  paymentDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  checkoutButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  securityNote: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
});