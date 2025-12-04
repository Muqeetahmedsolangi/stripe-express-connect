import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from './productsSlice';

export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
  addedAt: string;
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isVisible: boolean;
}

const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  isVisible: false,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<{ product: Product; quantity?: number }>) => {
      const { product, quantity = 1 } = action.payload;
      const existingItem = state.items.find(item => item.product.id === product.id);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        const newItem: CartItem = {
          id: Date.now(),
          product,
          quantity,
          addedAt: new Date().toISOString(),
        };
        state.items.push(newItem);
      }

      // Recalculate totals
      state.totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
      state.totalPrice = state.items.reduce((total, item) => total + (parseFloat(item.product.price.toString()) * item.quantity), 0);
    },

    removeFromCart: (state, action: PayloadAction<number>) => {
      const itemId = action.payload;
      state.items = state.items.filter(item => item.id !== itemId);

      // Recalculate totals
      state.totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
      state.totalPrice = state.items.reduce((total, item) => total + (parseFloat(item.product.price.toString()) * item.quantity), 0);
    },

    updateQuantity: (state, action: PayloadAction<{ itemId: number; quantity: number }>) => {
      const { itemId, quantity } = action.payload;
      const item = state.items.find(item => item.id === itemId);
      
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter(item => item.id !== itemId);
        } else {
          item.quantity = quantity;
        }

        // Recalculate totals
        state.totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
        state.totalPrice = state.items.reduce((total, item) => total + (parseFloat(item.product.price.toString()) * item.quantity), 0);
      }
    },

    clearCart: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.totalPrice = 0;
    },

    toggleCartVisibility: (state) => {
      state.isVisible = !state.isVisible;
    },

    showCart: (state) => {
      state.isVisible = true;
    },

    hideCart: (state) => {
      state.isVisible = false;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  toggleCartVisibility,
  showCart,
  hideCart,
} = cartSlice.actions;

export default cartSlice.reducer;