import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import ProtectedRoute from '@/components/ProtectedRoute';
import StripeConnectButton from '@/components/StripeConnectButton';
import CreateProductForm from '@/components/CreateProductForm';
import ProductCard from '@/components/ProductCard';
import { RootState } from '@/store';
import { deleteProduct } from '@/store/slices/productsSlice';

export default function TabTwoScreen() {
  const dispatch = useDispatch();
  const { products } = useSelector((state: RootState) => state.products);
  const { isConnected } = useSelector((state: RootState) => state.stripe);
  const [activeTab, setActiveTab] = useState<'connect' | 'create' | 'list'>('connect');

  const handleDeleteProduct = (productId: string) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch(deleteProduct(productId)),
        },
      ]
    );
  };

  const renderProduct = ({ item }: { item: any }) => (
    <ProductCard
      product={item}
      showActions
      onEdit={() => Alert.alert('Edit', 'Edit functionality coming soon!')}
      onDelete={() => handleDeleteProduct(item.id)}
    />
  );

  const getTabContent = () => {
    if (!isConnected && activeTab !== 'connect') {
      return (
        <View style={styles.notConnectedContainer}>
          <ThemedText type="subtitle">Connect your bank account first</ThemedText>
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => setActiveTab('connect')}
          >
            <ThemedText style={styles.tabButtonText}>Go to Connect</ThemedText>
          </TouchableOpacity>
        </View>
      );
    }

    switch (activeTab) {
      case 'connect':
        return (
          <View style={styles.connectContainer}>
            <StripeConnectButton 
              onConnectionComplete={() => setActiveTab('create')} 
            />
          </View>
        );
      case 'create':
        return (
          <CreateProductForm 
            onProductCreated={() => setActiveTab('list')} 
          />
        );
      case 'list':
        return (
          <View style={styles.listContainer}>
            <ThemedText type="subtitle" style={styles.listTitle}>
              Your Products ({products.length})
            </ThemedText>
            {products.length > 0 ? (
              <FlatList
                data={products}
                renderItem={renderProduct}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.productsContainer}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <ThemedText>No products yet. Create your first product!</ThemedText>
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => setActiveTab('create')}
                >
                  <ThemedText style={styles.createButtonText}>Create Product</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <ProtectedRoute>
      <View style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Product Management</ThemedText>
          <ThemedText style={styles.subtitle}>
            Manage your Stripe Express Connect integration and products
          </ThemedText>
        </ThemedView>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'connect' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('connect')}
          >
            <ThemedText
              style={[
                styles.tabButtonText,
                activeTab === 'connect' && styles.activeTabText,
              ]}
            >
              {isConnected ? '✓ Connected' : '🏦 Connect'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'create' && styles.activeTab,
              !isConnected && styles.disabledTab,
            ]}
            onPress={() => isConnected && setActiveTab('create')}
            disabled={!isConnected}
          >
            <ThemedText
              style={[
                styles.tabButtonText,
                activeTab === 'create' && styles.activeTabText,
                !isConnected && styles.disabledTabText,
              ]}
            >
              ➕ Create
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'list' && styles.activeTab,
              !isConnected && styles.disabledTab,
            ]}
            onPress={() => isConnected && setActiveTab('list')}
            disabled={!isConnected}
          >
            <ThemedText
              style={[
                styles.tabButtonText,
                activeTab === 'list' && styles.activeTabText,
                !isConnected && styles.disabledTabText,
              ]}
            >
              📋 List ({products.length})
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {getTabContent()}
        </View>
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  disabledTab: {
    backgroundColor: '#e9ecef',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: 'white',
  },
  disabledTabText: {
    color: '#aaa',
  },
  content: {
    flex: 1,
  },
  connectContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  listContainer: {
    flex: 1,
    padding: 20,
  },
  listTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  productsContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  notConnectedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
});
