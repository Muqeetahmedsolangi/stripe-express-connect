import { api } from './api';

export interface PayoutSummary {
  totalEarnings: number;
  pendingEarnings: number;
  totalSales: number;
  totalFees: number;
  totalPayouts: number;
  completedPayouts: number;
  pendingPayouts: number;
  failedPayouts: number;
}

export interface PayoutItem {
  id: number;
  orderNumber: string;
  totalAmount: number;
  sellerEarnings: number;
  platformFee: number;
  stripeFee: number;
  taxes: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transferDate: string | null;
  createdAt: string;
  orderDate: string;
  paidDate: string | null;
  products?: {
    name: string;
    title: string;
    quantity: number;
    price: number;
  }[];
}

export interface PayoutBreakdown {
  totalAmount: number;
  platformFee: number;
  platformFeeRate: string;
  stripeFee: number;
  stripeFeeRate: string;
  taxes: number;
  taxRate: string;
  sellerEarnings: number;
}

export interface PayoutDetails extends PayoutItem {
  breakdown: PayoutBreakdown;
  products: {
    name: string;
    title: string;
    description: string;
    quantity: number;
    priceAtTime: number;
    totalForItem: number;
  }[];
  stripeTransferId: string | null;
  failureReason: string | null;
}

export interface EarningsResponse {
  status: 'success' | 'fail';
  message?: string;
  data?: {
    summary: PayoutSummary;
    monthlyEarnings: Record<string, number>;
    recentPayouts: PayoutItem[];
  };
}

export interface PayoutHistoryResponse {
  status: 'success' | 'fail';
  message?: string;
  results?: number;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    totalPayouts: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  data?: {
    payouts: PayoutItem[];
  };
}

export interface PayoutDetailResponse {
  status: 'success' | 'fail';
  message?: string;
  data?: {
    payout: PayoutDetails;
  };
}

export const payoutsApi = {
  // Get seller earnings dashboard
  getEarnings: async (): Promise<EarningsResponse> => {
    try {
      const response = await api.get('/payouts/earnings');
      return {
        status: 'success',
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Get earnings error:', error);
      return {
        status: 'fail',
        message: error.response?.data?.message || 'Failed to fetch earnings'
      };
    }
  },

  // Get payout history
  getPayoutHistory: async (page = 1, limit = 20): Promise<PayoutHistoryResponse> => {
    try {
      const response = await api.get(`/payouts/history?page=${page}&limit=${limit}`);
      return {
        status: 'success',
        results: response.data.results,
        pagination: response.data.pagination,
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Get payout history error:', error);
      return {
        status: 'fail',
        message: error.response?.data?.message || 'Failed to fetch payout history'
      };
    }
  },

  // Get single payout details
  getPayout: async (payoutId: number): Promise<PayoutDetailResponse> => {
    try {
      const response = await api.get(`/payouts/${payoutId}`);
      return {
        status: 'success',
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Get payout error:', error);
      return {
        status: 'fail',
        message: error.response?.data?.message || 'Failed to fetch payout details'
      };
    }
  },
};