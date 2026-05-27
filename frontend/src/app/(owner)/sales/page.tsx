'use client';

import { useEffect, useState } from 'react';
import { Calendar, DollarSign, ShoppingBag, Eye, Download } from 'lucide-react';
import { exportToCSV } from '@/utils/exportHelpers';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import Empty from '@/components/ui/Empty';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import api from '@/lib/api';
import { Sale } from '@/types';
import { formatCurrency, formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('today');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchSales();
  }, [dateFilter]);

  const fetchSales = async () => {
    try {
      const params: any = {};
      
      const now = new Date();
      if (dateFilter === 'today') {
        params.start_date = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        params.end_date = new Date(now.setHours(23, 59, 59, 999)).toISOString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        params.start_date = weekAgo.toISOString();
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        params.start_date = monthAgo.toISOString();
      }

      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/sales?${queryString}`);
      setSales(response.data.sales || []);
      setError(null);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load sales. Please try again.';
      setError(errorMessage);
      setSales([]);
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  const viewSaleDetails = async (saleId: number) => {
    try {
      const response = await api.get(`/sales/${saleId}`);
      setSelectedSale(response.data.sale);
      setIsDetailModalOpen(true);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load sale details';
      toast.error(errorMessage, { duration: 5000 });
    }
  };

  const totalRevenue = sales
    .filter(s => s.status === 'completed')
    .reduce((sum, sale) => sum + sale.total_amount, 0);

  const totalSales = sales.filter(s => s.status === 'completed').length;
  const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;

  if (isLoading) {
    return <Loading text="Loading sales..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales History</h1>
          <p className="text-gray-500 mt-1">View all your transactions</p>
        </div>

        <div className="flex gap-3">
          {/* Export Button */}
          <Button
            variant="secondary"
            onClick={() => {
              const exportData = sales.map(sale => ({
                'Sale ID': sale.id,
                'Date': formatDate(sale.created_at),
                'Cashier': sale.cashier_name || 'Unknown',
                'Payment Method': sale.payment_method,
                'Total Amount': sale.total_amount,
                'Status': sale.status,
              }));
              exportToCSV(exportData, `sales-report-${dateFilter}`);
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>

          {/* Date Filter */}
          <div className="flex gap-2">
            {['today', 'week', 'month', 'all'].map((filter) => (
              <button
                key={filter}
                onClick={() => setDateFilter(filter)}
                className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                  dateFilter === filter
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">{totalSales}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Sale</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(averageSale)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Sales Table */}
      {sales.length === 0 ? (
        <Empty
          title="No sales found"
          description="Sales will appear here once you start making transactions"
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Sale ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Cashier</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Payment</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">#{sale.id}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {formatDate(sale.created_at, 'long')}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {sale.cashier_name || 'Unknown'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize text-gray-600">{sale.payment_method}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">
                      {formatCurrency(sale.total_amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant={
                          sale.status === 'completed'
                            ? 'success'
                            : sale.status === 'void'
                            ? 'danger'
                            : 'gray'
                        }
                      >
                        {sale.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => viewSaleDetails(sale.id)}
                        className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Sale Details Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedSale(null);
        }}
        title={`Sale #${selectedSale?.id}`}
        size="lg"
      >
        {selectedSale && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-medium">{formatDate(selectedSale.created_at, 'long')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cashier</p>
                <p className="font-medium">{selectedSale.cashier_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="font-medium capitalize">{selectedSale.payment_method}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge variant={selectedSale.status === 'completed' ? 'success' : 'danger'}>
                  {selectedSale.status}
                </Badge>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Items</h3>
              <div className="space-y-2">
                {selectedSale.items?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-gray-600">
                        {item.quantity} × {formatCurrency(item.unit_price)}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {formatCurrency(item.unit_price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total</span>
                <span className="text-primary-600">
                  {formatCurrency(selectedSale.total_amount)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}