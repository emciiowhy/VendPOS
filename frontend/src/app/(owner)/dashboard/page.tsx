'use client';

import { useEffect, useState } from 'react';
import { DollarSign, ShoppingCart, AlertTriangle, TrendingUp } from 'lucide-react';
import Card from '@/components/ui/Card';
import Loading from '@/components/ui/Loading';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import api from '@/lib/api';
import { DashboardStats } from '@/types';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const response = await api.get('/reports/dashboard');
        setStats(response.data);
      } catch (error: any) {
        toast.error(error.message || 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) return <Loading text="Loading dashboard..." />;
  if (!stats) return <p className="text-sm text-gray-500">No data available.</p>;

  const money = (n: number) => `$${Number(n).toFixed(2)}`;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of today's activity across your tenant."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's revenue"
          value={money(stats.today.total_revenue)}
          hint={`${stats.today.total_transactions} transactions`}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          label="Avg transaction"
          value={money(stats.today.average_transaction)}
          hint="Today"
          icon={<ShoppingCart className="h-5 w-5" />}
        />
        <StatCard
          label="This month"
          value={money(stats.this_month.total_revenue)}
          hint={`${stats.this_month.total_transactions} transactions`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          label="Low stock alerts"
          value={stats.alerts.low_stock_count}
          hint="Items at or below reorder level"
          icon={<AlertTriangle className="h-5 w-5" />}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h2 className="text-sm font-semibold text-gray-900">Top products this month</h2>
          <p className="text-xs text-gray-500 mt-0.5">Ranked by revenue.</p>
          {stats.top_products.length === 0 ? (
            <p className="mt-6 text-sm text-gray-500">No data yet — make a sale to see this fill in.</p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100">
              {stats.top_products.map((p) => (
                <li key={p.name} className="py-2.5 flex justify-between text-sm">
                  <span className="text-gray-900">{p.name}</span>
                  <span className="text-gray-500">
                    {p.total_sold} sold · <span className="font-medium text-gray-900">{money(p.revenue)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-gray-900">Recent transactions</h2>
          <p className="text-xs text-gray-500 mt-0.5">Latest 5 checkouts.</p>
          {stats.recent_transactions.length === 0 ? (
            <p className="mt-6 text-sm text-gray-500">No transactions yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100">
              {stats.recent_transactions.map((t) => (
                <li key={t.transaction_id} className="py-2.5 flex justify-between text-sm">
                  <span className="text-gray-900">
                    #{t.transaction_id}{' '}
                    <span className="text-gray-500">· {t.cashier_name}</span>
                  </span>
                  <span className="font-medium text-gray-900">{money(t.total_amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
