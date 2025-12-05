import { api } from './api';
import { ConfirmPaymentRequest, ConfirmPaymentResponse, CreatePaymentIntentRequest, PaymentIntentResponse } from './ordersApi';

// Demo Stripe publishable key - replace with your actual key
export const STRIPE_PUBLISHABLE_KEY = 'k_test_51Pacl7D14xfJoKMAjaiJywsdOO811qnPzP7W47r0kW08u3cQJIG8kbd0OZfz7nbaL2ZMycR5jmuL6baxhRVgx4tA00OWNiJXQ7';

export const paymentApi = {
  // Create payment intent - now uses backend API
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

  // Confirm payment - now uses backend API
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

  // Calculate fees (same as backend - 7.25% government tax + 3.25% platform fee)
  calculateFees: (subtotal: number) => {
    const governmentTax = subtotal * 0.0725; // 7.25%
    const platformFee = subtotal * 0.0325; // 3.25%
    const total = subtotal + governmentTax + platformFee;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      governmentTax: Math.round(governmentTax * 100) / 100,
      platformFee: Math.round(platformFee * 100) / 100,
      total: Math.round(total * 100) / 100,
      totalInCents: Math.round(total * 100),
    };
  },
};