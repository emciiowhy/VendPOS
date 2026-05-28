'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Store, UserPlus, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    business_name: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (!formData.email) next.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) next.email = 'Email is invalid';
    if (!formData.password) next.password = 'Password is required';
    else if (formData.password.length < 8) next.password = 'Must be at least 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(formData.password))
      next.password = 'Need upper + lower + number';
    if (formData.password !== formData.confirmPassword)
      next.confirmPassword = 'Passwords do not match';
    if (!formData.name) next.name = 'Name is required';
    if (!formData.business_name) next.business_name = 'Business name is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        business_name: formData.business_name,
      });
      toast.success('Welcome to VendPOS');
      router.push('/owner/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-gradient-to-br from-primary-700 via-primary-800 to-gray-900 p-12 text-white">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/15 backdrop-blur">
            <Store className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">VendPOS</span>
        </Link>

        <div>
          <h2 className="text-3xl font-semibold tracking-tight leading-tight">
            Open your shop's register in 60 seconds.
          </h2>
          <p className="mt-3 max-w-md text-sm text-white/70">
            One tenant, one shop, two roles — owner and cashier. Stock counts on every product. Append-only sales history. Free to get started.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-white/80">
            {[
              'Race-safe stock decrement, verified by prototype',
              'Tenant isolation enforced in middleware',
              'Append-only Transaction model (no silent edits)',
            ].map((bullet) => (
              <li key={bullet} className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-white/80" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/50">© {new Date().getFullYear()} VendPOS</p>
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
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Create your tenant</h1>
            <p className="mt-1 text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-medium text-primary-700 hover:text-primary-800">
                Sign in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Input
              label="Your name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
            />
            <Input
              label="Business name"
              name="business_name"
              value={formData.business_name}
              onChange={handleChange}
              error={errors.business_name}
              required
            />
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
            />
            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              helperText="Min 8 characters with uppercase, lowercase, and number"
              required
            />
            <Input
              label="Confirm password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              required
            />
            <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading}>
              <UserPlus className="h-4 w-4" />
              Create account
            </Button>
          </form>

          <p className="mt-6 text-xs text-gray-500">
            By creating an account you agree to the use of cookies for session management.
          </p>
        </div>
      </div>
    </div>
  );
}
