import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootState } from '../store';
import { logout } from '../store/slices/authSlice';
import { resetStripeState } from '../store/slices/stripeSlice';
import { clearCart } from '../store/slices/cartSlice';
import { clearProductsError } from '../store/slices/productsSlice';
import { authApi } from '../repository/authApi';
import { clearCachedToken } from '../repository/api';

export default function LogoutButton() {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. Call backend logout API
              await authApi.logout();
            } catch (error) {
              console.error('Logout API error:', error);
              // Continue with local cleanup even if API call fails
            }

            try {
              // 2. Clear all Redux states
              dispatch(logout());
              dispatch(resetStripeState());
              dispatch(clearCart());
              dispatch(clearProductsError());

              // 3. Clear API client cached token
              clearCachedToken();

              // 4. Clear persistent storage
              if (Platform.OS !== 'web') {
                // React Native
                await AsyncStorage.multiRemove([
                  'persist:root',
                  'stripe_onboarding_complete',
                  'stripe_account_id',
                  'user_token',
                  'refresh_token',
                  'user_data',
                ]);
                console.log('Cleared AsyncStorage');
              } else {
                // Web
                localStorage.clear();
                sessionStorage.clear();
                console.log('Cleared web storage');
              }

              // 5. Navigate to login
              router.replace('/login');
              console.log('Logout completed successfully');
              
            } catch (storageError) {
              console.error('Storage cleanup error:', storageError);
              // Still navigate to login even if storage cleanup fails
              router.replace('/login');
            }
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
      <Text style={styles.logoutButtonText}>Logout</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 16,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});