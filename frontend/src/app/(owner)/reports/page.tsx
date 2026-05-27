'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Package, AlertCircle, BarChart3 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Loading from '@/components/ui/Loading';
import Badge from '@/components/ui/Badge';
import api from '@/lib/api';
import { formatCurrency, formatNumber, formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

interface ReportData {
  product_performance?: any;
  inventory_report?: any;
  daily_sales?: any;
}

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData>({});
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      // Fetch multiple reports
      const [inventoryRes, dashboardRes] = await Promise.all([
        api.get('/reports/inventory'),
        api.get('/reports/dashboard'),
      ]);

      setReportData({
        inventory_report: inventoryRes.data,
        daily_sales: dashboardRes.data,
      });
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loading text="Loading reports..." />;
  }

  const inventoryData = reportData.inventory_report;
  const salesData = reportData.daily_sales;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-900 bg-clip-text text-transparent">
            Reports & Analytics
          </h1>
        </div>
        <p className="text-gray-500">Insights into your business performance</p>
      </div>

      {/* Modern Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {['overview', 'inventory', 'sales', 'products'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 capitalize font-medium transition-all duration-200 rounded ${
              activeTab === tab
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <div className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-full -mr-6 -mt-6"></div>
                <div className="relative">
                  <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {formatCurrency(salesData?.today?.revenue || 0)}
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full -mr-6 -mt-6"></div>
                <div className="relative">
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {formatNumber(inventoryData?.summary?.total_products || 0)}
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-100 to-amber-50 rounded-full -mr-6 -mt-6"></div>
                <div className="relative">
                  <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                  <p className="text-3xl font-bold text-amber-600 mt-2">
                    {formatNumber(inventoryData?.summary?.low_stock_count || 0)}
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-100 to-purple-50 rounded-full -mr-6 -mt-6"></div>
                <div className="relative">
                  <p className="text-sm font-medium text-gray-600">Inventory Value</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {formatCurrency(inventoryData?.summary?.total_value || 0)}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Top Products */}
          <Card>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Top Selling Products This Month</h2>
            </div>
            {salesData?.top_products && salesData.top_products.length > 0 ? (
              <div className="space-y-3">
                {salesData.top_products.map((product: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:shadow-md transition-all border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.total_sold} sold</p>
                      </div>
                    </div>
                    <p className="font-bold text-gray-900">
                      {formatCurrency(product.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No sales data available</p>
            )}
          </Card>
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <Card>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Inventory Summary</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-600">Total Units</p>
                <p className="text-2xl font-bold text-blue-900 mt-2">
                  {formatNumber(inventoryData?.summary?.total_units || 0)}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
                <p className="text-sm font-medium text-emerald-600">Total Value</p>
                <p className="text-2xl font-bold text-emerald-900 mt-2">
                  {formatCurrency(inventoryData?.summary?.total_value || 0)}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200">
                <p className="text-sm font-medium text-amber-600">Low Stock</p>
                <p className="text-2xl font-bold text-amber-900 mt-2">
                  {formatNumber(inventoryData?.summary?.low_stock_count || 0)}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
                <p className="text-sm font-medium text-red-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-900 mt-2">
                  {formatNumber(inventoryData?.summary?.out_of_stock_count || 0)}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h2>
            </div>
            {inventoryData?.low_stock_items && inventoryData.low_stock_items.length > 0 ? (
              <div className="space-y-3">
                {inventoryData.low_stock_items.slice(0, 10).map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-300 hover:shadow-md transition-all"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{item.product_name}</p>
                      <p className="text-sm text-gray-600">
                        Reorder level: <span className="font-medium">{item.reorder_level}</span>
                      </p>
                    </div>
                    <Badge variant="warning">
                      {item.quantity} left
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">All items are well stocked!</p>
            )}
          </Card>
        </div>
      )}

      {/* Sales Tab */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Today's Performance</h2>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <span className="font-medium text-gray-700">Total Sales</span>
                  <span className="text-lg font-bold text-blue-900">{salesData?.today?.sales || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
                  <span className="font-medium text-gray-700">Revenue</span>
                  <span className="text-lg font-bold text-emerald-900">
                    {formatCurrency(salesData?.today?.revenue || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                  <span className="font-medium text-gray-700">Average Sale</span>
                  <span className="text-lg font-bold text-purple-900">
                    {formatCurrency(salesData?.today?.average_sale || 0)}
                  </span>
                </div>
              </div>
            </Card>

            <Card>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">This Month's Performance</h2>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <span className="font-medium text-gray-700">Total Sales</span>
                  <span className="text-lg font-bold text-blue-900">
                    {salesData?.this_month?.sales || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
                  <span className="font-medium text-gray-700">Revenue</span>
                  <span className="text-lg font-bold text-emerald-900">
                    {formatCurrency(salesData?.this_month?.revenue || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                  <span className="font-medium text-gray-700">Average Sale</span>
                  <span className="text-lg font-bold text-purple-900">
                    {formatCurrency(salesData?.this_month?.average_sale || 0)}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            </div>
            {salesData?.recent_sales && salesData.recent_sales.length > 0 ? (
              <div className="space-y-3">
                {salesData.recent_sales.map((sale: any) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:shadow-md transition-all border border-gray-200"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">Sale #{sale.id}</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(sale.created_at, 'long')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {formatCurrency(sale.total_amount)}
                      </p>
                      <Badge variant="success">{sale.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No recent sales</p>
            )}
          </Card>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <Card>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Inventory by Category</h2>
            </div>
            {inventoryData?.by_category && inventoryData.by_category.length > 0 ? (
              <div className="space-y-3">
                {inventoryData.by_category.map((cat: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:shadow-md transition-all border border-gray-200"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {cat.category || 'Uncategorized'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {cat.product_count} <span className="font-medium">products</span> • {cat.total_units} <span className="font-medium">units</span>
                      </p>
                    </div>
                    <p className="font-bold text-gray-900 text-lg">
                      {formatCurrency(cat.total_value)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No category data available</p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}