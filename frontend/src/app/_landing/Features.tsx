import { Lock, Zap, ShieldCheck, Receipt, Package, Users } from 'lucide-react';

const features = [
  {
    icon: Lock,
    title: 'Tenant isolation by default',
    body: 'Every product, transaction, and user is scoped to your tenant. Cross-tenant data leaks are blocked at the middleware layer, not left to query authors.',
  },
  {
    icon: Zap,
    title: 'Race-safe stock decrement',
    body: 'Checkout decrements stock atomically. Two cashiers can never oversell the same item — verified by a concurrency prototype, not by hope.',
  },
  {
    icon: Receipt,
    title: 'Append-only transactions',
    body: 'Sales history is immutable once written. No silently edited totals. Voids and refunds are modeled as separate entries, not destructive edits.',
  },
  {
    icon: Package,
    title: 'Stock lives on the product',
    body: 'One number per product, where it belongs. No separate inventory table to keep in sync, no drift between the two.',
  },
  {
    icon: Users,
    title: 'Owners and Cashiers',
    body: 'Two clear roles with role-gated endpoints. Owners run the business, cashiers run the register. No fuzzy permission matrix to misconfigure.',
  },
  {
    icon: ShieldCheck,
    title: 'Audit-friendly by design',
    body: 'JWT-backed auth, structured request logging, and a transactional checkout that either commits in full or rolls back cleanly.',
  },
];

export default function Features() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-semibold tracking-tight text-gray-900">
          Built on guarantees, not vibes.
        </h2>
        <p className="mt-3 text-base text-gray-600">
          The boring parts of a POS — stock integrity, tenant isolation, audit trail — done right so you
          can think about your shop instead of your database.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px overflow-hidden rounded-xl bg-gray-200">
        {features.map(({ icon: Icon, title, body }) => (
          <div key={title} className="bg-white p-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-50 text-primary-700">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-gray-900">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
