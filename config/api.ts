import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// API Configuration
export const API_BASE_URL = __DEV__ 
  ? 'https://picked-broadband-facing-winner.trycloudflare.com/api' 
  : 'https://your-production-api.com/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('authToken');
      // Redirect to login - implement based on your navigation setup
    }
    return Promise.reject(error);
  }
);

export default api;