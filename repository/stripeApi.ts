interface StripeAccount {
  id: string;
  charges_enabled: boolean;
  details_submitted: boolean;
  payouts_enabled: boolean;
  onboarding_url?: string;
}

interface CreateAccountResponse {
  success: boolean;
  account?: StripeAccount;
  onboarding_url?: string;
  error?: string;
}

interface AccountStatusResponse {
  success: boolean;
  account?: StripeAccount;
  is_connected: boolean;
  error?: string;
}

export const stripeApi = {
  // Create a Stripe Express account
  createExpressAccount: async (): Promise<CreateAccountResponse> => {
    try {
      // In a real app, this would call your backend to create a Stripe Express account
      // For demo purposes, we'll simulate the response
      const mockAccountId = 'acct_' + Date.now();
      const mockOnboardingUrl = `https://connect.stripe.com/express/oauth/authorize?client_id=ca_demo&state=${mockAccountId}`;
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        account: {
          id: mockAccountId,
          charges_enabled: false,
          details_submitted: false,
          payouts_enabled: false,
          onboarding_url: mockOnboardingUrl,
        },
        onboarding_url: mockOnboardingUrl,
      };
    } catch (error) {
      console.error('Create Express account error:', error);
      return {
        success: false,
        error: 'Failed to create Stripe Express account',
      };
    }
  },

  // Check account status
  getAccountStatus: async (accountId?: string): Promise<AccountStatusResponse> => {
    try {
      // In a real app, this would check the actual Stripe account status
      // For demo purposes, we'll check localStorage to see if onboarding was completed
      const isOnboardingComplete = await isStripeOnboardingComplete();
      
      if (isOnboardingComplete) {
        return {
          success: true,
          account: {
            id: accountId || 'acct_demo',
            charges_enabled: true,
            details_submitted: true,
            payouts_enabled: true,
          },
          is_connected: true,
        };
      } else {
        return {
          success: true,
          account: undefined,
          is_connected: false,
        };
      }
    } catch (error) {
      console.error('Get account status error:', error);
      return {
        success: false,
        is_connected: false,
        error: 'Failed to check account status',
      };
    }
  },

  // Handle return from Stripe onboarding
  handleOnboardingReturn: async (accountId: string): Promise<{ success: boolean }> => {
    try {
      // Mark onboarding as complete in local storage
      await markStripeOnboardingComplete(accountId);
      return { success: true };
    } catch (error) {
      console.error('Handle onboarding return error:', error);
      return { success: false };
    }
  },
};

// Helper functions for demo purposes
const isStripeOnboardingComplete = async (): Promise<boolean> => {
  try {
    const { AsyncStorage } = await import('@react-native-async-storage/async-storage');
    const isComplete = await AsyncStorage.getItem('stripe_onboarding_complete');
    return isComplete === 'true';
  } catch {
    return false;
  }
};

const markStripeOnboardingComplete = async (accountId: string): Promise<void> => {
  try {
    const { AsyncStorage } = await import('@react-native-async-storage/async-storage');
    await AsyncStorage.setItem('stripe_onboarding_complete', 'true');
    await AsyncStorage.setItem('stripe_account_id', accountId);
  } catch (error) {
    console.error('Error marking onboarding complete:', error);
  }
};