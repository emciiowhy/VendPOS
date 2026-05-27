'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Loading from '@/components/ui/Loading';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user, fetchCurrentUser } = useAuthStore();

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect based on role
      if (user.role === 'owner') {
        router.push('/owner/dashboard');
      } else if (user.role === 'cashier') {
        router.push('/cashier/pos');
      }
    } else if (isAuthenticated === false) {
      // Not authenticated
      router.push('/auth/login');
    }
  }, [isAuthenticated, user, router]);

  return <Loading fullScreen text="Loading..." />;
}