import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: 'user' | 'seller' | 'admin';
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  status: 'success' | 'fail';
  message: string;
  token?: string;
  data?: {
    user: User;
  };
}

export interface LoginResponse extends AuthResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    token: string;
    refreshToken: string;
  };
}

export const authApi = {
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/register', userData, {
        headers: { 'X-Skip-Auth': 'true' }
      });
      
      // Store token in AsyncStorage if registration was successful
      if (response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
      }
      
      return {
        status: 'success',
        message: response.data.message || 'Registration successful',
        token: response.data.token,
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      return {
        status: 'fail',
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  },

  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await api.post('/auth/login', credentials, {
        headers: { 'X-Skip-Auth': 'true' }
      });
      
      if (response.data.status === 'success') {
        // Store token in AsyncStorage
        await AsyncStorage.setItem('authToken', response.data.token);
        
        return {
          success: true,
          status: 'success',
          message: response.data.message,
          user: {
            id: response.data.data.user.id.toString(),
            email: response.data.data.user.email,
            token: response.data.token,
            refreshToken: response.data.token, // Using same token for now since backend doesn't separate
          }
        };
      } else {
        return {
          success: false,
          status: 'fail',
          message: response.data.message || 'Login failed',
          user: {
            id: '',
            email: '',
            token: '',
            refreshToken: '',
          }
        };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        status: 'fail',
        message: error.response?.data?.message || 'Login failed',
        user: {
          id: '',
          email: '',
          token: '',
          refreshToken: '',
        }
      };
    }
  },

  logout: async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await api.post('/auth/logout');
      // Remove token from AsyncStorage
      await AsyncStorage.removeItem('authToken');
      return { 
        success: true, 
        message: response.data.message || 'Logged out successfully' 
      };
    } catch (error: any) {
      console.error('Logout error:', error);
      // Remove token even if logout API fails
      await AsyncStorage.removeItem('authToken');
      return { 
        success: false, 
        message: error.response?.data?.message || 'Logout failed' 
      };
    }
  },

  getMe: async (): Promise<{ success: boolean; user?: User; message?: string }> => {
    try {
      const response = await api.get('/auth/me');
      return {
        success: true,
        user: response.data.data.user
      };
    } catch (error: any) {
      console.error('Get user error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get user data'
      };
    }
  },
};