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
import { useSelector, useDispatch } from 'react-redux';
import { router } from 'expo-router';
import { CardField, useStripe, StripeProvider } from '@stripe/stripe-react-native';

import { RootState } from '@/store';
import { clearCart } from '@/store/slices/cartSlice';
import { ordersApi } from '@/repository/ordersApi';
import { parsePrice } from '@/utils/priceUtils';

export default function MobileCheckout() {
  return (
    <StripeProvider publishableKey="pk_test_51QTBhYFnKMRqB3vPqUTUTmZOJHYqFMYYVGVdmFwkPhPgjqM8DRNHG1y34L1LV7vO6K7Zp1FtOGZCOJQq6KK5GGkq00rNRShNWs">
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
  const [paymentReady, setPaymentReady] = useState(false);
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
  }, [items, totalPrice]);

  const handlePayment = async () => {
    if (!stripe) {
      Alert.alert('Error', 'Stripe is not ready. Please try again.');
      return;
    }

    if (!paymentReady) {
      Alert.alert('Error', 'Please enter your payment information.');
      return;
    }

    setIsProcessing(true);

    try {
      // Prepare items for backend
      const backendItems = items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      // Step 1: Create payment intent with backend
      const paymentIntentResponse = await ordersApi.createPaymentIntent({
        items: backendItems,
      });

      if (paymentIntentResponse.status !== 'success' || !paymentIntentResponse.data) {
        throw new Error(paymentIntentResponse.message || 'Failed to create payment intent');
      }

      const { clientSecret, paymentIntentId } = paymentIntentResponse.data;

      // Step 2: Confirm payment with Stripe
      const { error: paymentError } = await stripe.confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
      });

      if (paymentError) {
        throw new Error(paymentError.message || 'Payment failed');
      }

      // Step 3: Confirm payment with backend
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

  const renderPaymentForm = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Payment Information</Text>
      
      <View style={styles.cardFieldContainer}>
        <CardField
          postalCodeEnabled={false}
          placeholders={{
            number: '4242 4242 4242 4242',
          }}
          cardStyle={{
            backgroundColor: '#FFFFFF',
            textColor: '#000000',
            fontSize: 16,
            placeholderColor: '#9CA3AF',
            borderWidth: 1,
            borderColor: '#E5E7EB',
            borderRadius: 8,
          }}
          style={{
            width: '100%',
            height: 50,
            marginVertical: 10,
          }}
          onCardChange={(cardDetails: any) => {
            setPaymentReady(cardDetails.complete);
          }}
        />
      </View>
      
      <Text style={styles.cardNote}>
        💡 Test card: Use 4242 4242 4242 4242 with any future date and CVC
      </Text>
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
        {renderPaymentForm()}
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.checkoutButton,
            (!paymentReady || isProcessing) && styles.disabledButton
          ]}
          onPress={handlePayment}
          disabled={!paymentReady || isProcessing}
        >
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.checkoutButtonText}>Processing...</Text>
            </View>
          ) : (
            <Text style={styles.checkoutButtonText}>
              Pay ${breakdown.total.toFixed(2)}
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
  cardFieldContainer: {
    marginVertical: 8,
  },
  cardNote: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
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