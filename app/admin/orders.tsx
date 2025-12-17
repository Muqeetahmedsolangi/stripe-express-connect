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
  TextInput,
  Modal,
} from 'react-native';
import { useSelector } from 'react-redux';
import { router } from 'expo-router';

import { RootState } from '@/store';
import { adminApi, OrderWithHold } from '@/repository/adminApi';

export default function AdminOrdersScreen() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [orders, setOrders] = useState<OrderWithHold[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithHold | null>(null);
  const [releaseDateModal, setReleaseDateModal] = useState(false);
  const [newReleaseDate, setNewReleaseDate] = useState('');
  const [newHoldDays, setNewHoldDays] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAllOrders(1, 100);
      if (response.status === 'success' && response.data) {
        setOrders(response.data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleUpdateReleaseDate = async () => {
    if (!selectedOrder) return;

    // Validate hold days if provided
    if (newHoldDays) {
      const days = parseInt(newHoldDays);
      if (isNaN(days) || days < 1 || days > 30) {
        Alert.alert('Invalid Input', 'Hold days must be between 1 and 30 days');
        return;
      }
    }

    const data: any = {};
    if (newReleaseDate) {
      data.releaseDate = newReleaseDate;
    }
    if (newHoldDays) {
      data.holdDays = parseInt(newHoldDays);
    }

    if (!newReleaseDate && !newHoldDays) {
      Alert.alert('Invalid Input', 'Please provide either a release date or hold days');
      return;
    }

    const response = await adminApi.updatePaymentReleaseDate(selectedOrder.id, data);
    if (response.status === 'success') {
      Alert.alert('Success', 'Release date updated successfully');
      setReleaseDateModal(false);
      setSelectedOrder(null);
      setNewReleaseDate('');
      setNewHoldDays('');
      fetchOrders();
    } else {
      Alert.alert('Error', response.message || 'Failed to update release date');
    }
  };

  const handleReleasePayment = async (orderId: number) => {
    Alert.alert(
      'Release Payment',
      'Are you sure you want to release this payment to sellers?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Release',
          style: 'destructive',
          onPress: async () => {
            const response = await adminApi.releasePayment(orderId);
            if (response.status === 'success') {
              Alert.alert('Success', 'Payment released successfully');
              fetchOrders();
            } else {
              Alert.alert('Error', response.message || 'Failed to release payment');
            }
          },
        },
      ]
    );
  };

  const handleReleaseAllReady = async () => {
    Alert.alert(
      'Release All Ready Payments',
      'This will release all payments that have passed their release date. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Release All',
          style: 'destructive',
          onPress: async () => {
            const response = await adminApi.releaseReadyPayments();
            if (response.status === 'success') {
              Alert.alert(
                'Success',
                `Released ${response.data?.ordersReleased || 0} payment(s)`
              );
              fetchOrders();
            } else {
              Alert.alert('Error', response.message || 'Failed to release payments');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value: any): string => {
    if (value === null || value === undefined) return '$0.00';
    const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
    if (isNaN(numValue)) return '$0.00';
    return `$${numValue.toFixed(2)}`;
  };

  const isReleaseDatePassed = (releaseDate: string | null) => {
    if (!releaseDate) return false;
    return new Date(releaseDate) <= new Date();
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

  const heldOrders = orders.filter(o => o.paymentHeld && !o.paymentReleased);
  const readyToRelease = heldOrders.filter(o => isReleaseDatePassed(o.paymentReleaseDate));

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Orders & Payments</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Quick Actions */}
      {readyToRelease.length > 0 && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertText}>
            {readyToRelease.length} payment(s) ready to release
          </Text>
          <TouchableOpacity
            style={styles.releaseAllButton}
            onPress={handleReleaseAllReady}
          >
            <Text style={styles.releaseAllButtonText}>Release All</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Orders List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          All Orders ({orders.length}) - Held: {heldOrders.length}
        </Text>
        {orders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                <Text style={styles.orderCustomer}>
                  {order.user.firstName} {order.user.lastName} ({order.user.email})
                </Text>
                <Text style={styles.orderDate}>
                  {formatDate(order.createdAt)} • {formatCurrency(order.total)}
                </Text>
              </View>
              <View style={styles.orderStatus}>
                {order.paymentReleased ? (
                  <View style={styles.releasedBadge}>
                    <Text style={styles.releasedText}>Released</Text>
                  </View>
                ) : order.paymentHeld ? (
                  <View style={styles.heldBadge}>
                    <Text style={styles.heldText}>Held</Text>
                  </View>
                ) : (
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingText}>Pending</Text>
                  </View>
                )}
              </View>
            </View>

            {order.paymentHeld && !order.paymentReleased && (
              <View style={styles.holdInfo}>
                <Text style={styles.holdLabel}>
                  Release Date: {formatDate(order.paymentReleaseDate)}
                </Text>
                <Text style={styles.holdLabel}>
                  Hold Period: {order.paymentHoldDays || 5} days
                </Text>
                {isReleaseDatePassed(order.paymentReleaseDate) && (
                  <Text style={styles.readyText}>✓ Ready to Release</Text>
                )}
              </View>
            )}

            {order.paymentReleased && order.paymentReleasedAt && (
              <View style={styles.releasedInfo}>
                <Text style={styles.releasedLabel}>
                  Released: {formatDate(order.paymentReleasedAt)}
                </Text>
              </View>
            )}

            <View style={styles.orderActions}>
              {order.paymentHeld && !order.paymentReleased && (
                <>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      setSelectedOrder(order);
                      // Format release date for input (YYYY-MM-DD)
                      if (order.paymentReleaseDate) {
                        const date = new Date(order.paymentReleaseDate);
                        const formattedDate = date.toISOString().split('T')[0];
                        setNewReleaseDate(formattedDate);
                      } else {
                        setNewReleaseDate('');
                      }
                      setNewHoldDays(order.paymentHoldDays?.toString() || '5');
                      setReleaseDateModal(true);
                    }}
                  >
                    <Text style={styles.actionButtonText}>📅 Update Hold</Text>
                  </TouchableOpacity>
                  {isReleaseDatePassed(order.paymentReleaseDate) && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.releaseButton]}
                      onPress={() => handleReleasePayment(order.id)}
                    >
                      <Text style={[styles.actionButtonText, styles.releaseButtonText]}>
                        💰 Release Now
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Release Date Modal */}
      <Modal
        visible={releaseDateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setReleaseDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Payment Hold</Text>
            
            <Text style={styles.modalDescription}>
              Set the number of days to hold the payment (1-30 days). The release date will be calculated automatically.
            </Text>

            <Text style={styles.modalLabel}>
              Hold Days (1-30) <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                newHoldDays && (parseInt(newHoldDays) < 1 || parseInt(newHoldDays) > 30) && styles.modalInputError
              ]}
              value={newHoldDays}
              onChangeText={(text) => {
                // Only allow numbers
                const numericValue = text.replace(/[^0-9]/g, '');
                setNewHoldDays(numericValue);
              }}
              keyboardType="numeric"
              placeholder="5"
              maxLength={2}
            />
            {newHoldDays && (parseInt(newHoldDays) < 1 || parseInt(newHoldDays) > 30) && (
              <Text style={styles.errorText}>
                Hold days must be between 1 and 30
              </Text>
            )}
            {newHoldDays && !isNaN(parseInt(newHoldDays)) && parseInt(newHoldDays) >= 1 && parseInt(newHoldDays) <= 30 && (
              <Text style={styles.helperText}>
                Payment will be released on: {(() => {
                  const baseDate = selectedOrder?.paidAt || selectedOrder?.createdAt;
                  if (baseDate) {
                    const releaseDate = new Date(baseDate);
                    releaseDate.setDate(releaseDate.getDate() + parseInt(newHoldDays));
                    return releaseDate.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    });
                  }
                  return 'N/A';
                })()}
              </Text>
            )}

            <Text style={styles.modalLabel}>Or Set Release Date Directly (Optional)</Text>
            <TextInput
              style={styles.modalInput}
              value={newReleaseDate}
              onChangeText={setNewReleaseDate}
              placeholder="YYYY-MM-DD (e.g., 2024-12-25)"
            />
            <Text style={styles.helperText}>
              Leave empty to use hold days calculation
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setReleaseDateModal(false);
                  setSelectedOrder(null);
                  setNewReleaseDate('');
                  setNewHoldDays('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.saveButton,
                  (!newHoldDays || parseInt(newHoldDays) < 1 || parseInt(newHoldDays) > 30) && !newReleaseDate && styles.disabledButton
                ]}
                onPress={handleUpdateReleaseDate}
                disabled={(!newHoldDays || parseInt(newHoldDays) < 1 || parseInt(newHoldDays) > 30) && !newReleaseDate}
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
  alertBanner: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    flex: 1,
  },
  releaseAllButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  releaseAllButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
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
  orderCard: {
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  orderCustomer: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  orderStatus: {
    alignItems: 'flex-end',
  },
  heldBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  heldText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '600',
  },
  releasedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  releasedText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '600',
  },
  pendingBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pendingText: {
    color: '#1E40AF',
    fontSize: 12,
    fontWeight: '600',
  },
  holdInfo: {
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  holdLabel: {
    fontSize: 14,
    color: '#92400E',
    marginBottom: 4,
  },
  readyText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    marginTop: 4,
  },
  releasedInfo: {
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  releasedLabel: {
    fontSize: 14,
    color: '#065F46',
  },
  orderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#111827',
    fontWeight: '600',
  },
  releaseButton: {
    backgroundColor: '#10B981',
  },
  releaseButtonText: {
    color: '#FFFFFF',
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
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
    marginTop: 12,
  },
  required: {
    color: '#EF4444',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  modalInputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  disabledButton: {
    opacity: 0.5,
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
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 40,
  },
});

