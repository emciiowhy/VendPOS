import { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  trend?: { value: string; positive?: boolean };
}

// Single-stat tile. Monochrome, low chrome — relies on the figure
// to do the work. Replaces the prototype's rainbow gradient tiles.
export default function StatCard({ label, value, hint, icon, trend }: StatCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">{value}</p>
        {(hint || trend) && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            {trend && (
              <span
                className={
                  trend.positive === false
                    ? 'font-medium text-red-600'
                    : 'font-medium text-emerald-600'
                }
              >
                {trend.value}
              </span>
            )}
            {hint && <span className="text-gray-500">{hint}</span>}
          </div>
        )}
      </div>
      {icon && <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-50 text-gray-500 flex-shrink-0">{icon}</div>}
    </div>
  );
}
