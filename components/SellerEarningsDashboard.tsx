import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSelector } from 'react-redux';
import { payoutsApi, PayoutSummary, PayoutItem } from '../repository/payoutsApi';
import { RootState } from '../store';

const SellerEarningsDashboard: React.FC = () => {
  const { isConnected } = useSelector((state: RootState) => state.stripe);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [recentPayouts, setRecentPayouts] = useState<PayoutItem[]>([]);
  const [monthlyEarnings, setMonthlyEarnings] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const loadEarningsData = async () => {
    try {
      setError(null);
      const response = await payoutsApi.getEarnings();
      
      if (response.status === 'success' && response.data) {
        setSummary(response.data.summary);
        setRecentPayouts(response.data.recentPayouts);
        setMonthlyEarnings(response.data.monthlyEarnings);
      } else {
        setError(response.message || 'Failed to load earnings data');
      }
    } catch (err) {
      console.error('Load earnings error:', err);
      setError('Failed to load earnings data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      loadEarningsData();
    } else {
      setLoading(false);
    }
  }, [isConnected]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadEarningsData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981'; // green
      case 'pending':
        return '#F59E0B'; // orange
      case 'failed':
        return '#EF4444'; // red
      default:
        return '#6B7280'; // gray
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.notConnectedContainer}>
          <Text style={styles.notConnectedTitle}>Connect Your Bank Account</Text>
          <Text style={styles.notConnectedText}>
            You need to complete Stripe Connect onboarding to view your earnings and receive payouts.
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading earnings...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadEarningsData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Seller Earnings</Text>
        <Text style={styles.subtitle}>Track your sales and payouts</Text>
      </View>

      {summary && (
        <>
          {/* Earnings Summary Cards */}
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryCard, styles.primaryCard]}>
              <Text style={styles.cardLabel}>Total Earnings</Text>
              <Text style={styles.cardValuePrimary}>{formatCurrency(summary.totalEarnings)}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, styles.halfCard]}>
                <Text style={styles.cardLabel}>Pending</Text>
                <Text style={styles.cardValue}>{formatCurrency(summary.pendingEarnings)}</Text>
              </View>
              <View style={[styles.summaryCard, styles.halfCard]}>
                <Text style={styles.cardLabel}>Total Sales</Text>
                <Text style={styles.cardValue}>{formatCurrency(summary.totalSales)}</Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, styles.halfCard]}>
                <Text style={styles.cardLabel}>Total Fees</Text>
                <Text style={styles.cardValue}>{formatCurrency(summary.totalFees)}</Text>
              </View>
              <View style={[styles.summaryCard, styles.halfCard]}>
                <Text style={styles.cardLabel}>Payouts</Text>
                <Text style={styles.cardValue}>{summary.totalPayouts}</Text>
                <Text style={styles.cardSubtext}>
                  {summary.completedPayouts} completed
                </Text>
              </View>
            </View>
          </View>

          {/* Recent Payouts */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Payouts</Text>
            
            {recentPayouts.length > 0 ? (
              recentPayouts.map((payout) => (
                <View key={payout.id} style={styles.payoutCard}>
                  <View style={styles.payoutHeader}>
                    <View style={styles.payoutInfo}>
                      <Text style={styles.payoutOrderNumber}>#{payout.orderNumber}</Text>
                      <Text style={styles.payoutDate}>{formatDate(payout.orderDate)}</Text>
                    </View>
                    <View style={styles.payoutStatus}>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(payout.status) }
                      ]}>
                        <Text style={styles.statusText}>{getStatusText(payout.status)}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.payoutDetails}>
                    <View style={styles.payoutRow}>
                      <Text style={styles.payoutLabel}>Sale Amount:</Text>
                      <Text style={styles.payoutValue}>{formatCurrency(payout.totalAmount)}</Text>
                    </View>
                    <View style={styles.payoutRow}>
                      <Text style={styles.payoutLabel}>Your Earnings:</Text>
                      <Text style={[styles.payoutValue, styles.earningsAmount]}>
                        {formatCurrency(payout.sellerEarnings)}
                      </Text>
                    </View>
                    <View style={styles.payoutRow}>
                      <Text style={styles.payoutLabelSmall}>
                        Fees: {formatCurrency(payout.platformFee + payout.stripeFee + payout.taxes)}
                      </Text>
                      {payout.transferDate && (
                        <Text style={styles.payoutLabelSmall}>
                          Paid: {formatDate(payout.transferDate)}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No payouts yet</Text>
                <Text style={styles.emptySubtext}>
                  Start selling products to see your earnings here
                </Text>
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  notConnectedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  notConnectedTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
    textAlign: 'center',
  },
  notConnectedText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 20,
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
  summaryContainer: {
    padding: 20,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryCard: {
    backgroundColor: '#007AFF',
  },
  halfCard: {
    flex: 1,
    marginBottom: 0,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 16,
  },
  cardLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
  },
  cardValuePrimary: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
  },
  cardSubtext: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  payoutCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  payoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  payoutInfo: {
    flex: 1,
  },
  payoutOrderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  payoutDate: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
  },
  payoutStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  payoutDetails: {
    gap: 8,
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payoutLabel: {
    fontSize: 14,
    color: '#495057',
  },
  payoutLabelSmall: {
    fontSize: 12,
    color: '#6c757d',
  },
  payoutValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  earningsAmount: {
    color: '#28a745',
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#adb5bd',
    textAlign: 'center',
  },
});

export default SellerEarningsDashboard;