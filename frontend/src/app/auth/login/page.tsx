'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Store, Lock, Crown, ShoppingBag, ShieldAlert, UserRound } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';

const DEMOS = [
  {
    role: 'Owner' as const,
    label: 'Owner',
    email: 'owner@demo.com',
    password: 'Demo123',
    icon: Crown,
    description: 'Full access — manage products, transactions, users',
  },
  {
    role: 'Cashier' as const,
    label: 'Cashier',
    email: 'cashier@demo.com',
    password: 'Demo123',
    icon: ShoppingBag,
    description: 'POS access — ring up transactions',
  },
];

const PLACEHOLDERS = [
  { label: 'SuperAdmin', icon: ShieldAlert, hint: 'Coming in v2 — not part of the current scope' },
  { label: 'Customer', icon: UserRound, hint: 'Coming in v2 — VendPOS models the merchant side only today' },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (!formData.email) next.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) next.email = 'Email is invalid';
    if (!formData.password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await login(formData);
      toast.success('Signed in');
      const user = useAuthStore.getState().user;
      router.push(user?.role === 'Owner' ? '/owner/dashboard' : '/cashier/pos');
    } catch (error: any) {
      toast.error(error.message || 'Sign in failed');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const fillDemo = (email: string, password: string) => {
    setFormData({ email, password });
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-gradient-to-br from-primary-700 via-primary-800 to-gray-900 p-12 text-white">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/15 backdrop-blur">
            <Store className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">VendPOS</span>
        </Link>

        <div>
          <h2 className="text-3xl font-semibold tracking-tight leading-tight">
            Stock-safe, tenant-isolated, audit-friendly POS.
          </h2>
          <p className="mt-3 max-w-md text-sm text-white/70">
            Try the demo with one click — the Owner and Cashier accounts are pre-seeded with realistic data.
          </p>
        </div>

        <p className="text-xs text-white/50">
          © {new Date().getFullYear()} VendPOS
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-600 text-white">
                <Store className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold tracking-tight text-gray-900">VendPOS</span>
            </Link>
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Sign in</h1>
            <p className="mt-1 text-sm text-gray-500">
              Don't have an account?{' '}
              <Link href="/auth/register" className="font-medium text-primary-700 hover:text-primary-800">
                Create one
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="••••••••"
              required
            />
            <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading}>
              <Lock className="h-4 w-4" />
              Sign in
            </Button>
          </form>

          <div className="mt-10">
            <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-gray-500">
              <span className="h-px flex-1 bg-gray-200" />
              <span>Try a demo account</span>
              <span className="h-px flex-1 bg-gray-200" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {DEMOS.map(({ role, label, email, password, icon: Icon, description }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => fillDemo(email, password)}
                  className="rounded-md border border-gray-200 bg-white p-3 text-left transition hover:border-primary-500 hover:bg-primary-50/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary-700" />
                    <span className="text-sm font-medium text-gray-900">{label}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{description}</p>
                  <p className="mt-2 font-mono text-[11px] text-gray-600">{email}</p>
                </button>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              {PLACEHOLDERS.map(({ label, icon: Icon, hint }) => (
                <button
                  key={label}
                  type="button"
                  disabled
                  title={hint}
                  className="cursor-not-allowed rounded-md border border-dashed border-gray-200 bg-gray-50 p-3 text-left opacity-70"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-500">{label}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">Coming in v2</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
