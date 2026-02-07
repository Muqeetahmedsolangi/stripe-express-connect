import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useSelector } from 'react-redux';
import { router, useLocalSearchParams } from 'expo-router';

import { RootState } from '@/store';
import { adminApi, SellerDetailsResponse } from '@/repository/adminApi';

interface SellerDetailsData {
  seller: any;
  products: any[];
  orders: any[];
  payouts: any[];
  stripeAccount: any;
}

interface PayoutScheduleData {
  scheduleType: 'daily' | 'weekly' | 'monthly' | 'custom' | null;
  payoutDay: number | null;
  payoutDate: string | null;
}

export default function SellerDetailsScreen() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [sellerData, setSellerData] = useState<SellerDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scheduleModal, setScheduleModal] = useState(false);
  const [scheduleData, setScheduleData] = useState<PayoutScheduleData>({
    scheduleType: null,
    payoutDay: null,
    payoutDate: null,
  });

  useEffect(() => {
    if (user?.role === 'admin' && id) {
      fetchSellerDetails();
    }
  }, [user, id]);

  const fetchSellerDetails = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getSellerDetails(parseInt(id));
      if (response.status === 'success' && response.data) {
        // Store the complete response data structure
        setSellerData({
          seller: response.data.seller,
          products: response.data.products || [],
          orders: response.data.orders || [],
          payouts: response.data.payouts || [],
          stripeAccount: response.data.stripeAccount || null,
        });
      }
    } catch (error) {
      console.error('Error fetching seller details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenScheduleModal = () => {
    if (sellerData?.seller) {
      setScheduleData({
        scheduleType: sellerData.seller.payoutScheduleType || null,
        payoutDay: sellerData.seller.payoutDay || null,
        payoutDate: sellerData.seller.payoutDate ? new Date(sellerData.seller.payoutDate).toISOString().split('T')[0] : null,
      });
      setScheduleModal(true);
    }
  };

  const handleSaveSchedule = async () => {
    if (!id) return;

    // Validate based on schedule type
    if (scheduleData.scheduleType === 'weekly' && scheduleData.payoutDay !== null) {
      if (scheduleData.payoutDay < 0 || scheduleData.payoutDay > 6) {
        Alert.alert('Error', 'Weekly payout day must be 0-6 (0=Sunday, 6=Saturday)');
        return;
      }
    }

    if (scheduleData.scheduleType === 'monthly' && scheduleData.payoutDay !== null) {
      if (scheduleData.payoutDay < 1 || scheduleData.payoutDay > 31) {
        Alert.alert('Error', 'Monthly payout day must be 1-31');
        return;
      }
    }

    if (scheduleData.scheduleType === 'custom' && !scheduleData.payoutDate) {
      Alert.alert('Error', 'Please select a payout date for custom schedule');
      return;
    }

    const response = await adminApi.updateSellerPayoutSchedule(parseInt(id), {
      scheduleType: scheduleData.scheduleType,
      payoutDay: scheduleData.payoutDay,
      payoutDate: scheduleData.payoutDate || undefined,
    });

    if (response.status === 'success') {
      Alert.alert('Success', 'Payout schedule updated successfully');
      setScheduleModal(false);
      fetchSellerDetails();
    } else {
      Alert.alert('Error', response.message || 'Failed to update payout schedule');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSellerDetails();
    setRefreshing(false);
  };

  if (user?.role !== 'admin') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Access Denied</Text>
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

  if (!sellerData || !sellerData.seller) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Seller not found</Text>
      </View>
    );
  }

  const { seller, products, orders, payouts, stripeAccount } = sellerData;

  const formatCurrency = (value: any): string => {
    if (value === null || value === undefined) return '$0.00';
    const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
    if (isNaN(numValue)) return '$0.00';
    return `$${numValue.toFixed(2)}`;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Seller Details</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Seller Info */}
      <View style={styles.section}>
        <View style={styles.infoCard}>
          <Text style={styles.sellerName}>
            {seller.firstName} {seller.lastName}
          </Text>
          <Text style={styles.sellerEmail}>{seller.email}</Text>
          {seller.phoneNumber && (
            <Text style={styles.sellerPhone}>{seller.phoneNumber}</Text>
          )}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{seller.stats?.productCount || 0}</Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{seller.stats?.totalSales || 0}</Text>
              <Text style={styles.statLabel}>Sales</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{formatCurrency(seller.stats?.totalRevenue)}</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{seller.stats?.pendingPayouts || 0}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Payout Schedule */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Payout Schedule</Text>
          <TouchableOpacity onPress={handleOpenScheduleModal}>
            <Text style={styles.editButton}>✏️ Edit</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.infoCard}>
          {seller.payoutScheduleType ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Schedule Type:</Text>
                <Text style={styles.infoValue}>
                  {seller.payoutScheduleType.charAt(0).toUpperCase() + seller.payoutScheduleType.slice(1)}
                </Text>
              </View>
              {seller.payoutScheduleType === 'weekly' && seller.payoutDay !== null && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Day of Week:</Text>
                  <Text style={styles.infoValue}>
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][seller.payoutDay]}
                  </Text>
                </View>
              )}
              {seller.payoutScheduleType === 'monthly' && seller.payoutDay !== null && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Day of Month:</Text>
                  <Text style={styles.infoValue}>{seller.payoutDay}</Text>
                </View>
              )}
              {seller.payoutScheduleType === 'custom' && seller.payoutDate && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Payout Date:</Text>
                  <Text style={styles.infoValue}>
                    {new Date(seller.payoutDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              )}
              {seller.nextPayoutDate && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Next Payout:</Text>
                  <Text style={[styles.infoValue, styles.nextPayoutDate]}>
                    {new Date(seller.nextPayoutDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.noScheduleContainer}>
              <Text style={styles.noScheduleText}>No payout schedule set</Text>
              <Text style={styles.noScheduleSubtext}>
                Set a schedule to automatically release payouts for this seller
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Stripe Account Info */}
      {stripeAccount && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stripe Account</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account ID:</Text>
              <Text style={styles.infoValue}>{stripeAccount.id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{stripeAccount.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Country:</Text>
              <Text style={styles.infoValue}>{stripeAccount.country?.toUpperCase()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type:</Text>
              <Text style={styles.infoValue}>{stripeAccount.type}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Charges Enabled:</Text>
              <Text style={[styles.infoValue, stripeAccount.charges_enabled && styles.successText]}>
                {stripeAccount.charges_enabled ? 'Yes' : 'No'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Payouts Enabled:</Text>
              <Text style={[styles.infoValue, stripeAccount.payouts_enabled && styles.successText]}>
                {stripeAccount.payouts_enabled ? 'Yes' : 'No'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Details Submitted:</Text>
              <Text style={[styles.infoValue, stripeAccount.details_submitted && styles.successText]}>
                {stripeAccount.details_submitted ? 'Yes' : 'No'}
              </Text>
            </View>
            {stripeAccount.business_profile?.name && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Business Name:</Text>
                <Text style={styles.infoValue}>{stripeAccount.business_profile.name}</Text>
              </View>
            )}
            {stripeAccount.business_profile?.url && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Business URL:</Text>
                <Text style={styles.infoValue}>{stripeAccount.business_profile.url}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Products */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Products ({products?.length || 0})</Text>
        {products && products.length > 0 ? (
          products.map((product: any) => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name || product.title}</Text>
                {product.description && (
                  <Text style={styles.productDescription} numberOfLines={2}>
                    {product.description}
                  </Text>
                )}
              </View>
              <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No products</Text>
        )}
      </View>

      {/* Recent Orders */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Orders ({orders?.length || 0})</Text>
        {orders && orders.length > 0 ? (
          orders.map((order: any) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                <View style={[
                  styles.statusBadge,
                  order.paymentReleased && styles.completedBadge,
                  order.paymentHeld && !order.paymentReleased && styles.pendingBadge,
                ]}>
                  <Text style={styles.statusText}>
                    {order.paymentReleased ? 'Released' : order.paymentHeld ? 'Held' : 'Pending'}
                  </Text>
                </View>
              </View>
              <Text style={styles.orderDate}>
                {new Date(order.createdAt).toLocaleDateString()} • {formatCurrency(order.total)}
              </Text>
              {order.paymentHeld && order.paymentReleaseDate && (
                <Text style={styles.orderReleaseDate}>
                  Release: {new Date(order.paymentReleaseDate).toLocaleDateString()}
                </Text>
              )}
              {order.sellerItems && order.sellerItems.length > 0 && (
                <View style={styles.orderItems}>
                  {order.sellerItems.map((item: any, idx: number) => (
                    <Text key={idx} style={styles.orderItemText}>
                      {item.product?.name || item.name} × {item.quantity} = {formatCurrency(parseFloat(item.price) * item.quantity)}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No orders</Text>
        )}
      </View>

      {/* Payouts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payouts ({payouts?.length || 0})</Text>
        {payouts && payouts.length > 0 ? (
          payouts.map((payout: any) => (
            <View key={payout.id} style={styles.payoutCard}>
              <View style={styles.payoutHeader}>
                <Text style={styles.payoutAmount}>{formatCurrency(payout.sellerEarnings)}</Text>
                <View style={[
                  styles.statusBadge,
                  payout.status === 'completed' && styles.completedBadge,
                  payout.status === 'pending' && styles.pendingBadge,
                  payout.status === 'failed' && styles.failedBadge,
                ]}>
                  <Text style={styles.statusText}>{payout.status}</Text>
                </View>
              </View>
              <View style={styles.payoutDetails}>
                <Text style={styles.payoutOrder}>Order: {payout.order?.orderNumber}</Text>
                <Text style={styles.payoutDetailText}>
                  Total: {formatCurrency(payout.totalAmount)} | 
                  Platform Fee: {formatCurrency(payout.platformFee)} | 
                  Stripe Fee: {formatCurrency(payout.stripeFee)} | 
                  Taxes: {formatCurrency(payout.taxes)}
                </Text>
                {payout.stripeTransferId && (
                  <Text style={styles.payoutTransferId}>Transfer ID: {payout.stripeTransferId}</Text>
                )}
                <Text style={styles.payoutDate}>
                  {new Date(payout.createdAt).toLocaleDateString()}
                  {payout.transferDate && ` • Transferred: ${new Date(payout.transferDate).toLocaleDateString()}`}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No payouts</Text>
        )}
      </View>

      {/* Payout Schedule Modal */}
      <Modal
        visible={scheduleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setScheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Payout Schedule</Text>
            <Text style={styles.modalDescription}>
              Configure when this seller will receive their payouts. All orders will be held until the payout date.
            </Text>

            <Text style={styles.modalLabel}>Schedule Type</Text>
            <View style={styles.scheduleTypeContainer}>
              {(['daily', 'weekly', 'monthly', 'custom'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.scheduleTypeButton,
                    scheduleData.scheduleType === type && styles.scheduleTypeButtonActive,
                  ]}
                  onPress={() => {
                    setScheduleData({
                      ...scheduleData,
                      scheduleType: type,
                      payoutDay: type === 'daily' ? null : scheduleData.payoutDay,
                      payoutDate: type !== 'custom' ? null : scheduleData.payoutDate,
                    });
                  }}
                >
                  <Text
                    style={[
                      styles.scheduleTypeText,
                      scheduleData.scheduleType === type && styles.scheduleTypeTextActive,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {scheduleData.scheduleType === 'weekly' && (
              <>
                <Text style={styles.modalLabel}>Day of Week (0=Sunday, 6=Saturday)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={scheduleData.payoutDay?.toString() || ''}
                  onChangeText={(text) => {
                    const num = text.replace(/[^0-9]/g, '');
                    setScheduleData({
                      ...scheduleData,
                      payoutDay: num ? parseInt(num) : null,
                    });
                  }}
                  keyboardType="numeric"
                  placeholder="1 (Monday)"
                  maxLength={1}
                />
              </>
            )}

            {scheduleData.scheduleType === 'monthly' && (
              <>
                <Text style={styles.modalLabel}>Day of Month (1-31)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={scheduleData.payoutDay?.toString() || ''}
                  onChangeText={(text) => {
                    const num = text.replace(/[^0-9]/g, '');
                    setScheduleData({
                      ...scheduleData,
                      payoutDay: num ? parseInt(num) : null,
                    });
                  }}
                  keyboardType="numeric"
                  placeholder="15"
                  maxLength={2}
                />
              </>
            )}

            {scheduleData.scheduleType === 'custom' && (
              <>
                <Text style={styles.modalLabel}>Payout Date</Text>
                <TextInput
                  style={styles.modalInput}
                  value={scheduleData.payoutDate || ''}
                  onChangeText={(text) => setScheduleData({ ...scheduleData, payoutDate: text })}
                  placeholder="YYYY-MM-DD"
                />
                <Text style={styles.helperText}>
                  Format: YYYY-MM-DD (e.g., 2024-12-25)
                </Text>
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setScheduleModal(false);
                  setScheduleData({ scheduleType: null, payoutDay: null, payoutDate: null });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveSchedule}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sellerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  sellerEmail: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  sellerPhone: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4F46E5',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  successText: {
    color: '#10B981',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4F46E5',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  orderDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  orderReleaseDate: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
    marginTop: 4,
  },
  orderItems: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  orderItemText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  payoutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  payoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  payoutAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadge: {
    backgroundColor: '#D1FAE5',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },
  failedBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  payoutDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  payoutOrder: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '600',
  },
  payoutDetailText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  payoutTransferId: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  payoutDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editButton: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '600',
  },
  noScheduleContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noScheduleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  noScheduleSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  nextPayoutDate: {
    color: '#10B981',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  scheduleTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  scheduleTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  scheduleTypeButtonActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  scheduleTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  scheduleTypeTextActive: {
    color: '#FFFFFF',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4F46E5',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

