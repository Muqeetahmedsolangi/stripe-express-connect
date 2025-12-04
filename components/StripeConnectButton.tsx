import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { 
  createAccountStart, 
  createAccountSuccess, 
  createAccountFailure,
  checkStatusStart,
  checkStatusSuccess,
  checkStatusFailure,
  completeOnboarding 
} from '../store/slices/stripeSlice';
import { stripeApi } from '../repository/stripeApi';

interface StripeConnectButtonProps {
  onConnectionComplete?: () => void;
}

export default function StripeConnectButton({ onConnectionComplete }: StripeConnectButtonProps) {
  const dispatch = useDispatch();
  const { isConnected, isLoading, account, error } = useSelector(
    (state: RootState) => state.stripe
  );
  const [webBrowserOpen, setWebBrowserOpen] = useState(false);

  useEffect(() => {
    // Check connection status on mount
    checkStripeStatus();
  }, []);

  const checkStripeStatus = async () => {
    dispatch(checkStatusStart());
    try {
      const response = await stripeApi.getAccountStatus(account?.id);
      if (response.success) {
        dispatch(checkStatusSuccess({
          account: response.account,
          isConnected: response.is_connected,
        }));
      } else {
        dispatch(checkStatusFailure(response.error || 'Failed to check status'));
      }
    } catch (error) {
      dispatch(checkStatusFailure('Network error'));
    }
  };

  const handleConnectStripe = async () => {
    if (isConnected) {
      Alert.alert('Already Connected', 'Your Stripe account is already connected!');
      return;
    }

    dispatch(createAccountStart());
    
    try {
      const response = await stripeApi.createExpressAccount();
      
      if (response.success && response.onboarding_url) {
        dispatch(createAccountSuccess({
          account: response.account!,
          onboardingUrl: response.onboarding_url,
        }));
        
        // Open Stripe onboarding in web browser
        await openStripeOnboarding(response.onboarding_url);
      } else {
        dispatch(createAccountFailure(response.error || 'Failed to create account'));
        Alert.alert('Error', 'Failed to start Stripe onboarding');
      }
    } catch (error) {
      dispatch(createAccountFailure('Network error'));
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const openStripeOnboarding = async (url: string) => {
    try {
      setWebBrowserOpen(true);
      
      const result = await WebBrowser.openBrowserAsync(url, {
        // iOS options
        controlsColor: '#007AFF',
        dismissButtonStyle: 'close',
        readerMode: false,
        // Android options
        showTitle: true,
        toolbarColor: '#007AFF',
        enableUrlBarHiding: true,
        enableDefaultShare: false,
      });

      setWebBrowserOpen(false);

      if (result.type === 'dismiss' || result.type === 'cancel') {
        // User closed the browser, check if onboarding was completed
        setTimeout(() => {
          handleOnboardingReturn();
        }, 1000);
      }
    } catch (error) {
      setWebBrowserOpen(false);
      console.error('Error opening browser:', error);
      Alert.alert('Error', 'Failed to open Stripe onboarding');
    }
  };

  const handleOnboardingReturn = async () => {
    if (!account?.id) return;

    try {
      // Mark onboarding as complete (in real app, verify with backend)
      await stripeApi.handleOnboardingReturn(account.id);
      
      // Dispatch success and update state
      dispatch(completeOnboarding({
        id: account.id,
        charges_enabled: true,
        details_submitted: true,
        payouts_enabled: true,
      }));

      Alert.alert(
        'Success!', 
        'Your bank account has been connected successfully. You can now create and manage products.',
        [{ text: 'OK', onPress: onConnectionComplete }]
      );
    } catch (error) {
      console.error('Error handling onboarding return:', error);
      Alert.alert('Error', 'Failed to complete onboarding');
    }
  };

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="white" />
          <Text style={styles.buttonText}>
            {webBrowserOpen ? 'Opening browser...' : 'Checking status...'}
          </Text>
        </View>
      );
    }

    if (isConnected) {
      return (
        <View style={styles.connectedContainer}>
          <Text style={styles.connectedIcon}>✓</Text>
          <Text style={styles.buttonText}>Bank Connected</Text>
        </View>
      );
    }

    return (
      <View style={styles.connectContainer}>
        <Text style={styles.bankIcon}>🏦</Text>
        <Text style={styles.buttonText}>Connect Bank Account</Text>
      </View>
    );
  };

  if (isConnected) {
    return (
      <View style={[styles.button, styles.connectedButton]}>
        {getButtonContent()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        Connect your bank account with Stripe Express to start selling products and receive payments.
      </Text>
      
      <TouchableOpacity
        style={[styles.button, isLoading && styles.disabledButton]}
        onPress={handleConnectStripe}
        disabled={isLoading}
      >
        {getButtonContent()}
      </TouchableOpacity>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <Text style={styles.disclaimer}>
        Powered by Stripe Express Connect. Secure and compliant payment processing.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#333',
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#635BFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 250,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  connectedButton: {
    backgroundColor: '#00C851',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bankIcon: {
    fontSize: 20,
  },
  connectedIcon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});