'use client';

import { useEffect, useState } from 'react';
import { Package, AlertTriangle, TrendingDown, Search, Plus, Minus } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import Empty from '@/components/ui/Empty';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import api from '@/lib/api';
import { Inventory } from '@/types';
import { formatNumber } from '@/utils/helpers';
import toast from 'react-hot-toast';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const [adjustmentValue, setAdjustmentValue] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await api.get('/inventory');
      setInventory(response.data.inventory || []);
      setError(null);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load inventory';
      setError(errorMessage);
      setInventory([]);
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedItem || !adjustmentValue) {
      toast.error('Please enter adjustment amount');
      return;
    }

    try {
      const adjustment = adjustmentType === 'add' 
        ? parseInt(adjustmentValue) 
        : -parseInt(adjustmentValue);

      await api.post(`/inventory/${selectedItem.product_id}/adjust`, {
        adjustment,
        reason: adjustmentReason || 'Manual adjustment',
      });

      toast.success('Stock adjusted successfully', { duration: 5000 });
      setIsAdjustModalOpen(false);
      setSelectedItem(null);
      setAdjustmentValue('');
      setAdjustmentReason('');
      fetchInventory();
    } catch (error: any) {
      const errorMessage = error.message || error.response?.data?.message || 'Failed to adjust stock';
      toast.error(errorMessage, { duration: 5000 });
    }
  };

  const openAdjustModal = (item: Inventory) => {
    setSelectedItem(item);
    setAdjustmentValue('');
    setAdjustmentReason('');
    setAdjustmentType('add');
    setIsAdjustModalOpen(true);
  };

  const closeModal = () => {
    setIsAdjustModalOpen(false);
    setSelectedItem(null);
    setAdjustmentValue('');
    setAdjustmentReason('');
    setAdjustmentType('add');
  };

  const filteredInventory = inventory.filter((item) =>
    item.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockItems = inventory.filter(item => item.low_stock);
  const outOfStockItems = inventory.filter(item => item.quantity === 0);
  const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * 10), 0); // Approximate

  if (isLoading) {
    return <Loading text="Loading inventory..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-900 bg-clip-text text-transparent">
            Inventory Management
          </h1>
          <p className="text-gray-500 mt-2">Track and manage your stock levels in real-time</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full -mr-6 -mt-6"></div>
          <div className="relative">
            <p className="text-sm font-medium text-gray-600">Total Items</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{inventory.length}</p>
            <p className="text-xs text-gray-500 mt-2">Different products</p>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-100 to-amber-50 rounded-full -mr-6 -mt-6"></div>
          <div className="relative">
            <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{lowStockItems.length}</p>
            <p className="text-xs text-gray-500 mt-2">Need attention</p>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-100 to-red-50 rounded-full -mr-6 -mt-6"></div>
          <div className="relative">
            <p className="text-sm font-medium text-gray-600">Out of Stock</p>
            <p className="text-3xl font-bold text-red-600 mt-1">{outOfStockItems.length}</p>
            <p className="text-xs text-gray-500 mt-2">Zero quantity</p>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <Input
          placeholder="Search by product name, SKU, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Card>

      {/* Inventory Table */}
      {filteredInventory.length === 0 ? (
        <Empty
          title="No inventory items found"
          description={searchQuery ? 'Try adjusting your search criteria' : 'No products available to track'}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">Product</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">SKU</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">Category</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-700 text-sm">Quantity</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-700 text-sm">Status</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-700 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInventory.map((item) => (
                  <tr key={item.product_id} className="hover:bg-blue-50 transition-colors duration-150">
                    <td className="py-4 px-6 font-semibold text-gray-900">{item.product_name}</td>
                    <td className="py-4 px-6 text-gray-600 text-sm font-mono">{item.sku}</td>
                    <td className="py-4 px-6 text-gray-600 text-sm">{item.category}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`font-bold text-lg ${item.quantity === 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Badge
                        variant={
                          item.quantity === 0
                            ? 'danger'
                            : item.low_stock
                            ? 'warning'
                            : 'success'
                        }
                      >
                        {item.quantity === 0 ? 'Out of Stock' : item.low_stock ? 'Low Stock' : 'In Stock'}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => openAdjustModal(item)}
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Adjust Stock Modal */}
      {selectedItem && (
        <Modal
          isOpen={isAdjustModalOpen}
          onClose={() => {
            setIsAdjustModalOpen(false);
            setSelectedItem(null);
            setAdjustmentValue('');
            setAdjustmentReason('');
          }}
          title="Adjust Stock Level"
        >
          <div className="space-y-6">
            {/* Product Information */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <p className="text-sm font-medium text-blue-600 mb-1">Product</p>
              <p className="text-lg font-bold text-blue-900">{selectedItem.product_name}</p>
              <p className="text-sm text-blue-700 mt-2">Current Stock: <span className="font-bold">{selectedItem.quantity} units</span></p>
            </div>

            {/* Adjustment Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Adjustment Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAdjustmentType('add')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 font-medium transition-all ${
                    adjustmentType === 'add'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  Add Stock
                </button>
                <button
                  onClick={() => setAdjustmentType('subtract')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 font-medium transition-all ${
                    adjustmentType === 'subtract'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Minus className="w-5 h-5" />
                  Remove Stock
                </button>
              </div>
            </div>

            {/* Quantity Input */}
            <Input
              label="Quantity"
              type="number"
              value={adjustmentValue}
              onChange={(e) => setAdjustmentValue(e.target.value)}
              placeholder="Enter amount"
            />

            {/* Reason Input */}
            <Input
              label="Reason (optional)"
              value={adjustmentReason}
              onChange={(e) => setAdjustmentReason(e.target.value)}
              placeholder="e.g., Damaged items, Stock correction"
            />

            {/* Preview */}
            {adjustmentValue && (
              <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-amber-600">New Stock Level</span>
                  <span className="text-2xl font-bold text-amber-900">
                    {adjustmentType === 'add'
                      ? selectedItem.quantity + (parseInt(adjustmentValue) || 0)
                      : selectedItem.quantity - (parseInt(adjustmentValue) || 0)}
                  </span>
                </div>
                <p className="text-xs text-amber-700">
                  {adjustmentType === 'add' ? 'Adding' : 'Removing'} {adjustmentValue} units
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={closeModal}
              >
                Cancel
              </Button>
              <Button
                variant={adjustmentType === 'add' ? 'primary' : 'danger'}
                onClick={handleAdjustStock}
                disabled={!adjustmentValue || isLoading}
              >
                {isLoading ? 'Updating...' : adjustmentType === 'add' ? 'Add Stock' : 'Remove Stock'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}