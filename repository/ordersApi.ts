import { api } from './api';
import { Product } from './productsApi';

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  sellerId: number;
  name: string;
  price: number;
  quantity: number;
  product?: Pick<Product, 'name' | 'title'>;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  subtotal: number;
  governmentTax: number;
  platformFee: number;
  total: number;
  governmentTaxRate: number;
  platformFeeRate: number;
  stripePaymentIntentId?: string;
  paymentStatus: 'pending' | 'succeeded' | 'failed' | 'canceled';
  paymentMethod?: string;
  currency: string;
  paidAt?: string;
  status: 'pending' | 'confirmed' | 'canceled';
  orderItems: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentIntentRequest {
  items: {
    productId: number;
    quantity: number;
  }[];
  shipping?: {
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
    method?: string;
    cost?: number;
  };
}

export interface PaymentIntentResponse {
  status: 'success' | 'fail';
  message: string;
  data?: {
    clientSecret: string;
    paymentIntentId: string;
    amount: number;
    order: Order;
    breakdown: {
      subtotal: number;
      governmentTax: number;
      platformFee: number;
      total: number;
      governmentTaxRate: string;
      platformFeeRate: string;
    };
  };
}

export interface ConfirmPaymentRequest {
  paymentIntentId: string;
}

export interface ConfirmPaymentResponse {
  status: 'success' | 'fail';
  message: string;
  data?: {
    order: Order;
    paymentStatus: string;
  };
}

export interface OrdersResponse {
  status: 'success' | 'fail';
  message?: string;
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
    orders: Order[];
  };
}

export interface SingleOrderResponse {
  status: 'success' | 'fail';
  message?: string;
  data?: {
    order: Order;
  };
}

export const ordersApi = {
  // Create payment intent
  createPaymentIntent: async (data: CreatePaymentIntentRequest): Promise<PaymentIntentResponse> => {
    try {
      const response = await api.post('/payments/create-payment-intent', data);
      return {
        status: 'success',
        message: response.data.message,
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Create payment intent error:', error);
      return {
        status: 'fail',
        message: error.response?.data?.message || 'Failed to create payment intent'
      };
    }
  },

  // Confirm payment
  confirmPayment: async (data: ConfirmPaymentRequest): Promise<ConfirmPaymentResponse> => {
    try {
      const response = await api.post('/payments/confirm-payment', data);
      return {
        status: 'success',
        message: response.data.message,
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Confirm payment error:', error);
      return {
        status: 'fail',
        message: error.response?.data?.message || 'Failed to confirm payment'
      };
    }
  },

  // Get payment history (orders)
  getOrders: async (page: number = 1, limit: number = 10): Promise<OrdersResponse> => {
    try {
      const response = await api.get(`/payments/history?page=${page}&limit=${limit}`);
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

  // Get single order
  getOrder: async (id: number): Promise<SingleOrderResponse> => {
    try {
      const response = await api.get(`/payments/orders/${id}`);
      return {
        status: 'success',
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Get order error:', error);
      return {
        status: 'fail',
        message: error.response?.data?.message || 'Failed to fetch order'
      };
    }
  },

  // Get all orders without pagination (for simple listing)
  getAllOrders: async (): Promise<OrdersResponse> => {
    try {
      const response = await api.get('/payments/history?limit=100');
      return {
        status: 'success',
        results: response.data.results,
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Get all orders error:', error);
      return {
        status: 'fail',
        message: error.response?.data?.message || 'Failed to fetch orders'
      };
    }
  },
};