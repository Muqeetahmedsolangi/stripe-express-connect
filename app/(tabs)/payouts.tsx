import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useSelector } from 'react-redux';
import { router } from 'expo-router';

import { RootState } from '@/store';
import { stripePayoutsApi, StripePayout, PayoutBalance } from '@/repository/stripePayoutsApi';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function PayoutsScreen() {
  const [payouts, setPayouts] = useState<StripePayout[]>([]);
  const [balance, setBalance] = useState<PayoutBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      // If not connected, the API will return appropriate error messages

      // Fetch both payouts and balance simultaneously
      const [payoutsResponse, balanceResponse] = await Promise.all([
        stripePayoutsApi.getPayouts({ limit: 20 }),
        stripePayoutsApi.getBalance(),
      ]);

      setPayouts(payoutsResponse.payouts);
      setHasMore(payoutsResponse.hasMore);
      setBalance(balanceResponse.balance);
    } catch (err) {
      console.error('Error fetching payout data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch payout data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  const handleSetupConnect = () => {
    router.push('/(tabs)/explore');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'in_transit': return '#3B82F6';
      case 'failed': return '#EF4444';
      case 'canceled': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'pending': return 'Pending';
      case 'in_transit': return 'In Transit';
      case 'failed': return 'Failed';
      case 'canceled': return 'Canceled';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <IconSymbol name="person.crop.circle" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>Authentication Required</Text>
          <Text style={styles.emptyText}>
            Please log in to view your payout information.
          </Text>
        </View>
      </View>
    );
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading payouts...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    // If it's a Stripe Connect related error, show setup message
    if (error.includes('Stripe Connect') || error.includes('not set up') || error.includes('not enabled')) {
      return (
        <View style={styles.container}>
          <View style={styles.emptyState}>
            <IconSymbol name="banknote" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Stripe Connect Required</Text>
            <Text style={styles.emptyText}>
              You need to set up your Stripe Connect account to view official payouts.
            </Text>
            <TouchableOpacity style={styles.setupButton} onPress={handleSetupConnect}>
              <Text style={styles.setupButtonText}>Set Up Stripe Connect</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // For other errors, show generic error message
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.circle" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Error Loading Payouts</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchData()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Official Stripe Payouts</Text>
        <Text style={styles.subtitle}>Your official payout history from Stripe</Text>
      </View>

      {/* Balance Section */}
      {balance && (
        <View style={styles.balanceSection}>
          <Text style={styles.sectionTitle}>Account Balance</Text>
          
          {balance.available.length > 0 && (
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Available for Payout</Text>
              {balance.available.map((item, index) => (
                <Text key={index} style={styles.balanceAmount}>
                  ${item.amount} {item.currency}
                </Text>
              ))}
            </View>
          )}
          
          {balance.pending.length > 0 && (
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Pending</Text>
              {balance.pending.map((item, index) => (
                <Text key={index} style={styles.balancePendingAmount}>
                  ${item.amount} {item.currency}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Payouts List */}
      <View style={styles.payoutsSection}>
        <Text style={styles.sectionTitle}>Payout History</Text>
        
        {payouts.length === 0 ? (
          <View style={styles.emptyPayouts}>
            <IconSymbol name="tray" size={48} color="#9CA3AF" />
            <Text style={styles.emptyPayoutsText}>No payouts yet</Text>
            <Text style={styles.emptyPayoutsSubtext}>
              Your payouts will appear here once they're processed by Stripe
            </Text>
          </View>
        ) : (
          payouts.map((payout) => (
            <View key={payout.id} style={styles.payoutCard}>
              <View style={styles.payoutHeader}>
                <View>
                  <Text style={styles.payoutAmount}>
                    ${payout.amount} {payout.currency}
                  </Text>
                  <View style={styles.payoutMeta}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(payout.status) }
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {getStatusText(payout.status)}
                      </Text>
                    </View>
                    <Text style={styles.payoutMethod}>
                      {payout.method}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.payoutDates}>
                  <Text style={styles.dateLabel}>Created</Text>
                  <Text style={styles.dateValue}>
                    {formatDate(payout.createdDate)}
                  </Text>
                  <Text style={styles.dateLabel}>Arrival</Text>
                  <Text style={styles.dateValue}>
                    {formatDate(payout.arrivalDate)}
                  </Text>
                </View>
              </View>
              
              {payout.description && (
                <Text style={styles.payoutDescription}>
                  {payout.description}
                </Text>
              )}
              
              {payout.failureMessage && (
                <View style={styles.failureContainer}>
                  <Text style={styles.failureText}>
                    {payout.failureMessage}
                  </Text>
                </View>
              )}
              
              <Text style={styles.payoutId}>ID: {payout.id}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  setupButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  setupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  balanceSection: {
    padding: 16,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  balanceCard: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: '600',
    color: '#10B981',
  },
  balancePendingAmount: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F59E0B',
  },
  payoutsSection: {
    padding: 16,
  },
  emptyPayouts: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 16,
  },
  emptyPayoutsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyPayoutsSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  payoutCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  payoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  payoutAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  payoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  payoutMethod: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  payoutDates: {
    alignItems: 'flex-end',
  },
  dateLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 6,
  },
  payoutDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  failureContainer: {
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  failureText: {
    fontSize: 12,
    color: '#DC2626',
  },
  payoutId: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
});