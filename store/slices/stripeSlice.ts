import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface StripeAccount {
  id: string;
  charges_enabled: boolean;
  details_submitted: boolean;
  payouts_enabled: boolean;
}

interface StripeState {
  account: StripeAccount | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  onboardingUrl: string | null;
}

const initialState: StripeState = {
  account: null,
  isConnected: false,
  isLoading: false,
  error: null,
  onboardingUrl: null,
};

const stripeSlice = createSlice({
  name: 'stripe',
  initialState,
  reducers: {
    // Account creation
    createAccountStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    createAccountSuccess: (state, action: PayloadAction<{ account: StripeAccount; onboardingUrl: string }>) => {
      state.isLoading = false;
      state.account = action.payload.account;
      state.onboardingUrl = action.payload.onboardingUrl;
      state.isConnected = false;
      state.error = null;
    },
    createAccountFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Account status check
    checkStatusStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    checkStatusSuccess: (state, action: PayloadAction<{ account?: StripeAccount; isConnected: boolean }>) => {
      state.isLoading = false;
      state.account = action.payload.account || null;
      state.isConnected = action.payload.isConnected;
      state.error = null;
    },
    checkStatusFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Onboarding completion
    completeOnboarding: (state, action: PayloadAction<StripeAccount>) => {
      state.account = action.payload;
      state.isConnected = true;
      state.onboardingUrl = null;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Reset state (for logout)
    resetStripeState: (state) => {
      state.account = null;
      state.isConnected = false;
      state.isLoading = false;
      state.error = null;
      state.onboardingUrl = null;
    },
  },
});

export const {
  createAccountStart,
  createAccountSuccess,
  createAccountFailure,
  checkStatusStart,
  checkStatusSuccess,
  checkStatusFailure,
  completeOnboarding,
  clearError,
  resetStripeState,
} = stripeSlice.actions;

export default stripeSlice.reducer;