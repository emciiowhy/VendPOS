'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import Empty from '@/components/ui/Empty';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import PageHeader from '@/components/ui/PageHeader';
import api from '@/lib/api';
import { Product } from '@/types';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '', sku: '', category: '', price: '', cost: '', current_stock: '', reorder_level: '',
  });

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

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category || !formData.price) {
      toast.error('Name, category, and price are required');
      return;
    }
    try {
      await api.post('/products', {
        name: formData.name,
        sku: formData.sku || null,
        category: formData.category,
        price: parseFloat(formData.price),
        cost: formData.cost ? parseFloat(formData.cost) : null,
        current_stock: formData.current_stock ? parseInt(formData.current_stock, 10) : 0,
        reorder_level: formData.reorder_level ? parseInt(formData.reorder_level, 10) : 10,
      });
      toast.success('Product created');
      setIsCreateModalOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create product');
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await api.put(`/products/${selectedProduct.product_id}`, {
        name: formData.name,
        sku: formData.sku || null,
        category: formData.category,
        price: parseFloat(formData.price),
        cost: formData.cost ? parseFloat(formData.cost) : null,
        current_stock: formData.current_stock ? parseInt(formData.current_stock, 10) : undefined,
        reorder_level: formData.reorder_level ? parseInt(formData.reorder_level, 10) : undefined,
      });
      toast.success('Product updated');
      setIsEditModalOpen(false);
      setSelectedProduct(null);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update product');
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('Deactivate this product? Past transactions stay intact.')) return;
    try {
      await api.delete(`/products/${productId}`);
      toast.success('Product deactivated');
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    }
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku || '',
      category: product.category || '',
      price: product.price.toString(),
      cost: product.cost?.toString() || '',
      current_stock: product.current_stock.toString(),
      reorder_level: product.reorder_level.toString(),
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () =>
    setFormData({ name: '', sku: '', category: '', price: '', cost: '', current_stock: '', reorder_level: '' });

  const closeCreateModal = () => { setIsCreateModalOpen(false); resetForm(); };
  const closeEditModal = () => { setIsEditModalOpen(false); setSelectedProduct(null); resetForm(); };

  if (isLoading) return <Loading text="Loading products..." />;

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="Products"
        description="Your catalog. Stock and reorder levels live on the product itself."
        action={
          <Button size="md" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add product
          </Button>
        }
      />

      <Card className="p-4">
        <Input
          placeholder="Search by name, SKU, or category"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Card>

      {filtered.length === 0 ? (
        <div className="mt-4">
          <Empty
            title="No products found"
            description={searchQuery ? 'Try a different search' : 'Add your first product to get started'}
          />
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <th className="text-left py-3 px-4 font-semibold">Product</th>
                <th className="text-left py-3 px-4 font-semibold">SKU</th>
                <th className="text-left py-3 px-4 font-semibold">Category</th>
                <th className="text-right py-3 px-4 font-semibold">Price</th>
                <th className="text-center py-3 px-4 font-semibold">Stock</th>
                <th className="text-center py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((product) => (
                <tr key={product.product_id} className="hover:bg-gray-50/60">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{product.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 font-mono">{product.sku || '—'}</td>
                  <td className="py-3 px-4 text-sm">
                    {product.category ? <Badge variant="gray">{product.category}</Badge> : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="py-3 px-4 text-right text-sm font-medium text-gray-900">
                    ${Number(product.price).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center text-sm">
                    <span
                      className={
                        product.current_stock === 0
                          ? 'font-semibold text-red-600'
                          : product.low_stock
                          ? 'font-semibold text-amber-600'
                          : 'font-medium text-gray-900'
                      }
                    >
                      {product.current_stock}
                    </span>
                    {product.current_stock === 0 ? (
                      <Badge variant="danger" className="ml-2">Out</Badge>
                    ) : product.low_stock ? (
                      <Badge variant="warning" className="ml-2">Low</Badge>
                    ) : null}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEditModal(product)}
                        className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.product_id)}
                        className="rounded-md p-1.5 text-gray-600 hover:bg-red-50 hover:text-red-700"
                        title="Deactivate"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal} title="Add product">
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <Input label="Name *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <Input label="Category *" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required />
          <Input label="SKU" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price *" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
            <Input label="Cost" type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Initial stock" type="number" value={formData.current_stock} onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })} placeholder="0" />
            <Input label="Reorder level" type="number" value={formData.reorder_level} onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })} placeholder="10" />
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <Button type="button" variant="secondary" onClick={closeCreateModal}>Cancel</Button>
            <Button type="submit">Create product</Button>
          </div>
        </form>
      </Modal>

      {selectedProduct && (
        <Modal isOpen={isEditModalOpen} onClose={closeEditModal} title="Edit product">
          <form onSubmit={handleUpdateProduct} className="space-y-4">
            <Input label="Name *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            <Input label="Category *" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required />
            <Input label="SKU" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Price *" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
              <Input label="Cost" type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Current stock" type="number" value={formData.current_stock} onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })} />
              <Input label="Reorder level" type="number" value={formData.reorder_level} onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })} />
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
              <Button type="button" variant="secondary" onClick={closeEditModal}>Cancel</Button>
              <Button type="submit">Update product</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
