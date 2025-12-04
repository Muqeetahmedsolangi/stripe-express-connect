import api from '../config/api';

export interface PaymentIntentData {
  productId: string;
  quantity?: number;
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface PaymentResponse {
  status: string;
  message: string;
  data: {
    paymentIntent: PaymentIntent;
    order: {
      _id: string;
      totalAmount: number;
      governmentTax: number;
      platformFee: number;
      subtotal: number;
    };
  };
}

class PaymentService {
  async createPaymentIntent(paymentData: PaymentIntentData): Promise<PaymentResponse> {
    try {
      const response = await api.post('/payments/create-payment-intent', paymentData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create payment intent');
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<any> {
    try {
      const response = await api.post('/payments/confirm-payment', {
        paymentIntentId,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to confirm payment');
    }
  }

  async getPaymentHistory(page = 1, limit = 10): Promise<any> {
    try {
      const response = await api.get(`/payments/history?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get payment history');
    }
  }

  async getOrder(orderId: string): Promise<any> {
    try {
      const response = await api.get(`/payments/orders/${orderId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get order');
    }
  }
}

export default new PaymentService();