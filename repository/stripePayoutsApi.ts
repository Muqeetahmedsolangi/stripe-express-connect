import { api } from './api';

export interface StripePayout {
  id: string;
  amount: string;
  currency: string;
  status: 'paid' | 'pending' | 'in_transit' | 'canceled' | 'failed';
  method: string;
  type: string;
  description?: string;
  arrivalDate: string;
  createdDate: string;
  failureCode?: string;
  failureMessage?: string;
  destination?: string;
}

export interface PayoutBalance {
  available: Array<{
    amount: string;
    currency: string;
  }>;
  pending: Array<{
    amount: string;
    currency: string;
  }>;
}

export interface PayoutsResponse {
  payouts: StripePayout[];
  hasMore: boolean;
  total: number;
}

export interface BalanceResponse {
  balance: PayoutBalance;
}

class StripePayoutsApi {
  // Get official Stripe payouts for connected account
  async getPayouts(params?: {
    limit?: number;
    starting_after?: string;
  }): Promise<PayoutsResponse> {
    try {
      const response = await api.get('/connect/payouts', {
        params,
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching Stripe payouts:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to fetch payout history'
      );
    }
  }

  // Get current payout balance
  async getBalance(): Promise<BalanceResponse> {
    try {
      const response = await api.get('/connect/balance');
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching payout balance:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to fetch balance information'
      );
    }
  }
}

export const stripePayoutsApi = new StripePayoutsApi();