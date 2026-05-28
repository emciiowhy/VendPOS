import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import api, { handleApiError } from '@/lib/api';
import { User, Tenant, LoginCredentials, RegisterData, AuthResponse } from '@/types';

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

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
      tenant: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post<AuthResponse>('/auth/login', credentials);
          const { user, tenant, accessToken, refreshToken } = response.data;

          Cookies.set('accessToken', accessToken, { expires: 7 });
          Cookies.set('refreshToken', refreshToken, { expires: 30 });

          set({
            user,
            tenant: tenant || null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = handleApiError(error);
          set({ isLoading: false, error: errorMessage, isAuthenticated: false });
          throw new Error(errorMessage);
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post<AuthResponse>('/auth/register', data);
          const { user, tenant, accessToken, refreshToken } = response.data;

          Cookies.set('accessToken', accessToken, { expires: 7 });
          Cookies.set('refreshToken', refreshToken, { expires: 30 });

          set({
            user,
            tenant: tenant || null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = handleApiError(error);
          set({ isLoading: false, error: errorMessage, isAuthenticated: false });
          throw new Error(errorMessage);
        }
      },

      logout: () => {
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        set({ user: null, tenant: null, isAuthenticated: false, error: null });
      },

      fetchCurrentUser: async () => {
        const token = Cookies.get('accessToken');
        if (!token) {
          set({ isAuthenticated: false, user: null, tenant: null });
          return;
        }
        set({ isLoading: true });
        try {
          const response = await api.get<{ user: User; tenant: Tenant }>('/auth/me');
          const { user, tenant } = response.data;
          set({
            user,
            tenant,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            user: null,
            tenant: null,
            isAuthenticated: false,
            isLoading: false,
            error: handleApiError(error),
          });
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
        tenant: state.tenant,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
