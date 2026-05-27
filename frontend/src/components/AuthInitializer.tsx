'use client';

import { useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';
import Cookies from 'js-cookie';

export default function AuthInitializer({ children }: { children: ReactNode }) {
  const { fetchCurrentUser, user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Check if user has valid tokens and restore session
    const accessToken = Cookies.get('accessToken');
    const refreshToken = Cookies.get('refreshToken');

    if (accessToken && refreshToken && !isAuthenticated) {
      // Try to fetch current user to restore session
      fetchCurrentUser().catch(() => {
        // If fetch fails, tokens are invalid, stay logged out
      });
    }
  }, []);

  return <>{children}</>;
}
