import { api } from './api';

export interface Seller {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  stripeAccountId?: string;
  onboardingCompleted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  createdAt: string;
  lastLogin?: string;
  stats: {
    productCount: number;
    totalSales: number;
    totalRevenue: number;
    pendingPayouts: number;
  };
  stripeAccount?: {
    id: string;
    charges_enabled: boolean;
    payouts_enabled: boolean;
    details_submitted: boolean;
    country: string;
    type: string;
    email: string;
  };
}

export interface SellerDetails extends Seller {
  products: any[];
  orders: any[];
  payouts: any[];
}

export interface OrderWithHold {
  id: number;
  orderNumber: string;
  userId: number;
  subtotal: number;
  total: number;
  paymentStatus: string;
  status: string;
  paymentHeld: boolean;
  paymentReleased: boolean;
  paymentReleaseDate: string | null;
  paymentReleasedAt: string | null;
  paymentHoldDays: number;
  createdAt: string;
  paidAt: string | null;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
  orderItems: any[];
}

export interface AdminOrdersResponse {
  status: 'success' | 'fail';
  results?: number;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    totalOrders: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  data?: {
    orders: OrderWithHold[];
  };
}

export interface SellersResponse {
  status: 'success' | 'fail';
  results?: number;
  data?: {
    sellers: Seller[];
  };
}

export interface SellerDetailsResponse {
  status: 'success' | 'fail';
  data?: {
    seller: SellerDetails;
    products: any[];
    orders: any[];
    payouts: any[];
    stripeAccount: any;
  };
}

export const adminApi = {
  // Get all sellers
  getAllSellers: async (): Promise<SellersResponse> => {
    try {
      const response = await api.get('/admin/sellers');
      return {
        status: 'success',
        results: response.data.results,
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Get sellers error:', error);
      return {
        status: 'fail',
        message: error.response?.data?.message || 'Failed to fetch sellers'
      };
    }
  },

  // Get seller details
  getSellerDetails: async (sellerId: number): Promise<SellerDetailsResponse> => {
    try {
      const response = await api.get(`/admin/sellers/${sellerId}`);
      return {
        status: 'success',
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Get seller details error:', error);
      return {
        status: 'fail',
        message: error.response?.data?.message || 'Failed to fetch seller details'
      };
    }
  },

  // Get all orders with payment hold info
  getAllOrders: async (page = 1, limit = 50): Promise<AdminOrdersResponse> => {
    try {
      const response = await api.get(`/admin/orders?page=${page}&limit=${limit}`);
      return {
        status: 'success',
        results: response.data.results,
        pagination: response.data.pagination,
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Get orders error:', error);
      return {
        status: 'fail',
        message: error.response?.data?.message || 'Failed to fetch orders'
      };
    }
  },

  // Update payment release date
  updatePaymentReleaseDate: async (orderId: number, data: { releaseDate?: string; holdDays?: number }): Promise<{ status: 'success' | 'fail'; message?: string; data?: any }> => {
    try {
      const response = await api.patch(`/admin/orders/${orderId}/release-date`, data);
      return {
        status: 'success',
        message: response.data.message,
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Update release date error:', error);
      return {
        status: 'fail',
        message: error.response?.data?.message || 'Failed to update release date'
      };
    }
  },

  // Release payment for an order
  releasePayment: async (orderId: number): Promise<{ status: 'success' | 'fail'; message?: string; data?: any }> => {
    try {
      const response = await api.post(`/admin/orders/${orderId}/release`);
      return {
        status: 'success',
        message: response.data.message,
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Release payment error:', error);
      return {
        status: 'fail',
        message: error.response?.data?.message || 'Failed to release payment'
      };
    }
  },

  // Release all ready payments
  releaseReadyPayments: async (): Promise<{ status: 'success' | 'fail'; message?: string; data?: any }> => {
    try {
      const response = await api.post('/admin/payments/release-ready');
      return {
        status: 'success',
        message: response.data.message,
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Release ready payments error:', error);
      return {
        status: 'fail',
        message: error.response?.data?.message || 'Failed to release ready payments'
      };
    }
  },
};

