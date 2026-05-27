import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product } from '@/types';

interface CartState {
  items: CartItem[];
  
  // Actions
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  increaseQuantity: (productId: number) => void;
  decreaseQuantity: (productId: number) => void;
  clearCart: () => void;
  
  // Computed
  getTotal: () => number;
  getItemCount: () => number;
  getItem: (productId: number) => CartItem | undefined;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product: Product) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.product_id === product.id
          );

          if (existingItem) {
            // Increase quantity if item exists
            return {
              items: state.items.map((item) =>
                item.product_id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          }

          // Add new item
          const newItem: CartItem = {
            product_id: product.id,
            product_name: product.name,
            price: product.price,
            quantity: 1,
            stock_quantity: product.stock_quantity || 0,
            image_url: product.image_url,
            sku: product.sku,
          };

          return {
            items: [...state.items, newItem],
          };
        });
      },

      removeItem: (productId: number) => {
        set((state) => ({
          items: state.items.filter((item) => item.product_id !== productId),
        }));
      },

      updateQuantity: (productId: number, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set((state) => {
          const item = state.items.find((i) => i.product_id === productId);
          
          // Check stock availability
          if (item && quantity > item.stock_quantity) {
            return state; // Don't update if exceeds stock
          }

          return {
            items: state.items.map((item) =>
              item.product_id === productId
                ? { ...item, quantity }
                : item
            ),
          };
        });
      },

      increaseQuantity: (productId: number) => {
        set((state) => {
          const item = state.items.find((i) => i.product_id === productId);
          
          if (!item) return state;
          
          // Check stock availability
          if (item.quantity >= item.stock_quantity) {
            return state; // Don't increase if at max stock
          }

          return {
            items: state.items.map((i) =>
              i.product_id === productId
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          };
        });
      },

      decreaseQuantity: (productId: number) => {
        set((state) => {
          const item = state.items.find((i) => i.product_id === productId);
          
          if (!item) return state;
          
          if (item.quantity <= 1) {
            // Remove item if quantity would go to 0
            return {
              items: state.items.filter((i) => i.product_id !== productId),
            };
          }

          return {
            items: state.items.map((i) =>
              i.product_id === productId
                ? { ...i, quantity: i.quantity - 1 }
                : i
            ),
          };
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotal: () => {
        const items = get().items;
        return items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      getItemCount: () => {
        const items = get().items;
        return items.reduce((count, item) => count + item.quantity, 0);
      },

      getItem: (productId: number) => {
        return get().items.find((item) => item.product_id === productId);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);