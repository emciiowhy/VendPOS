'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  LogOut,
  Receipt as ReceiptIcon,
  Package,
  Store,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { Product, Transaction } from '@/types';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import Empty from '@/components/ui/Empty';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';

export default function CashierPOSPage() {
  const router = useRouter();
  const { user, tenant, isAuthenticated, logout, fetchCurrentUser } = useAuthStore();
  const cart = useCartStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [todaySummary, setTodaySummary] = useState<{ total_transactions: number; total_amount: number } | null>(null);

  useEffect(() => { fetchCurrentUser(); }, []);

  useEffect(() => {
    if (isAuthenticated === false) router.push('/auth/login');
  }, [isAuthenticated, router]);

  const fetchProducts = async () => {
    try {
      const [pRes, sumRes] = await Promise.all([
        api.get('/products?is_active=true'),
        api.get('/transactions/my-today').catch(() => ({ data: { summary: null } })),
      ]);
      const items: Product[] = pRes.data.products || [];
      setProducts(items);
      setCategories(['All', ...Array.from(new Set(items.map((p) => p.category).filter(Boolean)))]);
      setTodaySummary(sumRes.data?.summary || null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (isAuthenticated && user) fetchProducts(); }, [isAuthenticated, user]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (activeCategory !== 'All' && p.category !== activeCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [products, activeCategory, search]);

  const money = (n: number) => `$${Number(n).toFixed(2)}`;

  const handleCheckout = async () => {
    if (cart.items.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setIsCheckingOut(true);
    try {
      const response = await api.post('/transactions', {
        items: cart.items.map((it) => ({
          product_id: it.product_id,
          quantity: it.quantity,
          unit_price: it.price,
        })),
      });
      setLastTransaction(response.data.transaction);
      cart.clearCart();
      toast.success(`Transaction #${response.data.transaction.transaction_id} recorded`);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Checkout failed');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  if (!isAuthenticated || !user) return <Loading fullScreen text="Loading..." />;

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-white"
            style={{ backgroundColor: tenant?.theme_color || '#2563eb' }}
          >
            <Store className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{tenant?.business_name || 'VendPOS'}</p>
            <p className="text-xs text-gray-500 truncate">{user.name} · Cashier</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {todaySummary && (
            <>
              <div className="hidden sm:block rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5">
                <span className="text-gray-500">Today: </span>
                <span className="font-semibold text-gray-900">{todaySummary.total_transactions} txn</span>
              </div>
              <div className="hidden sm:block rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5">
                <span className="text-gray-500">Total: </span>
                <span className="font-semibold text-gray-900">{money(Number(todaySummary.total_amount))}</span>
              </div>
            </>
          )}
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Product grid */}
        <section className="flex-1 overflow-hidden flex flex-col p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  activeCategory === cat
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <Loading text="Loading products..." />
            ) : filtered.length === 0 ? (
              <Empty title="No products" description="Adjust filters or have your owner add products." />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filtered.map((p) => {
                  const inCart = cart.getItem(p.product_id);
                  const out = p.current_stock === 0;
                  return (
                    <button
                      key={p.product_id}
                      disabled={out}
                      onClick={() => cart.addItem(p)}
                      className={`group flex flex-col rounded-lg border bg-white p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                        out ? 'opacity-50 cursor-not-allowed' : 'border-gray-200 hover:border-primary-500 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex h-24 items-center justify-center rounded-md bg-gray-50">
                        {p.image_url ? (
                          <img src={p.image_url} alt="" className="h-full w-full rounded-md object-cover" />
                        ) : (
                          <Package className="h-8 w-8 text-gray-300" />
                        )}
                      </div>
                      <div className="mt-3 flex-1">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">{p.name}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{p.category}</p>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900">{money(p.price)}</span>
                        <div className="flex items-center gap-1.5">
                          {out ? (
                            <Badge variant="danger">Out</Badge>
                          ) : (
                            <span className="text-xs text-gray-500">{p.current_stock} left</span>
                          )}
                          {inCart && (
                            <span className="rounded-full bg-primary-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                              ×{inCart.quantity}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Cart */}
        <aside className="hidden md:flex w-96 flex-col border-l border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-gray-700" />
              <h2 className="text-sm font-semibold text-gray-900">Cart</h2>
            </div>
            {cart.items.length > 0 && (
              <button
                onClick={cart.clearCart}
                className="text-xs text-gray-500 hover:text-red-600 inline-flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" /> Clear
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {cart.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ShoppingCart className="h-8 w-8 text-gray-300" />
                <p className="mt-3 text-sm font-medium text-gray-900">Cart is empty</p>
                <p className="mt-1 text-xs text-gray-500">Tap a product to add it.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {cart.items.map((it) => (
                  <li key={it.product_id} className="rounded-md border border-gray-200 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{it.product_name}</p>
                        <p className="text-xs text-gray-500">{money(it.price)} each</p>
                      </div>
                      <button
                        onClick={() => cart.removeItem(it.product_id)}
                        className="text-gray-400 hover:text-red-600"
                        title="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => cart.decreaseQuantity(it.product_id)}
                          className="rounded border border-gray-300 p-1 text-gray-700 hover:bg-gray-50"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium tabular-nums">{it.quantity}</span>
                        <button
                          onClick={() => cart.increaseQuantity(it.product_id)}
                          className="rounded border border-gray-300 p-1 text-gray-700 hover:bg-gray-50"
                          aria-label="Increase quantity"
                          disabled={it.quantity >= it.current_stock}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{money(it.price * it.quantity)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-gray-200 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Items</span>
              <span className="font-medium text-gray-900">{cart.getItemCount()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total</span>
              <span className="text-xl font-semibold text-gray-900 tabular-nums">{money(cart.getTotal())}</span>
            </div>
            <Button
              fullWidth
              size="lg"
              onClick={handleCheckout}
              disabled={cart.items.length === 0}
              isLoading={isCheckingOut}
            >
              <ReceiptIcon className="h-4 w-4" />
              Checkout
            </Button>
          </div>
        </aside>
      </div>

      {/* Receipt modal */}
      <Modal
        isOpen={!!lastTransaction}
        onClose={() => setLastTransaction(null)}
        title={`Transaction #${lastTransaction?.transaction_id} recorded`}
        size="md"
      >
        {lastTransaction && (
          <div>
            <div className="flex items-center justify-center py-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <ReceiptIcon className="h-6 w-6" />
              </div>
            </div>
            <p className="text-center text-sm text-gray-500">Stock has been decremented atomically.</p>

            <div className="mt-5 rounded-md border border-gray-200 bg-gray-50 p-4">
              <ul className="divide-y divide-gray-200">
                {lastTransaction.items?.map((it) => (
                  <li key={it.transaction_item_id} className="flex justify-between py-2 text-sm">
                    <span className="text-gray-700">
                      {it.product_name} <span className="text-gray-500">× {it.quantity}</span>
                    </span>
                    <span className="font-medium text-gray-900 tabular-nums">
                      {money(Number(it.unit_price) * it.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between border-t border-gray-200 pt-3 text-base font-semibold">
                <span>Total</span>
                <span className="text-gray-900 tabular-nums">{money(Number(lastTransaction.total_amount))}</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setLastTransaction(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
