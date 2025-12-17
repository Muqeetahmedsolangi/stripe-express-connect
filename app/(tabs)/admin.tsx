import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSelector } from 'react-redux';

import { adminApi, Seller } from '@/repository/adminApi';
import { RootState } from '@/store';

export default function AdminDashboard() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalSellers: 0,
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    pendingPayouts: 0,
  });

  useEffect(() => {
    console.log('Admin screen - User data:', user);
    console.log('Admin screen - User role:', user?.role);
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAllSellers();
      if (response.status === 'success' && response.data) {
        setSellers(response.data.sellers);
        
        // Calculate overall stats
        const totalSellers = response.data.sellers.length;
        const totalProducts = response.data.sellers.reduce((sum, s) => sum + s.stats.productCount, 0);
        const totalSales = response.data.sellers.reduce((sum, s) => sum + s.stats.totalSales, 0);
        const totalRevenue = response.data.sellers.reduce((sum, s) => sum + s.stats.totalRevenue, 0);
        const pendingPayouts = response.data.sellers.reduce((sum, s) => sum + s.stats.pendingPayouts, 0);
        
        setStats({
          totalSellers,
          totalProducts,
          totalSales,
          totalRevenue,
          pendingPayouts,
        });
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Debug: Log user role check
  console.log('Admin check - User:', user);
  console.log('Admin check - Role:', user?.role);
  console.log('Admin check - Is Admin:', user?.role === 'admin');

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.errorSubtext}>Loading user data...</Text>
        </View>
      </View>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Access Denied</Text>
          <Text style={styles.errorSubtext}>
            Admin privileges required. Current role: {user?.role || 'none'}
          </Text>
        </View>
      </View>
    );
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Manage sellers and payments</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalSellers}</Text>
          <Text style={styles.statLabel}>Total Sellers</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalProducts}</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalSales}</Text>
          <Text style={styles.statLabel}>Total Sales</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${stats.totalRevenue.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/admin/orders')}
        >
          <Text style={styles.actionButtonText}>📦 Manage Orders & Payments</Text>
        </TouchableOpacity>
      </View>

      {/* Sellers List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Sellers ({sellers.length})</Text>
        {sellers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No sellers found</Text>
          </View>
        ) : (
          sellers.map((seller) => (
            <TouchableOpacity
              key={seller.id}
              style={styles.sellerCard}
              onPress={() => router.push(`/admin/seller/${seller.id}`)}
            >
              <View style={styles.sellerHeader}>
                <View style={styles.sellerInfo}>
                  <Text style={styles.sellerName}>
                    {seller.firstName} {seller.lastName}
                  </Text>
                  <Text style={styles.sellerEmail}>{seller.email}</Text>
                </View>
                {seller.stripeAccountId ? (
                  <View style={styles.connectedBadge}>
                    <Text style={styles.connectedText}>✓ Connected</Text>
                  </View>
                ) : (
                  <View style={styles.notConnectedBadge}>
                    <Text style={styles.notConnectedText}>Not Connected</Text>
                  </View>
                )}
              </View>
              <View style={styles.sellerStats}>
                <View style={styles.sellerStatItem}>
                  <Text style={styles.sellerStatValue}>{seller.stats.productCount}</Text>
                  <Text style={styles.sellerStatLabel}>Products</Text>
                </View>
                <View style={styles.sellerStatItem}>
                  <Text style={styles.sellerStatValue}>{seller.stats.totalSales}</Text>
                  <Text style={styles.sellerStatLabel}>Sales</Text>
                </View>
                <View style={styles.sellerStatItem}>
                  <Text style={styles.sellerStatValue}>${seller.stats.totalRevenue.toFixed(2)}</Text>
                  <Text style={styles.sellerStatLabel}>Revenue</Text>
                </View>
                <View style={styles.sellerStatItem}>
                  <Text style={styles.sellerStatValue}>{seller.stats.pendingPayouts}</Text>
                  <Text style={styles.sellerStatLabel}>Pending</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
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
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4F46E5',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sellerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sellerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sellerEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  connectedBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connectedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  notConnectedBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  notConnectedText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  sellerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  sellerStatItem: {
    alignItems: 'center',
  },
  sellerStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sellerStatLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 16,
    color: '#6B7280',
  },
});

