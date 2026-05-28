'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Store as StoreIcon,
  LogOut,
  Menu,
  X,
  Users as UsersIcon,
  Archive,
} from 'lucide-react';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';

const NAV = [
  { name: 'Dashboard', href: '/owner/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/owner/products', icon: Package },
  { name: 'Inventory', href: '/owner/inventory', icon: Archive },
  { name: 'Transactions', href: '/owner/sales', icon: ShoppingCart },
  { name: 'Reports', href: '/owner/reports', icon: BarChart3 },
  { name: 'Users', href: '/owner/users', icon: UsersIcon },
  { name: 'Tenant Settings', href: '/owner/store', icon: StoreIcon },
];

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, tenant, isAuthenticated, logout, fetchCurrentUser } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (isAuthenticated === false) {
      router.push('/auth/login');
    } else if (user && user.role !== 'Owner') {
      toast.error('Access denied. Owner access required.');
      router.push('/cashier/pos');
    }
  }, [isAuthenticated, user, router]);

  const handleLogout = () => {
    logout();
    toast.success('Signed out');
    router.push('/auth/login');
  };

  if (!isAuthenticated || !user) return <Loading fullScreen text="Loading..." />;

  const initial = (tenant?.business_name || 'V').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-gray-900/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-30 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-5 py-5 border-b border-gray-200">
            <Link href="/owner/dashboard" className="flex items-center gap-2.5 min-w-0">
              {tenant?.logo_url ? (
                <img
                  src={tenant.logo_url}
                  alt=""
                  className="h-8 w-8 rounded-md object-cover ring-1 ring-gray-200"
                />
              ) : (
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-md text-sm font-semibold text-white"
                  style={{ backgroundColor: tenant?.theme_color || '#2563eb' }}
                >
                  {initial}
                </span>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold tracking-tight text-gray-900 truncate">
                  {tenant?.business_name || 'VendPOS'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {tenant?.subscription_tier || 'Starter'}
                </p>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Workspace
            </p>
            <ul className="space-y-0.5">
              {NAV.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-800 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-t border-gray-200 p-3">
            <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-700">
                {(user.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-1 flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <div className="lg:hidden sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-700 hover:text-gray-900"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="text-sm font-semibold text-gray-900">{tenant?.business_name}</p>
          <span className="w-5" />
        </div>

        <main className="px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
