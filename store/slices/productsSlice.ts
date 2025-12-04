import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image?: string;
  category: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  createdAt: string;
}

interface ProductsState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ProductsState = {
  products: [
    {
      id: 'prod_1',
      name: 'Premium Coffee Beans',
      description: 'High-quality Arabica coffee beans from Ethiopia. Single-origin, roasted to perfection with notes of chocolate and citrus.',
      price: 24.99,
      currency: 'USD',
      image: '☕',
      category: 'Food & Beverages',
      rating: 4.8,
      reviews: 127,
      inStock: true,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: 'prod_2',
      name: 'Wireless Noise-Cancelling Headphones',
      description: 'Premium wireless headphones with active noise cancellation, 30-hour battery life, and studio-quality sound.',
      price: 199.99,
      currency: 'USD',
      image: '🎧',
      category: 'Electronics',
      rating: 4.6,
      reviews: 89,
      inStock: true,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'prod_3',
      name: 'Organic Cotton T-Shirt',
      description: '100% organic cotton t-shirt, sustainably made with eco-friendly dyes. Soft, comfortable, and breathable.',
      price: 29.99,
      currency: 'USD',
      image: '👕',
      category: 'Clothing',
      rating: 4.4,
      reviews: 203,
      inStock: true,
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
    {
      id: 'prod_4',
      name: 'Smart Fitness Watch',
      description: 'Advanced fitness tracker with heart rate monitor, GPS, and 7-day battery life. Track your workouts and health.',
      price: 149.99,
      currency: 'USD',
      image: '⌚',
      category: 'Electronics',
      rating: 4.5,
      reviews: 156,
      inStock: true,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'prod_5',
      name: 'Mechanical Gaming Keyboard',
      description: 'RGB backlit mechanical keyboard with blue switches. Perfect for gaming and typing with tactile feedback.',
      price: 89.99,
      currency: 'USD',
      image: '⌨️',
      category: 'Electronics',
      rating: 4.7,
      reviews: 234,
      inStock: true,
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    {
      id: 'prod_6',
      name: 'Ceramic Plant Pot Set',
      description: 'Set of 3 handcrafted ceramic plant pots with drainage holes. Perfect for indoor plants and succulents.',
      price: 35.99,
      currency: 'USD',
      image: '🪴',
      category: 'Home & Garden',
      rating: 4.3,
      reviews: 78,
      inStock: true,
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    },
    {
      id: 'prod_7',
      name: 'Leather Messenger Bag',
      description: 'Genuine leather messenger bag with laptop compartment. Professional and stylish for work or travel.',
      price: 119.99,
      currency: 'USD',
      image: '💼',
      category: 'Accessories',
      rating: 4.6,
      reviews: 92,
      inStock: true,
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    {
      id: 'prod_8',
      name: 'Yoga Mat Premium',
      description: 'Extra thick yoga mat with non-slip surface. Made from eco-friendly materials for all yoga practices.',
      price: 49.99,
      currency: 'USD',
      image: '🧘',
      category: 'Sports & Fitness',
      rating: 4.5,
      reviews: 167,
      inStock: true,
      createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    },
    {
      id: 'prod_9',
      name: 'Wireless Phone Charger',
      description: 'Fast wireless charging pad compatible with all Qi-enabled devices. Sleek design with LED indicator.',
      price: 34.99,
      currency: 'USD',
      image: '📱',
      category: 'Electronics',
      rating: 4.2,
      reviews: 145,
      inStock: true,
      createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
    },
    {
      id: 'prod_10',
      name: 'Artisan Dark Chocolate',
      description: 'Premium dark chocolate (70% cacao) made from single-origin beans. Rich, smooth, and perfectly balanced.',
      price: 18.99,
      currency: 'USD',
      image: '🍫',
      category: 'Food & Beverages',
      rating: 4.8,
      reviews: 312,
      inStock: true,
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
    {
      id: 'prod_11',
      name: 'Bluetooth Portable Speaker',
      description: 'Compact waterproof speaker with 12-hour battery life. Crystal clear sound with deep bass.',
      price: 79.99,
      currency: 'USD',
      image: '🔊',
      category: 'Electronics',
      rating: 4.4,
      reviews: 198,
      inStock: false,
      createdAt: new Date(Date.now() - 86400000 * 11).toISOString(),
    },
    {
      id: 'prod_12',
      name: 'Stainless Steel Water Bottle',
      description: 'Insulated stainless steel water bottle that keeps drinks cold for 24h or hot for 12h. BPA-free.',
      price: 26.99,
      currency: 'USD',
      image: '🥤',
      category: 'Home & Garden',
      rating: 4.6,
      reviews: 289,
      inStock: true,
      createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    },
  ],
  isLoading: false,
  error: null,
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    // Add product
    addProductStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    addProductSuccess: (state, action: PayloadAction<Product>) => {
      state.isLoading = false;
      state.products.unshift(action.payload); // Add to beginning
      state.error = null;
    },
    addProductFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Update product
    updateProduct: (state, action: PayloadAction<Product>) => {
      const index = state.products.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.products[index] = action.payload;
      }
    },

    // Delete product
    deleteProduct: (state, action: PayloadAction<string>) => {
      state.products = state.products.filter(p => p.id !== action.payload);
    },

    // Load products (for demo purposes)
    loadProducts: (state, action: PayloadAction<Product[]>) => {
      state.products = action.payload;
    },

    // Clear error
    clearProductsError: (state) => {
      state.error = null;
    },
  },
});

export const {
  addProductStart,
  addProductSuccess,
  addProductFailure,
  updateProduct,
  deleteProduct,
  loadProducts,
  clearProductsError,
} = productsSlice.actions;

export default productsSlice.reducer;