'use client';

import { useEffect, useState } from 'react';
import { Calendar, DollarSign, ShoppingBag, Eye, Download } from 'lucide-react';
import { exportToCSV } from '@/utils/exportHelpers';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import Empty from '@/components/ui/Empty';
import Modal from '@/components/ui/Modal';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import api from '@/lib/api';
import { Transaction } from '@/types';
import { formatCurrency, formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('today');

  useEffect(() => {
    setIsLoading(true);
    fetchTransactions();
  }, [dateFilter]);

  const fetchTransactions = async () => {
    try {
      const params: Record<string, string> = {};
      const now = new Date();
      if (dateFilter === 'today') {
        params.start_date = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        params.end_date = new Date(now.setHours(23, 59, 59, 999)).toISOString();
      } else if (dateFilter === 'week') {
        params.start_date = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (dateFilter === 'month') {
        params.start_date = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      }
      const qs = new URLSearchParams(params).toString();
      const response = await api.get(`/transactions?${qs}`);
      setTransactions(response.data.transactions || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load transactions', { duration: 5000 });
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const viewDetails = async (id: number) => {
    try {
      const response = await api.get(`/transactions/${id}`);
      setSelected(response.data.transaction);
      setIsDetailOpen(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load details');
    }
  };

  const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.total_amount), 0);
  const totalCount = transactions.length;
  const average = totalCount > 0 ? totalRevenue / totalCount : 0;

  if (isLoading) return <Loading text="Loading transactions..." />;

  return (
    <>
      <PageHeader
        title="Transactions"
        description="Append-only record of every checkout. No edits, no voids — see ADR-0001."
        action={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                const exportData = transactions.map((t) => ({
                  'Transaction ID': t.transaction_id,
                  Date: formatDate(t.created_at),
                  Cashier: t.cashier_name || 'Unknown',
                  Total: t.total_amount,
                }));
                exportToCSV(exportData, `transactions-${dateFilter}`);
              }}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <div className="ml-2 flex rounded-md border border-gray-200 bg-white p-0.5">
              {['today', 'week', 'month', 'all'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setDateFilter(filter)}
                  className={`rounded px-3 py-1 text-xs font-medium capitalize transition-colors ${
                    dateFilter === filter
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total revenue" value={formatCurrency(totalRevenue)} icon={<DollarSign className="h-5 w-5" />} />
        <StatCard label="Transactions" value={totalCount} icon={<ShoppingBag className="h-5 w-5" />} />

        <StatCard label="Average" value={formatCurrency(average)} icon={<Calendar className="h-5 w-5" />} />
      </div>

      {transactions.length === 0 ? (
        <div className="mt-6"><Empty title="No transactions" description="Transactions will appear here once checkouts happen" /></div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <th className="text-left py-3 px-4 font-semibold">ID</th>
                <th className="text-left py-3 px-4 font-semibold">Date</th>
                <th className="text-left py-3 px-4 font-semibold">Cashier</th>
                <th className="text-right py-3 px-4 font-semibold">Total</th>
                <th className="text-center py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((t) => (
                <tr key={t.transaction_id} className="hover:bg-gray-50/60">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">#{t.transaction_id}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{formatDate(t.created_at, 'long')}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{t.cashier_name || '—'}</td>
                  <td className="py-3 px-4 text-right text-sm font-medium text-gray-900">{formatCurrency(t.total_amount)}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => viewDetails(t.transaction_id)}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-800"
                    >
                      <Eye className="h-4 w-4" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelected(null); }}
        title={`Transaction #${selected?.transaction_id}`}
        size="lg"
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-medium">{formatDate(selected.created_at, 'long')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cashier</p>
                <p className="font-medium">{selected.cashier_name}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Items</h3>
              <div className="space-y-2">
                {selected.items?.map((item) => (
                  <div key={item.transaction_item_id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-gray-600">
                        {item.quantity} × {formatCurrency(item.unit_price)}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {formatCurrency(Number(item.unit_price) * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total</span>
                <span className="text-primary-600">{formatCurrency(selected.total_amount)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
