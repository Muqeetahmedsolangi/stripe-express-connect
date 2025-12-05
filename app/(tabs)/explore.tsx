import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import ProtectedRoute from '@/components/ProtectedRoute';
import StripeConnectButton from '@/components/StripeConnectButton';
import ProductManagement from '@/components/ProductManagement';
import SellerEarningsDashboard from '@/components/SellerEarningsDashboard';
import { RootState } from '@/store';

export default function TabTwoScreen() {
  const { isConnected } = useSelector((state: RootState) => state.stripe);
  const [activeTab, setActiveTab] = useState<'connect' | 'manage' | 'earnings'>('connect');

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
              onConnectionComplete={() => setActiveTab('manage')} 
            />
          </View>
        );
      case 'manage':
        return <ProductManagement />;
      case 'earnings':
        return <SellerEarningsDashboard />;
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
              activeTab === 'manage' && styles.activeTab,
              !isConnected && styles.disabledTab,
            ]}
            onPress={() => isConnected && setActiveTab('manage')}
            disabled={!isConnected}
          >
            <ThemedText
              style={[
                styles.tabButtonText,
                activeTab === 'manage' && styles.activeTabText,
                !isConnected && styles.disabledTabText,
              ]}
            >
              📦 Products
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'earnings' && styles.activeTab,
              !isConnected && styles.disabledTab,
            ]}
            onPress={() => isConnected && setActiveTab('earnings')}
            disabled={!isConnected}
          >
            <ThemedText
              style={[
                styles.tabButtonText,
                activeTab === 'earnings' && styles.activeTabText,
                !isConnected && styles.disabledTabText,
              ]}
            >
              💰 Earnings
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
  notConnectedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
});
