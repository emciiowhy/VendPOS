'use client';

import { useEffect, useState } from 'react';
import { Plus, Minus, Package, AlertTriangle, XCircle } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import Empty from '@/components/ui/Empty';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import api from '@/lib/api';
import { Product } from '@/types';
import toast from 'react-hot-toast';

// Stock-focused view of products. Stock lives on products.current_stock —
// no separate inventory entity (ADR-0001 era decision).
export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const [adjustmentValue, setAdjustmentValue] = useState('');

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data.products || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load products');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdjust = async () => {
    if (!selected || !adjustmentValue) {
      toast.error('Enter an amount');
      return;
    }
    const delta =
      adjustmentType === 'add'
        ? parseInt(adjustmentValue, 10)
        : -parseInt(adjustmentValue, 10);
    try {
      await api.patch(`/products/${selected.product_id}/stock`, { delta });
      toast.success('Stock adjusted');
      closeModal();
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to adjust stock');
    }
  };

  const closeModal = () => {
    setIsAdjustModalOpen(false);
    setSelected(null);
    setAdjustmentValue('');
    setAdjustmentType('add');
  };

  const openModal = (p: Product) => {
    setSelected(p);
    setAdjustmentValue('');
    setAdjustmentType('add');
    setIsAdjustModalOpen(true);
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockItems = products.filter((p) => p.current_stock > 0 && p.current_stock <= p.reorder_level);
  const outOfStockItems = products.filter((p) => p.current_stock === 0);

  if (isLoading) return <Loading text="Loading inventory..." />;

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Adjust stock levels. Decrements from checkouts happen automatically — this is for manual top-ups and corrections."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total items" value={products.length} icon={<Package className="h-5 w-5" />} />
        <StatCard label="Low stock" value={lowStockItems.length} hint="At or below reorder level" icon={<AlertTriangle className="h-5 w-5" />} />
        <StatCard label="Out of stock" value={outOfStockItems.length} icon={<XCircle className="h-5 w-5" />} />
      </div>

      <Card className="mt-6 p-4">
        <Input
          placeholder="Search by name, SKU, or category"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Card>

      {filtered.length === 0 ? (
        <div className="mt-4">
          <Empty title="No products" description={searchQuery ? 'Try a different search' : 'Add products to manage inventory'} />
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <th className="text-left py-3 px-4 font-semibold">Product</th>
                <th className="text-left py-3 px-4 font-semibold">SKU</th>
                <th className="text-left py-3 px-4 font-semibold">Category</th>
                <th className="text-center py-3 px-4 font-semibold">Stock</th>
                <th className="text-center py-3 px-4 font-semibold">Status</th>
                <th className="text-center py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p) => (
                <tr key={p.product_id} className="hover:bg-gray-50/60">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{p.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 font-mono">{p.sku || '—'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{p.category}</td>
                  <td className="py-3 px-4 text-center text-sm font-semibold text-gray-900">{p.current_stock}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge
                      variant={p.current_stock === 0 ? 'danger' : p.current_stock <= p.reorder_level ? 'warning' : 'success'}
                    >
                      {p.current_stock === 0 ? 'Out of stock' : p.current_stock <= p.reorder_level ? 'Low' : 'In stock'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Button size="sm" variant="secondary" onClick={() => openModal(p)}>
                      Adjust
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <Modal isOpen={isAdjustModalOpen} onClose={closeModal} title="Adjust stock">
          <div className="space-y-4">
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs text-gray-500">Product</p>
              <p className="text-base font-semibold text-gray-900 mt-0.5">{selected.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                Current stock: <span className="font-semibold text-gray-900">{selected.current_stock}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setAdjustmentType('add')}
                className={`flex items-center justify-center gap-2 rounded-md border p-3 text-sm font-medium ${
                  adjustmentType === 'add' ? 'border-primary-600 bg-primary-50 text-primary-800' : 'border-gray-200 text-gray-700'
                }`}
              >
                <Plus className="h-4 w-4" /> Add
              </button>
              <button
                onClick={() => setAdjustmentType('subtract')}
                className={`flex items-center justify-center gap-2 rounded-md border p-3 text-sm font-medium ${
                  adjustmentType === 'subtract' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-700'
                }`}
              >
                <Minus className="h-4 w-4" /> Remove
              </button>
            </div>

            <Input
              label="Amount"
              type="number"
              value={adjustmentValue}
              onChange={(e) => setAdjustmentValue(e.target.value)}
              placeholder="Enter amount"
            />

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
              <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
              <Button
                variant={adjustmentType === 'add' ? 'primary' : 'danger'}
                onClick={handleAdjust}
                disabled={!adjustmentValue}
              >
                {adjustmentType === 'add' ? 'Add stock' : 'Remove stock'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
