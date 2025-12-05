import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { 
  createAccountStart, 
  createAccountSuccess, 
  createAccountFailure,
  checkStatusStart,
  checkStatusSuccess,
  checkStatusFailure
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
  const { user } = useSelector((state: RootState) => state.auth);
  const [webViewVisible, setWebViewVisible] = useState(false);
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);

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

    if (!user?.email) {
      Alert.alert('Error', 'User email is required for Stripe Connect');
      return;
    }

    dispatch(createAccountStart());
    
    try {
      const response = await stripeApi.createExpressAccount(user.email);
      
      // Validate response as requested
      if (response.success && response.onboarding_url && response.account) {
        dispatch(createAccountSuccess({
          account: response.account,
          onboardingUrl: response.onboarding_url,
        }));
        
        // Open Stripe onboarding in in-app web view
        setOnboardingUrl(response.onboarding_url);
        setWebViewVisible(true);
      } else {
        dispatch(createAccountFailure(response.error || 'Failed to create account'));
        Alert.alert('Error', response.error || 'Failed to start Stripe onboarding');
      }
    } catch (error) {
      dispatch(createAccountFailure('Network error'));
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handleWebViewNavigationStateChange = (navState: any) => {
    const { url } = navState;
    console.log('WebView URL changed:', url);
    
    // Check if URL matches success return URL pattern
    if (url.includes('/connect/success')) {
      console.log('Success URL detected, extracting account ID...');
      
      try {
        // Extract account ID from URL if present
        const urlParts = url.split('?');
        if (urlParts.length > 1) {
          const urlParams = new URLSearchParams(urlParts[1]);
          const accountId = urlParams.get('account_id');
          console.log('Account ID from URL:', accountId);
          console.log('Current account ID:', account?.id);
          
          if (accountId) {
            // Call backend to update status and then update local state
            handleOnboardingReturn(accountId);
          } else {
            console.log('No account_id in URL, using current account ID');
            if (account?.id) {
              handleOnboardingReturn(account.id);
            }
          }
        } else {
          console.log('No query params in URL, using current account ID');
          if (account?.id) {
            handleOnboardingReturn(account.id);
          }
        }
      } catch (error) {
        console.error('Error parsing return URL:', error);
        // Fallback to current account ID
        if (account?.id) {
          handleOnboardingReturn(account.id);
        }
      }
      
      // Close WebView
      setWebViewVisible(false);
      setOnboardingUrl(null);
    }
  };

  const closeWebView = () => {
    setWebViewVisible(false);
    setOnboardingUrl(null);
  };

  const handleOnboardingReturn = async (accountId?: string) => {
    const finalAccountId = accountId || account?.id;
    
    if (!finalAccountId) {
      console.error('No account ID available for onboarding return');
      Alert.alert('Error', 'Unable to complete onboarding - missing account ID');
      return;
    }

    console.log('Processing onboarding return for account:', finalAccountId);

    try {
      // Call backend to verify and update onboarding status
      const result = await stripeApi.handleOnboardingReturn(finalAccountId);
      
      if (result.success) {
        // Refresh account status from backend to get latest data
        console.log('Onboarding return successful, refreshing status...');
        await checkStripeStatus();
        
        Alert.alert(
          'Success!', 
          'Your bank account has been connected successfully. You can now create and manage products.',
          [{ text: 'OK', onPress: onConnectionComplete }]
        );
      } else {
        console.error('Backend reported onboarding return failed');
        Alert.alert('Error', 'Failed to complete onboarding verification');
      }
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
            {webViewVisible ? 'Opening onboarding...' : 'Checking status...'}
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

      {/* WebView Modal for Stripe Onboarding */}
      <Modal
        visible={webViewVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeWebView}
      >
        <SafeAreaView style={styles.webViewContainer}>
          <View style={styles.webViewHeader}>
            <TouchableOpacity
              onPress={closeWebView}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.webViewTitle}>Stripe Connect Setup</Text>
            <View style={styles.closeButtonPlaceholder} />
          </View>
          
          {onboardingUrl && (
            <WebView
              source={{ uri: onboardingUrl }}
              onNavigationStateChange={handleWebViewNavigationStateChange}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color="#635BFF" />
                  <Text style={styles.loadingText}>Loading Stripe Connect...</Text>
                </View>
              )}
              style={styles.webView}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsBackForwardNavigationGestures={true}
            />
          )}
        </SafeAreaView>
      </Modal>
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
  webViewContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  webViewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  closeButtonPlaceholder: {
    width: 32,
  },
  webView: {
    flex: 1,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});