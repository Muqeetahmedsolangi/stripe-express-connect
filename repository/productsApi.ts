import { api } from './api';

export interface Product {
  id: number;
  name: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  sellerId: number;
  seller?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  title: string;
  description: string;
  price: number;
  images?: string[];
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: number;
}

export interface ProductsResponse {
  status: 'success' | 'fail';
  message?: string;
  results?: number;
  data?: {
    products: Product[];
  };
}

export interface SingleProductResponse {
  status: 'success' | 'fail';
  message?: string;
  data?: {
    product: Product;
  };
}

export const productsApi = {
  // Get all products
  getAllProducts: async (): Promise<ProductsResponse> => {
    try {
      const response = await api.get('/products');
      return {
        status: 'success',
        results: response.data.results,
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Get products error:', error);
      return {
        status: 'fail',
        message: error.response?.data?.message || 'Failed to fetch products'
      };
    }
  },

  // Get single product
  getProduct: async (id: number): Promise<SingleProductResponse> => {
    try {
      const response = await api.get(`/products/${id}`);
      return {
        status: 'success',
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Get product error:', error);
      return {
        status: 'fail',
        message: error.response?.data?.message || 'Failed to fetch product'
      };
    }
  },

  // Create product (requires authentication)
  createProduct: async (productData: CreateProductRequest): Promise<SingleProductResponse> => {
    try {
      const response = await api.post('/products', productData);
      return {
        status: 'success',
        message: 'Product created successfully',
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Create product error:', error);
      return {
        status: 'fail',
        message: error.response?.data?.message || 'Failed to create product'
      };
    }
  },

  // Update product (requires authentication)
  updateProduct: async (id: number, productData: Partial<CreateProductRequest>): Promise<SingleProductResponse> => {
    try {
      const response = await api.patch(`/products/${id}`, productData);
      return {
        status: 'success',
        message: 'Product updated successfully',
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Update product error:', error);
      return {
        status: 'fail',
        message: error.response?.data?.message || 'Failed to update product'
      };
    }
  },

  // Delete product (requires authentication)
  deleteProduct: async (id: number): Promise<{ status: 'success' | 'fail'; message: string }> => {
    try {
      await api.delete(`/products/${id}`);
      return {
        status: 'success',
        message: 'Product deleted successfully'
      };
    } catch (error: any) {
      console.error('Delete product error:', error);
      return {
        status: 'fail',
        message: error.response?.data?.message || 'Failed to delete product'
      };
    }
  },

  // Get user's products (requires authentication)
  getUserProducts: async (): Promise<ProductsResponse> => {
    try {
      const response = await api.get('/products');
      // Filter by current user - this would be handled by backend with proper user filtering
      return {
        status: 'success',
        results: response.data.results,
        data: response.data.data
      };
    } catch (error: any) {
      console.error('Get user products error:', error);
      return {
        status: 'fail',
        message: error.response?.data?.message || 'Failed to fetch user products'
      };
    }
  },
};