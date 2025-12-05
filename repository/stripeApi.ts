import { api } from './api';

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
  createExpressAccount: async (email: string): Promise<CreateAccountResponse> => {
    try {
      const response = await api.post('/connect/create-onboarding-link', { email });
      
      if (response.data.status === 'success') {
        return {
          success: true,
          account: {
            id: response.data.data.stripeAccountId,
            charges_enabled: response.data.data.accountDetails.charges_enabled,
            details_submitted: response.data.data.accountDetails.details_submitted,
            payouts_enabled: response.data.data.accountDetails.payouts_enabled,
          },
          onboarding_url: response.data.data.onboardingUrl,
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to create onboarding link',
        };
      }
    } catch (error: any) {
      console.error('Create Express account error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create Stripe Express account',
      };
    }
  },

  // Check account status
  getAccountStatus: async (accountId?: string): Promise<AccountStatusResponse> => {
    try {
      if (accountId) {
        const response = await api.get(`/connect/status/${accountId}`);
        
        if (response.data.status === 'success') {
          const { data } = response.data;
          return {
            success: true,
            account: {
              id: data.accountId,
              charges_enabled: data.charges_enabled,
              details_submitted: data.details_submitted,
              payouts_enabled: data.payouts_enabled,
            },
            is_connected: data.onboarding_completed,
          };
        }
      } else {
        // Get current user's account info
        const response = await api.get('/connect/account-info');
        
        if (response.data.status === 'success') {
          const { data } = response.data;
          return {
            success: true,
            account: data.hasConnectAccount ? {
              id: data.stripeAccountId,
              charges_enabled: data.charges_enabled || data.chargesEnabled,
              details_submitted: data.details_submitted,
              payouts_enabled: data.payouts_enabled || data.payoutsEnabled,
            } : undefined,
            is_connected: data.onboardingCompleted,
          };
        }
      }
      
      return {
        success: true,
        account: undefined,
        is_connected: false,
      };
    } catch (error: any) {
      console.error('Get account status error:', error);
      return {
        success: false,
        is_connected: false,
        error: error.response?.data?.message || 'Failed to check account status',
      };
    }
  },

  // Handle return from Stripe onboarding
  handleOnboardingReturn: async (accountId: string): Promise<{ success: boolean }> => {
    try {
      const response = await api.get(`/connect/success/${accountId}`);
      
      if (response.data.status === 'success') {
        return { success: true };
      } else {
        return { success: false };
      }
    } catch (error: any) {
      console.error('Handle onboarding return error:', error);
      return { success: false };
    }
  },
};

