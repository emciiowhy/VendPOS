'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import Empty from '@/components/ui/Empty';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
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
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    price: '',
    cost: '',
    description: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data.products || []);
      setError(null);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load products';
      setError(errorMessage);
      setProducts([]);
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await api.post('/products', {
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost) || 0,
        description: formData.description,
      });

      toast.success('Product created successfully');
      setIsCreateModalOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create product';
      toast.error(errorMessage);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      await api.put(`/products/${selectedProduct.id}`, {
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost) || 0,
        description: formData.description,
      });

      toast.success('Product updated successfully');
      setIsEditModalOpen(false);
      setSelectedProduct(null);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update product';
      toast.error(errorMessage);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await api.delete(`/products/${productId}`);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete product';
      toast.error(errorMessage);
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
      description: product.description || '',
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      category: '',
      price: '',
      cost: '',
      description: '',
    });
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    resetForm();
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedProduct(null);
    resetForm();
  };

  if (isLoading) {
    return <Loading text="Loading products..." />;
  }

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-900 bg-clip-text text-transparent">
            Products
          </h1>
          <p className="text-gray-500 mt-2">Manage your product catalog</p>
        </div>
        <Button size="lg" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Add Product
        </Button>
      </div>

      {error && (
        <Card className="bg-red-50 border border-red-200">
          <p className="text-red-800">{error}</p>
        </Card>
      )}

      {/* Search */}
      <Card>
        <Input
          placeholder="Search by product name, SKU, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Card>

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <Empty
          title="No products found"
          description={searchQuery ? 'Try adjusting your search criteria' : 'No products in your catalog yet'}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">Product Name</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">SKU</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">Category</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700 text-sm">Price</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700 text-sm">Cost</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-700 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-blue-50 transition-colors duration-150">
                    <td className="py-4 px-6 font-semibold text-gray-900">{product.name}</td>
                    <td className="py-4 px-6 text-gray-600 text-sm font-mono">{product.sku || '-'}</td>
                    <td className="py-4 px-6 text-gray-600 text-sm">
                      {product.category ? <Badge variant="info">{product.category}</Badge> : '-'}
                    </td>
                    <td className="py-4 px-6 text-right font-semibold text-gray-900">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-right text-gray-600">
                      ${(product.cost || 0).toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors p-2 hover:bg-blue-100 rounded-lg"
                          title="Edit product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id.toString())}
                          className="inline-flex items-center gap-2 text-red-600 hover:text-red-800 font-medium text-sm transition-colors p-2 hover:bg-red-100 rounded-lg"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Product Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        title="Add New Product"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <Input
            label="Product Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter product name"
            required
          />

          <Input
            label="SKU *"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            placeholder="Enter SKU"
            required
          />

          <Input
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="Enter category"
          />

          <Input
            label="Price *"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="Enter price"
            required
          />

          <Input
            label="Cost"
            type="number"
            step="0.01"
            value={formData.cost}
            onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
            placeholder="Enter cost"
          />

          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter product description"
          />

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={closeCreateModal}>
              Cancel
            </Button>
            <Button type="submit">
              Create Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      {selectedProduct && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          title="Edit Product"
        >
          <form onSubmit={handleUpdateProduct} className="space-y-4">
            <Input
              label="Product Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter product name"
              required
            />

            <Input
              label="SKU *"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="Enter SKU"
              required
            />

            <Input
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="Enter category"
            />

            <Input
              label="Price *"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="Enter price"
              required
            />

            <Input
              label="Cost"
              type="number"
              step="0.01"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              placeholder="Enter cost"
            />

            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter product description"
            />

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={closeEditModal}>
                Cancel
              </Button>
              <Button type="submit">
                Update Product
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
