'use client';

import { useEffect, useState } from 'react';
import { Package, AlertTriangle, TrendingDown, Search } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import Empty from '@/components/ui/Empty';
import Badge from '@/components/ui/Badge';
import Modal, { ModalFooter } from '@/components/ui/Modal';
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

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await api.get('/inventory');
      setInventory(response.data.inventory);
    } catch (error) {
      toast.error('Failed to load inventory');
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

      toast.success('Stock adjusted successfully');
      setIsAdjustModalOpen(false);
      setSelectedItem(null);
      setAdjustmentValue('');
      setAdjustmentReason('');
      fetchInventory();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to adjust stock');
    }
  };

  const openAdjustModal = (item: Inventory) => {
    setSelectedItem(item);
    setIsAdjustModalOpen(true);
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-500 mt-1">Track and manage your stock levels</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{inventory.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-orange-600">{lowStockItems.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{outOfStockItems.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </Card>

      {/* Inventory Table */}
      {filteredInventory.length === 0 ? (
        <Empty
          title="No inventory items found"
          description="Add products to start tracking inventory"
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Product</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">SKU</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Stock</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Reorder Level</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{item.product_name}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{item.sku || '-'}</td>
                    <td className="py-3 px-4 text-gray-600">{item.category || '-'}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-semibold ${
                        item.quantity === 0 
                          ? 'text-red-600' 
                          : item.low_stock 
                          ? 'text-orange-600' 
                          : 'text-gray-900'
                      }`}>
                        {formatNumber(item.quantity)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {formatNumber(item.reorder_level)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.quantity === 0 ? (
                        <Badge variant="danger">Out of Stock</Badge>
                      ) : item.low_stock ? (
                        <Badge variant="warning">Low Stock</Badge>
                      ) : (
                        <Badge variant="success">In Stock</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAdjustModal(item)}
                      >
                        Adjust
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => {
          setIsAdjustModalOpen(false);
          setSelectedItem(null);
          setAdjustmentValue('');
          setAdjustmentReason('');
        }}
        title={`Adjust Stock: ${selectedItem?.product_name}`}
      >
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Current Stock</p>
            <p className="text-2xl font-bold text-gray-900">
              {selectedItem?.quantity || 0} units
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adjustment Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setAdjustmentType('add')}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  adjustmentType === 'add'
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Add Stock
              </button>
              <button
                onClick={() => setAdjustmentType('subtract')}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  adjustmentType === 'subtract'
                    ? 'border-red-600 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Remove Stock
              </button>
            </div>
          </div>

          <Input
            label="Quantity"
            type="number"
            value={adjustmentValue}
            onChange={(e) => setAdjustmentValue(e.target.value)}
            placeholder="Enter amount"
            required
          />

          <Input
            label="Reason (optional)"
            value={adjustmentReason}
            onChange={(e) => setAdjustmentReason(e.target.value)}
            placeholder="e.g., Damaged items, Stock correction"
          />

          <ModalFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setIsAdjustModalOpen(false);
                setSelectedItem(null);
                setAdjustmentValue('');
                setAdjustmentReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant={adjustmentType === 'add' ? 'success' : 'danger'}
              onClick={handleAdjustStock}
            >
              {adjustmentType === 'add' ? 'Add' : 'Remove'} Stock
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  );
}