import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useSelector } from 'react-redux';
import { router } from 'expo-router';

import { RootState } from '@/store';
import { parsePrice } from '@/utils/priceUtils';

export default function MobileCheckout() {
  const { items, totalItems, totalPrice } = useSelector((state: RootState) => state.cart);
  const { user } = useSelector((state: RootState) => state.auth);

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

  const renderWebPaymentMessage = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Payment Information</Text>
      
      <View style={styles.webPaymentContainer}>
        <Text style={styles.webIcon}>📱</Text>
        <Text style={styles.webPaymentTitle}>Mobile Payment Required</Text>
        <Text style={styles.webPaymentMessage}>
          To complete your payment, please use the mobile app. Payment processing is available on mobile devices only.
        </Text>
        <TouchableOpacity style={styles.mobileAppButton} onPress={() => router.back()}>
          <Text style={styles.mobileAppButtonText}>Continue on Mobile</Text>
        </TouchableOpacity>
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
        {renderWebPaymentMessage()}
      </ScrollView>
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
  webNotSupported: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  webIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  webTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  webMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
});