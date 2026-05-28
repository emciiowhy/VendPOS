'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Nav from './_landing/Nav';
import Hero from './_landing/Hero';
import Features from './_landing/Features';
import HowItWorks from './_landing/HowItWorks';
import Pricing from './_landing/Pricing';
import Footer from './_landing/Footer';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user, fetchCurrentUser } = useAuthStore();

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'Owner') router.replace('/owner/dashboard');
      else if (user.role === 'Cashier') router.replace('/cashier/pos');
    }
  }, [isAuthenticated, user, router]);

  return (
    <main className="min-h-screen bg-white">
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Footer />
    </main>
  );
}
