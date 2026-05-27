import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import api, { handleApiError } from '@/lib/api';
import { User, Store, LoginCredentials, RegisterData, AuthResponse } from '@/types';

interface AuthState {
  user: User | null;
  store: Store | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      store: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.post<AuthResponse>('/auth/login', credentials);
          const { user, store, accessToken, refreshToken } = response.data;

          // Save tokens
          Cookies.set('accessToken', accessToken, { expires: 7 });
          Cookies.set('refreshToken', refreshToken, { expires: 30 });

          set({
            user,
            store: store || null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = handleApiError(error);
          set({ 
            isLoading: false, 
            error: errorMessage,
            isAuthenticated: false,
          });
          throw new Error(errorMessage);
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.post<AuthResponse>('/auth/register', data);
          const { user, store, accessToken, refreshToken } = response.data;

          // Save tokens
          Cookies.set('accessToken', accessToken, { expires: 7 });
          Cookies.set('refreshToken', refreshToken, { expires: 30 });

          set({
            user,
            store: store || null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = handleApiError(error);
          set({ 
            isLoading: false, 
            error: errorMessage,
            isAuthenticated: false,
          });
          throw new Error(errorMessage);
        }
      },

      logout: () => {
        // Remove tokens
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');

        set({
          user: null,
          store: null,
          isAuthenticated: false,
          error: null,
        });
      },

      fetchCurrentUser: async () => {
        const token = Cookies.get('accessToken');
        
        if (!token) {
          set({ isAuthenticated: false, user: null, store: null });
          return;
        }

        set({ isLoading: true });

        try {
          const response = await api.get<{ user: User; store: Store | null }>('/auth/me');
          const { user, store } = response.data;

          set({
            user,
            store,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            user: null,
            store: null,
            isAuthenticated: false,
            isLoading: false,
            error: handleApiError(error),
          });
          
          // Remove invalid tokens
          Cookies.remove('accessToken');
          Cookies.remove('refreshToken');
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        store: state.store,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);