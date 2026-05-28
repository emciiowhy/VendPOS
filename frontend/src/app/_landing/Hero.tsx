import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* subtle radial-ish gradient backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-[640px] bg-gradient-to-b from-primary-50 via-white to-white"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-[640px] [mask-image:radial-gradient(50%_50%_at_50%_30%,black,transparent)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(800px_400px_at_50%_0%,rgba(37,99,235,0.08),transparent)]" />
      </div>

      <div className="mx-auto max-w-6xl px-6 pt-24 pb-20 sm:pt-32 sm:pb-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-primary-600" />
            Stock-safe checkout. Tenant-isolated. Audit-friendly.
          </div>
          <h1 className="mt-6 text-4xl sm:text-5xl font-semibold tracking-tight text-gray-900">
            The point-of-sale for{' '}
            <span className="bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              modern merchants.
            </span>
          </h1>
          <p className="mt-5 text-lg leading-7 text-gray-600">
            VendPOS gives your shop a clean checkout, real stock counts, and append-only sales history —
            without the legacy register baggage.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              Get started — it's free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Try the demo · Owner & Cashier credentials on the sign-in page
          </p>
        </div>

        {/* Mock dashboard preview */}
        <div className="mx-auto mt-16 max-w-5xl">
          <div className="relative rounded-xl border border-gray-200 bg-white shadow-2xl shadow-primary-900/10 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 bg-gray-50">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                <span className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <span className="text-xs text-gray-500 ml-2">app.vendpos.com/owner/dashboard</span>
            </div>
            <div className="p-8 grid grid-cols-3 gap-4">
              {[
                { label: "Today's revenue", value: '$842.10' },
                { label: 'Transactions', value: '47' },
                { label: 'Low stock', value: '2' },
              ].map((s) => (
                <div key={s.label} className="rounded-md border border-gray-200 p-4">
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="mt-1 text-xl font-semibold text-gray-900">{s.value}</p>
                </div>
              ))}
              <div className="col-span-3 mt-2 rounded-md border border-gray-200 p-4">
                <p className="text-xs text-gray-500 mb-2">Recent transactions</p>
                <div className="space-y-1.5 text-sm">
                  {['Espresso × 2 — $5.00', 'Almond Croissant × 1 — $3.95', 'Iced Latte × 2, Muffin × 1 — $12.25'].map((line) => (
                    <div key={line} className="flex justify-between text-gray-700">
                      <span>{line.split(' — ')[0]}</span>
                      <span className="font-medium text-gray-900">{line.split(' — ')[1]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
