import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Product {
  id: number;
  name: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  images: any[];
  sellerId: number;
  seller?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  // For display purposes
  category?: string;
  rating?: number;
  reviews?: number;
  inStock?: boolean;
}

interface ProductsState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ProductsState = {
  products: [],
  isLoading: false,
  error: null,
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    // Fetch products
    fetchProductsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchProductsSuccess: (state, action: PayloadAction<Product[]>) => {
      state.isLoading = false;
      state.products = action.payload;
      state.error = null;
    },
    fetchProductsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Add product
    addProductStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    addProductSuccess: (state, action: PayloadAction<Product>) => {
      state.isLoading = false;
      state.products.unshift(action.payload);
      state.error = null;
    },
    addProductFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Update product
    updateProductSuccess: (state, action: PayloadAction<Product>) => {
      const index = state.products.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.products[index] = action.payload;
      }
    },

    // Delete product
    deleteProductSuccess: (state, action: PayloadAction<number>) => {
      state.products = state.products.filter(p => p.id !== action.payload);
    },

    // Clear error
    clearProductsError: (state) => {
      state.error = null;
    },
  },
});

export const {
  fetchProductsStart,
  fetchProductsSuccess,
  fetchProductsFailure,
  addProductStart,
  addProductSuccess,
  addProductFailure,
  updateProductSuccess,
  deleteProductSuccess,
  clearProductsError,
} = productsSlice.actions;

export default productsSlice.reducer;